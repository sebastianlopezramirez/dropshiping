<?php

/*
|--------------------------------------------------------------------------
| MODELO: GastoOperativo
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué es un gasto operativo?
|
|   Son los costos del negocio que no están ligados a un pedido concreto.
|   Al registrarlos con su categoría y fecha, el dashboard financiero
|   puede calcular la ganancia NETA real del mes:
|
|   Ganancia neta = Ingresos (transacciones aprobadas)
|                 - Costo productos (suma de precio_costo × cantidad en items_pedido)
|                 - Gastos operativos del período
|
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class GastoOperativo extends Model
{
    // ── CONFIGURACIÓN UUID ────────────────────────────────────────────────
    protected $table      = 'gastos_operativos';
    protected $keyType    = 'string';
    public    $incrementing = false;

    // ── FECHAS EN ESPAÑOL ─────────────────────────────────────────────────
    const CREATED_AT = 'creado_en';
    const UPDATED_AT = 'actualizado_en';

    // ── CATEGORÍAS ────────────────────────────────────────────────────────
    const CAT_PUBLICIDAD   = 'publicidad';
    const CAT_EMPAQUE      = 'empaque';
    const CAT_HOSTING      = 'hosting';
    const CAT_DOMINIO      = 'dominio';
    const CAT_HERRAMIENTAS = 'herramientas';
    const CAT_LOGISTICA    = 'logistica';
    const CAT_DEVOLUCION   = 'devolucion';
    const CAT_OTRO         = 'otro';

    // ── FILLABLE ──────────────────────────────────────────────────────────
    protected $fillable = [
        'categoria',
        'descripcion',
        'monto',
        'fecha_gasto',
        'notas',
        'usuario_id',
        'pedido_id',   // opcional: vincula el gasto a un pedido específico
    ];

    // ── CASTS ─────────────────────────────────────────────────────────────
    protected $casts = [
        'monto'      => 'decimal:2',
        'fecha_gasto' => 'date',      // Carbon date (sin hora)
        'creado_en'  => 'datetime',
    ];

    // ── BOOT: UUID automático ─────────────────────────────────────────────
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $gasto) {
            if (empty($gasto->id)) {
                $gasto->id = (string) Str::uuid();
            }
        });
    }

    // ── RELACIONES ────────────────────────────────────────────────────────

    /**
     * El usuario que registró el gasto.
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    /**
     * pedido() — El pedido asociado a este gasto (opcional).
     * Ejemplo: pago al domiciliario del pedido PED-2026-00045.
     */
    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class, 'pedido_id');
    }

    // ── SCOPES ────────────────────────────────────────────────────────────

    /**
     * Gastos del mes actual (por fecha_gasto, no por creado_en).
     * Uso: GastoOperativo::delMes()->sum('monto')
     */
    public function scopeDelMes($query)
    {
        return $query->whereMonth('fecha_gasto', now()->month)
                     ->whereYear('fecha_gasto', now()->year);
    }

    /**
     * Gastos de un mes/año específico.
     * Uso: GastoOperativo::delPeriodo(2026, 8)->get()
     */
    public function scopeDelPeriodo($query, int $año, int $mes)
    {
        return $query->whereYear('fecha_gasto', $año)
                     ->whereMonth('fecha_gasto', $mes);
    }

    /**
     * Gastos por categoría.
     * Uso: GastoOperativo::deCategoria('publicidad')->sum('monto')
     */
    public function scopeDeCategoria($query, string $categoria)
    {
        return $query->where('categoria', $categoria);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────

    /**
     * Etiqueta legible de la categoría.
     */
    public function etiquetaCategoria(): string
    {
        return self::etiquetasDeCategorias()[$this->categoria] ?? $this->categoria;
    }

    /**
     * Icono emoji para mostrar en el dashboard.
     */
    public function iconoCategoria(): string
    {
        return match($this->categoria) {
            self::CAT_PUBLICIDAD   => '📢',
            self::CAT_EMPAQUE      => '📦',
            self::CAT_HOSTING      => '🖥️',
            self::CAT_DOMINIO      => '🌐',
            self::CAT_HERRAMIENTAS => '🔧',
            self::CAT_LOGISTICA    => '🚚',
            self::CAT_DEVOLUCION   => '↩️',
            default                => '💰',
        };
    }

    // ── ESTÁTICOS ─────────────────────────────────────────────────────────

    /**
     * Array de todas las categorías para validaciones y selects.
     */
    public static function todasLasCategorias(): array
    {
        return [
            self::CAT_PUBLICIDAD,
            self::CAT_EMPAQUE,
            self::CAT_HOSTING,
            self::CAT_DOMINIO,
            self::CAT_HERRAMIENTAS,
            self::CAT_LOGISTICA,
            self::CAT_DEVOLUCION,
            self::CAT_OTRO,
        ];
    }

    /**
     * Mapa categoría → etiqueta legible.
     */
    public static function etiquetasDeCategorias(): array
    {
        return [
            self::CAT_PUBLICIDAD   => 'Publicidad',
            self::CAT_EMPAQUE      => 'Empaque',
            self::CAT_HOSTING      => 'Hosting',
            self::CAT_DOMINIO      => 'Dominio',
            self::CAT_HERRAMIENTAS => 'Herramientas y software',
            self::CAT_LOGISTICA    => 'Logística',
            self::CAT_DEVOLUCION   => 'Devolución',
            self::CAT_OTRO         => 'Otro',
        ];
    }

    /**
     * Categorías con etiqueta e icono (para selects React).
     * Retorna: [['value' => 'publicidad', 'label' => 'Publicidad', 'icono' => '📢'], ...]
     */
    public static function categoriasConEtiqueta(): array
    {
        $instancia = new self();
        return collect(self::todasLasCategorias())
            ->map(fn ($cat) => [
                'value'  => $cat,
                'label'  => self::etiquetasDeCategorias()[$cat],
                'icono'  => (new self(['categoria' => $cat]))->iconoCategoria(),
            ])
            ->toArray();
    }

    /**
     * Resumen de gastos por categoría para el dashboard.
     * Retorna: ['publicidad' => 350000, 'empaque' => 80000, ...]
     */
    public static function resumenPorCategoria(int $año, int $mes): array
    {
        return self::delPeriodo($año, $mes)
            ->selectRaw('categoria, SUM(monto) as total')
            ->groupBy('categoria')
            ->pluck('total', 'categoria')
            ->toArray();
    }
}
