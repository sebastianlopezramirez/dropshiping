<?php

/*
|--------------------------------------------------------------------------
| MODELO: Campana
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué representa este modelo?
|
|   Una campaña de marketing es un esfuerzo publicitario en un canal
|   (Instagram, TikTok, Google, etc.) durante un período.
|
|   Su utilidad es conectar el gasto en publicidad con las ventas reales:
|   Si una campaña de Instagram costó $200.000 y generó $800.000 en pedidos,
|   el ROI es del 300%.
|
| PENSAR — ¿Cómo se asocia una campaña a un pedido?
|
|   Cuando el vendedor crea un pedido, puede indicar de qué campaña vino
|   el cliente (por ejemplo, si el cliente mencionó "vi el story de Instagram").
|
|   También puede hacerse automáticamente mediante parámetros UTM en la URL:
|   el cliente entra por el link del anuncio → se guarda el utm_campaign
|   → al crear el pedido se asocia automáticamente.
|
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Campana extends Model
{
    protected $table = 'campanas';

    const CREATED_AT  = 'creado_en';
    const UPDATED_AT  = 'actualizado_en';

    protected $keyType   = 'string';
    public $incrementing = false;

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    protected $fillable = [
        'nombre',
        'descripcion',
        'canal',
        'presupuesto',
        'fecha_inicio',
        'fecha_fin',
        'codigo_utm',
        'url_destino',
        'estado',
        'notas',
    ];

    protected function casts(): array
    {
        return [
            'presupuesto'    => 'decimal:2',
            'fecha_inicio'   => 'date',
            'fecha_fin'      => 'date',
            'creado_en'      => 'datetime',
            'actualizado_en' => 'datetime',
        ];
    }

    /*
    |----------------------------------------------------------------------
    | RELACIONES
    |----------------------------------------------------------------------
    */

    /**
     * Pedidos que vinieron de esta campaña.
     * Con esto calculamos el ROI: cuánto se ganó vs. cuánto se invirtió.
     */
    public function pedidos(): HasMany
    {
        return $this->hasMany(Pedido::class, 'campana_id');
    }

    /*
    |----------------------------------------------------------------------
    | MÉTODOS DE NEGOCIO
    |----------------------------------------------------------------------
    */

    /**
     * Calcula el ROI (Return on Investment) de la campaña.
     *
     * ROI = ((ventas - presupuesto) / presupuesto) × 100
     *
     * Ejemplo:
     *   presupuesto = 200.000
     *   ventas      = 800.000
     *   ROI         = ((800.000 - 200.000) / 200.000) × 100 = 300%
     *
     * @return float|null — null si no tiene presupuesto definido
     */
    public function calcularRoi(): ?float
    {
        if (!$this->presupuesto || $this->presupuesto <= 0) {
            return null;
        }

        $ventas = $this->pedidos()
                       ->whereIn('estado', ['entregado', 'enviado', 'en_preparacion'])
                       ->sum('total');

        return round((($ventas - $this->presupuesto) / $this->presupuesto) * 100, 1);
    }

    /**
     * Total de ventas generadas por esta campaña.
     */
    public function totalVentas(): float
    {
        return (float) $this->pedidos()
                            ->whereIn('estado', ['entregado', 'enviado', 'en_preparacion'])
                            ->sum('total');
    }

    /*
    |----------------------------------------------------------------------
    | SCOPES
    |----------------------------------------------------------------------
    */

    public function scopeActivas($query)
    {
        return $query->where('estado', 'activa');
    }

    public function scopePorCanal($query, string $canal)
    {
        return $query->where('canal', $canal);
    }

    /*
    |----------------------------------------------------------------------
    | HELPERS
    |----------------------------------------------------------------------
    */

    /**
     * Etiqueta del canal para mostrar en la UI.
     */
    public function getLabelCanalAttribute(): string
    {
        return match($this->canal) {
            'instagram' => '📸 Instagram',
            'facebook'  => '👤 Facebook',
            'tiktok'    => '🎵 TikTok',
            'google'    => '🔍 Google',
            'youtube'   => '▶️ YouTube',
            'email'     => '📧 Email',
            'whatsapp'  => '💬 WhatsApp',
            default     => '📢 Otro',
        };
    }
}
