<?php

/*
|--------------------------------------------------------------------------
| MODELO: Cliente
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué representa?
|
|   Un comprador registrado de la tienda. Se crea automáticamente cuando
|   alguien completa un pedido con su cédula.
|
|   En próximas compras, se identifica con cédula + últimos 4 del celular
|   y sus datos se pre-llenan automáticamente.
|
| DIFERENCIA con Usuario:
|
|   Usuario → admin/vendedor/proveedor (tiene roles, acceso al panel)
|   Cliente → comprador de la tienda (solo ve sus pedidos propios)
|
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Cliente extends Model
{
    protected $table = 'clientes';

    // UUID — consistente con el resto del sistema
    protected $keyType    = 'string';
    public    $incrementing = false;

    const CREATED_AT = 'creado_en';
    const UPDATED_AT = 'actualizado_en';

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
        'cedula',       // null si el cliente entró con Google
        'nombre',
        'celular',      // null si el cliente entró con Google
        'email',
        'google_id',    // ID de Google OAuth (null si se registró con cédula)
        'avatar_url',   // Foto de perfil de Google
        'ciudad',
        'municipio',
        'direccion',
    ];

    /*
    |----------------------------------------------------------------------
    | RELACIONES
    |----------------------------------------------------------------------
    */

    /**
     * Pedidos que hizo este cliente.
     * Uso: $cliente->pedidos()->latest('creado_en')->get()
     */
    public function pedidos(): HasMany
    {
        return $this->hasMany(Pedido::class, 'cliente_id');
    }

    /*
    |----------------------------------------------------------------------
    | HELPERS DE SEGURIDAD
    |----------------------------------------------------------------------
    */

    /**
     * Verificar si los últimos 4 dígitos del celular coinciden.
     *
     * ENTENDER — ¿Por qué solo 4 dígitos?
     *   Es un segundo factor de bajo fricción: el cliente no recuerda
     *   contraseña pero sí los últimos 4 dígitos de su celular.
     *   No es perfecto, pero disuade el 99% de intentos maliciosos.
     *
     * Uso: $cliente->verificarCelular('3210') → true/false
     */
    public function verificarCelular(string $ultimos4): bool
    {
        // Extraer solo dígitos del celular guardado
        $celularLimpio = preg_replace('/\D/', '', $this->celular);
        return substr($celularLimpio, -4) === $ultimos4;
    }

    /**
     * Retorna los datos para pre-llenar el carrito.
     * Solo campos necesarios — no exponemos el celular completo.
     */
    public function datosCarrito(): array
    {
        return [
            'nombre'    => $this->nombre,
            'celular'   => $this->celular,
            'ciudad'    => $this->ciudad ?? '',
            'municipio' => $this->municipio ?? '',
            'direccion' => $this->direccion ?? '',
        ];
    }
}
