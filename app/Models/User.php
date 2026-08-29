<?php

/*
|--------------------------------------------------------------------------
| MODELO: Usuario (User)
|--------------------------------------------------------------------------
|
| ¿QUÉ ES UN MODELO EN LARAVEL?
|
|   Un Modelo es la representación en PHP de una tabla de la base de datos.
|   Eloquent ORM (Object-Relational Mapping) traduce objetos PHP a SQL.
|
|   SIN Eloquent (SQL puro):
|     DB::select("SELECT * FROM usuarios WHERE id = ?", [$id]);
|
|   CON Eloquent:
|     User::find($id);
|
|   Eloquent hace el trabajo de traducción automáticamente.
|   Además agrega: relaciones, scopes, events, casting de tipos, etc.
|
| ¿POR QUÉ SE LLAMA 'User' Y NO 'Usuario'?
|
|   Laravel Breeze, Sanctum y todos los paquetes de auth de Laravel
|   buscan la clase 'App\Models\User' por convención.
|   Cambiarla a 'Usuario' requeriría actualizar decenas de referencias.
|
|   SOLUCIÓN: La clase se llama 'User' (convención de Laravel)
|             pero apunta a la tabla 'usuarios' (nuestra convención en español)
|
|   protected $table = 'usuarios'; ← aquí está el truco
|
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /*
    |----------------------------------------------------------------------
    | TRAITS — Funcionalidades reutilizables de Laravel
    |----------------------------------------------------------------------
    |
    | Los Traits en PHP son como "módulos" que agregan funcionalidades.
    | En lugar de copiar código, incluyes el trait y obtienes sus métodos.
    |
    | HasFactory   → permite crear usuarios falsos en tests y seeders
    |                User::factory()->create(['nombre' => 'Juan'])
    |
    | Notifiable   → permite enviar notificaciones al usuario
    |                $user->notify(new PedidoConfirmado($pedido))
    |
    | SoftDeletes  → cuando borras un usuario, no lo elimina de la BD
    |                Solo pone la fecha en 'eliminado_en'
    |                Los queries automáticamente excluyen registros borrados
    |
    | HasRoles     → de Spatie: agrega los métodos de roles y permisos
    |                $user->assignRole('vendedor')
    |                $user->hasPermissionTo('crear-productos')
    |                $user->can('ver-pedidos')
    |
    */
    use HasFactory, Notifiable, SoftDeletes, HasRoles;

    /*
    |----------------------------------------------------------------------
    | NOMBRE DE LA TABLA
    |----------------------------------------------------------------------
    |
    | Por defecto Laravel busca la tabla en plural snake_case del nombre
    | de la clase: User → 'users'. Lo sobreescribimos a 'usuarios'.
    |
    */
    protected $table = 'usuarios';

    /*
    |----------------------------------------------------------------------
    | CONFIGURACIÓN DE CLAVE PRIMARIA UUID
    |----------------------------------------------------------------------
    |
    | Por defecto Eloquent asume que la PK es un INTEGER autoincremental.
    | Como usamos UUID (string), debemos decirle explícitamente:
    |
    | $keyType = 'string'
    |   → Cuando Eloquent lee el UUID de la BD, NO lo castea a int.
    |   → Sin esto: (int)"61f364e9-..." = 61 → ERROR al guardar en sesiones.
    |
    | $incrementing = false
    |   → Le dice que la BD no genera el ID automáticamente.
    |   → El UUID viene del default de PostgreSQL: gen_random_uuid()
    |   → Sin esto: Laravel intenta insertar sin ID y espera que la BD lo genere
    |               pero luego no sabe cómo recuperarlo correctamente.
    |
    */
    protected $keyType = 'string';
    public $incrementing = false;

    /*
    |----------------------------------------------------------------------
    | boot() — Se ejecuta automáticamente al inicializar el modelo
    |----------------------------------------------------------------------
    |
    | ¿POR QUÉ NECESITAMOS ESTO?
    |
    |   Cuando usamos $incrementing = false, le decimos a Laravel:
    |   "la BD NO genera el ID, yo lo proveo".
    |
    |   Pero si en el seeder hacemos User::create([...]) sin incluir 'id',
    |   Laravel inserta el registro sin ID → PostgreSQL usa gen_random_uuid()
    |   como fallback → pero Laravel NUNCA va a buscar ese UUID generado
    |   (porque $incrementing = false) → $model->id queda en NULL.
    |
    |   SOLUCIÓN: Generar el UUID en PHP antes de insertar.
    |   El evento 'creating' se dispara justo antes de INSERT.
    |   Si el modelo no tiene ID aún, lo generamos aquí.
    |
    | REGLA PARA TODOS LOS MODELOS UUID DEL PROYECTO:
    |   Siempre agregar este boot() method.
    |
    */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            // Si el modelo no tiene ID asignado, generamos el UUID en PHP
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    /*
    |----------------------------------------------------------------------
    | NOMBRE DE LA COLUMNA DE CONTRASEÑA
    |----------------------------------------------------------------------
    |
    | Laravel busca la columna 'password' por defecto para autenticación.
    | Nosotros la llamamos 'contrasena'. Le decimos a Laravel dónde encontrarla.
    |
    */
    protected $authPasswordName = 'contrasena';

    /*
    |----------------------------------------------------------------------
    | COLUMNA DE SOFT DELETE
    |----------------------------------------------------------------------
    |
    | Le dice al trait SoftDeletes que use nuestra columna 'eliminado_en'
    | en lugar del default 'deleted_at'.
    |
    */
    protected const DELETED_AT = 'eliminado_en';

    /*
    |----------------------------------------------------------------------
    | NOMBRES DE TIMESTAMPS
    |----------------------------------------------------------------------
    |
    | Le dice a Eloquent que nuestras columnas de fecha se llaman
    | 'creado_en' y 'actualizado_en' en lugar del default
    | 'created_at' y 'updated_at'.
    |
    */
    const CREATED_AT = 'creado_en';
    const UPDATED_AT = 'actualizado_en';

    /*
    |----------------------------------------------------------------------
    | FILLABLE — Campos que se pueden asignar masivamente
    |----------------------------------------------------------------------
    |
    | PROBLEMA DE SEGURIDAD: "Mass Assignment Vulnerability"
    |
    |   Si un usuario malicioso envía: POST /usuarios {rol: "admin"}
    |   Y el código hace: User::create($request->all())
    |   → El usuario se convertiría en admin ← PELIGROSO
    |
    | SOLUCIÓN: $fillable lista SOLO los campos que se permiten asignar
    |           masivamente. Cualquier campo no listado es ignorado.
    |
    |   User::create(['nombre' => 'Juan', 'rol' => 'admin'])
    |   → Solo guarda 'nombre'. 'rol' es ignorado porque no está en $fillable.
    |
    */
    protected $fillable = [
        'nombre',               // Nombre completo del usuario
        'email',                // Email (login)
        'contrasena',           // Contraseña (se hashea automáticamente por el cast)
        'telefono',             // Teléfono opcional
        'direccion',            // Dirección JSONB
        'rol',                  // Rol principal: admin, vendedor, cliente, etc.
        'estado',               // activo / inactivo / suspendido
        'email_verificado_en',  // Cuándo verificó el email (null = no verificado)
        'url_avatar',           // URL de la foto de perfil (perfil propio)
        'google_id',            // ID de Google OAuth (null si registro por email)
        'avatar_url',           // URL del avatar de Google (null si registro por email)
        'limite_credito',       // Para clientes mayoristas
        'plazos_credito',       // Días de crédito
    ];

    /*
    |----------------------------------------------------------------------
    | HIDDEN — Campos que NUNCA aparecen en JSON/API responses
    |----------------------------------------------------------------------
    |
    | Cuando conviertes un usuario a JSON (response()->json($user))
    | estos campos son automáticamente excluidos.
    |
    | SIN hidden: {"nombre": "Juan", "contrasena": "$2y$12$...hash..."}
    | CON hidden:  {"nombre": "Juan"} ← la contraseña nunca se expone
    |
    */
    protected $hidden = [
        'contrasena',       // Nunca exponer el hash de la contraseña
        'remember_token',   // Token de "recordarme" — dato interno
    ];

    /*
    |----------------------------------------------------------------------
    | CASTS — Conversión automática de tipos
    |----------------------------------------------------------------------
    |
    | Laravel convierte automáticamente el tipo de datos al leer de la BD.
    |
    | 'email_verificado_en' => 'datetime'
    |   → La BD guarda un timestamp, Laravel lo convierte a Carbon (objeto fecha)
    |   → $user->email_verificado_en->diffForHumans() → "hace 3 días"
    |
    | 'contrasena' => 'hashed'
    |   → Cuando asignas $user->contrasena = '123456'
    |   → Laravel automáticamente lo hashea: bcrypt('123456')
    |   → Nunca se guarda la contraseña en texto plano
    |
    | 'direccion' => 'array'
    |   → La BD guarda JSON string: '{"calle":"Cra 7","ciudad":"Bogotá"}'
    |   → Laravel lo convierte automáticamente a array PHP al leer
    |   → $user->direccion['ciudad'] → "Bogotá"
    |
    | 'limite_credito' => 'decimal:2'
    |   → Siempre tendrá 2 decimales: 5000000.00
    |
    */
    protected function casts(): array
    {
        return [
            'email_verificado_en' => 'datetime', // timestamp → Carbon
            'contrasena'          => 'hashed',   // auto-hashea al asignar
            'direccion'           => 'array',    // JSON string → array PHP
            'limite_credito'      => 'decimal:2',
            'eliminado_en'        => 'datetime',
        ];
    }

    /*
    |----------------------------------------------------------------------
    | RELACIONES DE ELOQUENT
    |----------------------------------------------------------------------
    |
    | Las relaciones definen cómo se conectan los modelos entre sí.
    | Eloquent las traduce a JOINs y subconsultas SQL automáticamente.
    |
    */

    /**
     * Un usuario que es proveedor tiene UN perfil de proveedor.
     *
     * TIPO: hasOne (uno a uno)
     * SQL equivalente: SELECT * FROM proveedores WHERE usuario_id = ?
     *
     * Uso: $user->proveedor->nombre_empresa
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasOne
     */
    public function proveedor()
    {
        return $this->hasOne(Proveedor::class, 'usuario_id');
    }

    /**
     * Un cliente puede tener MUCHOS pedidos.
     *
     * TIPO: hasMany (uno a muchos)
     * SQL equivalente: SELECT * FROM pedidos WHERE cliente_id = ?
     *
     * Uso: $user->pedidos()->where('estado', 'pendiente')->get()
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function pedidos()
    {
        return $this->hasMany(\App\Models\Pedido::class, 'cliente_id');
    }

    /*
    |----------------------------------------------------------------------
    | LECCIÓN APRENDIDA: getAuthIdentifierName() NO es para el campo de login
    |----------------------------------------------------------------------
    |
    | getAuthIdentifierName() → retorna el nombre del campo que Laravel usa
    | para IDENTIFICAR al usuario en la sesión (user_id en tabla 'sesiones').
    | Debe ser la PRIMARY KEY ('id'), que es el UUID.
    |
    | El campo 'email' para login viene de las CREDENCIALES que envías al
    | método attempt(), no de este método.
    |
    | ERROR que causaba: getAuthIdentifierName() retornaba 'email',
    | entonces user_id en sesiones recibía "selora1988@gmail.com"
    | pero la columna es tipo UUID → SQLSTATE[22P02] error de tipo.
    |
    | REGLA: getAuthIdentifierName() siempre retorna la PK ('id').
    |
    */
    // No sobreescribimos getAuthIdentifierName() — el default retorna 'id' (correcto)

    /*
    |----------------------------------------------------------------------
    | getAuthPassword() — FIX CRÍTICO
    |----------------------------------------------------------------------
    |
    | ¿POR QUÉ NECESITAMOS ESTO?
    |
    |   Cuando el usuario hace login, Laravel internamente llama:
    |     Hash::check($passwordDelForm, $user->getAuthPassword())
    |
    |   El método getAuthPassword() por defecto en Laravel retorna:
    |     return $this->password;  ← busca la columna 'password'
    |
    |   Como nuestra columna se llama 'contrasena' (no 'password'),
    |   $this->password devuelve null → Hash::check falla → auth.failed
    |
    |   La propiedad $authPasswordName = 'contrasena' del modelo
    |   NO es automáticamente leída por Laravel 13 (es solo documental).
    |   Hay que sobreescribir el MÉTODO para que funcione.
    |
    | LECCIÓN APRENDIDA:
    |   En Laravel, si renombras una columna de infraestructura (password,
    |   remember_token, etc.) debes sobreescribir el método correspondiente,
    |   no solo declarar una propiedad.
    |
    */
    public function getAuthPassword(): string
    {
        // Retorna el hash almacenado en la columna 'contrasena'
        // Laravel comparará el input del usuario contra este valor
        return $this->contrasena;
    }
}
