<?php
/*
|--------------------------------------------------------------------------
| Model: Configuracion
|--------------------------------------------------------------------------
| ENTENDER: Representa un par clave→valor de configuración del sistema.
|
| PENSAR:   Necesitamos un helper estático obtener($clave, $defecto) para
|           leer valores fácilmente desde cualquier parte del código sin
|           repetir la misma consulta.
|
| ESCRIBIR: Model simple con fillable + método estático de utilidad.
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Configuracion extends Model
{
    protected $table = 'configuraciones';

    protected $fillable = [
        'clave',
        'valor',
        'descripcion',
    ];

    /*
    |----------------------------------------------------------------------
    | obtener($clave, $defecto)
    |----------------------------------------------------------------------
    | Devuelve el valor de una clave. Si no existe, devuelve $defecto.
    | Usa caché de 60 minutos para no consultar la BD en cada request.
    */
    public static function obtener(string $clave, mixed $defecto = null): mixed
    {
        return Cache::remember("config_{$clave}", 3600, function () use ($clave, $defecto) {
            $registro = static::where('clave', $clave)->first();
            return $registro ? $registro->valor : $defecto;
        });
    }

    /*
    |----------------------------------------------------------------------
    | establecer($clave, $valor)
    |----------------------------------------------------------------------
    | Guarda o actualiza una clave. Borra la caché para que el siguiente
    | request vea el valor actualizado de inmediato.
    */
    public static function establecer(string $clave, mixed $valor, string $descripcion = ''): void
    {
        static::updateOrCreate(
            ['clave' => $clave],
            ['valor' => $valor, 'descripcion' => $descripcion]
        );
        Cache::forget("config_{$clave}");
    }
}
