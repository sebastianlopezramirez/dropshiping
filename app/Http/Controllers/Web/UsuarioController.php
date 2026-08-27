<?php

/*
|--------------------------------------------------------------------------
| CONTROLLER: UsuarioController
|--------------------------------------------------------------------------
|
| ¿QUÉ ES UN CONTROLLER EN LARAVEL?
|   Es una clase PHP que agrupa la lógica de un módulo.
|   Cada método del controller corresponde a una acción del CRUD:
|
|   index()   → GET  /usuarios       → listar todos
|   create()  → GET  /usuarios/create → mostrar formulario crear
|   store()   → POST /usuarios        → procesar y guardar nuevo usuario
|   show()    → GET  /usuarios/{id}   → ver detalles de uno
|   edit()    → GET  /usuarios/{id}/edit → mostrar formulario editar
|   update()  → PUT  /usuarios/{id}   → procesar y guardar cambios
|   destroy() → DELETE /usuarios/{id} → eliminar (soft delete)
|
| ¿QUÉ ES INERTIA EN EL CONTROLLER?
|   Inertia::render('Usuarios/Index', ['datos' => $datos])
|   Le pasa los datos al componente React como "props".
|   React los recibe como { datos } en el componente.
|
*/

namespace App\Http\Controllers\Web;

// Controller base de Laravel (da acceso a helpers comunes)
use App\Http\Controllers\Controller;

// El modelo que gestiona la tabla 'usuarios'
use App\Models\User;
use App\Models\Proveedor;

// Spatie: para consultar roles disponibles en el sistema
use Spatie\Permission\Models\Role;

// Request: encapsula todos los datos de la petición HTTP (POST, GET, etc.)
use Illuminate\Http\Request;

// RedirectResponse: tipo de retorno cuando hacemos redirecciones
use Illuminate\Http\RedirectResponse;

// Inertia: puente entre Laravel y React (envía datos como props)
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

// Hash: para encriptar contraseñas de forma segura
use Illuminate\Support\Facades\Hash;

// DB: para transacciones cuando necesitamos atomicidad
use Illuminate\Support\Facades\DB;

class UsuarioController extends Controller
{
    /**
     * INDEX — Listar todos los usuarios
     *
     * GET /usuarios
     *
     * ¿QUÉ APRENDE AQUÍ?
     *   - Eloquent with(): carga relaciones en la misma query (evita N+1)
     *   - paginate(): divide los resultados en páginas automáticamente
     *   - Inertia::render(): envía datos a React como props
     *   - withQueryString(): mantiene los filtros de búsqueda en la URL al paginar
     *
     * ¿QUÉ ES EL PROBLEMA N+1?
     *   Sin with('roles'): para 50 usuarios → 51 queries (1 por usuarios + 1 por cada rol)
     *   Con with('roles'): para 50 usuarios → 2 queries (1 usuarios + 1 todos los roles)
     */
    public function index(Request $request): InertiaResponse
    {
        // Construir la query base con filtros opcionales
        $query = User::query()
            // Cargar los roles de cada usuario en la misma query (eager loading)
            ->with('roles')
            // Ordenar por fecha de creación (más recientes primero)
            ->orderBy('creado_en', 'desc');

        // Filtro por búsqueda de texto (nombre o email)
        // $request->search → viene del campo de búsqueda en el frontend
        if ($request->filled('buscar')) {
            $query->where(function ($q) use ($request) {
                $q->where('nombre', 'ilike', '%' . $request->buscar . '%')
                  // ilike = LIKE insensible a mayúsculas (exclusivo de PostgreSQL)
                  ->orWhere('email', 'ilike', '%' . $request->buscar . '%');
            });
        }

        // Filtro por estado (activo / inactivo / suspendido)
        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        // Filtro por rol
        if ($request->filled('rol')) {
            $query->where('rol', $request->rol);
        }

        // Paginar: 15 usuarios por página
        // paginate() genera automáticamente los links de navegación
        $usuarios = $query->paginate(15)->withQueryString();
        // withQueryString(): si estás en página 2 con filtro "estado=activo",
        // los links de paginación mantienen ese filtro en la URL

        // Enviar a React: Usuarios/Index → resources/js/Pages/Usuarios/Index.jsx
        return Inertia::render('Usuarios/Index', [
            // La lista paginada de usuarios
            'usuarios' => $usuarios,

            // Los filtros actuales (para que React muestre qué filtros están activos)
            'filtros' => $request->only(['buscar', 'estado', 'rol']),

            // Estadísticas rápidas para el header de la página
            'estadisticas' => [
                'total'       => User::count(),
                'activos'     => User::where('estado', 'activo')->count(),
                'inactivos'   => User::where('estado', 'inactivo')->count(),
                'suspendidos' => User::where('estado', 'suspendido')->count(),
            ],
        ]);
    }

    /**
     * CREATE — Mostrar formulario de creación
     *
     * GET /usuarios/create
     *
     * Este método solo prepara los datos que el formulario necesita.
     * No procesa nada, solo renderiza la página.
     */
    public function create(): InertiaResponse
    {
        return Inertia::render('Usuarios/Crear', [
            // Lista de roles disponibles para el select del formulario
            // pluck() → ['super_administrador', 'administrador', 'vendedor', ...]
            'roles' => Role::pluck('name'),
        ]);
    }

    /**
     * STORE — Guardar nuevo usuario
     *
     * POST /usuarios
     *
     * ¿QUÉ ES LA VALIDACIÓN?
     *   Laravel valida los datos del form ANTES de tocar la BD.
     *   Si la validación falla, redirige de vuelta con los errores.
     *   React los recibe en el prop 'errors' de Inertia.
     */
    public function store(Request $request): RedirectResponse
    {
        // Validar los datos del formulario
        $datos = $request->validate([
            'nombre'     => 'required|string|max:100',
            // required: campo obligatorio
            // string: debe ser texto
            // max:100: máximo 100 caracteres

            'email'      => 'required|email|unique:usuarios,email',
            // email: debe tener formato válido (contiene @)
            // unique:usuarios,email: no puede existir otro usuario con ese email

            'contrasena' => 'required|string|min:8|confirmed',
            // min:8: mínimo 8 caracteres
            // confirmed: debe existir un campo 'contrasena_confirmation' con el mismo valor

            'telefono'   => 'nullable|string|max:20',
            // nullable: puede ser null (no es obligatorio)

            'rol'        => 'required|string|exists:roles,name',
            // exists:roles,name: el valor debe existir en la columna 'name' de la tabla 'roles'

            'estado'     => 'required|in:activo,inactivo,suspendido',
            // in: el valor debe ser uno de estos exactamente

            'limite_credito'  => 'nullable|numeric|min:0',
            'plazos_credito'  => 'nullable|integer|min:0',
            // Datos del proveedor (opcionales, solo aplican si rol=proveedor)
            'proveedor_nombre_empresa' => 'nullable|string|max:200',
            'proveedor_nit'            => 'nullable|string|max:50',
            'proveedor_ciudad'         => 'nullable|string|max:100',
            'proveedor_direccion'      => 'nullable|string|max:200',
            'proveedor_celular'        => 'nullable|string|max:20',
        ]);

        // Usar transacción: si algo falla, no quedará nada a medias
        DB::transaction(function () use ($datos) {
            // Crear el usuario en la tabla 'usuarios'
            $usuario = User::create([
                'nombre'          => $datos['nombre'],
                'email'           => $datos['email'],
                'contrasena'      => Hash::make($datos['contrasena']),
                // Hash::make() encripta la contraseña con bcrypt
                // NUNCA guardar contraseñas sin Hash

                'telefono'        => $datos['telefono'] ?? null,
                'rol'             => $datos['rol'],
                'estado'          => $datos['estado'],
                'email_verificado_en' => now(), // Lo marcamos como verificado (en desarrollo)
                'limite_credito'  => $datos['limite_credito'] ?? 0,
                'plazos_credito'  => $datos['plazos_credito'] ?? 0,
            ]);

            // Asignar el rol en Spatie (tabla modelo_tiene_roles)
            $usuario->assignRole($datos['rol']);

            // AUTO-CREAR PERFIL DE PROVEEDOR
            // Si el rol es 'proveedor', creamos automáticamente su registro
            // en la tabla 'proveedores'. Sin esto, el portal da 403 al entrar.
            // Ambas operaciones están en la misma transacción:
            // si falla la creación del proveedor, tampoco se guarda el usuario.
            if ($datos['rol'] === 'proveedor') {
                Proveedor::create([
                    'usuario_id'            => $usuario->id,
                    'nombre_empresa'        => $datos['proveedor_nombre_empresa'] ?? $datos['nombre'],
                    'numero_identificacion' => $datos['proveedor_nit'] ?? '000000000',
                    'persona_contacto'      => $datos['nombre'],
                    'telefono'              => $datos['proveedor_celular'] ?? $datos['telefono'] ?? null,
                    'email'                 => $datos['email'],
                    'ciudad'                => $datos['proveedor_ciudad'] ?? null,
                    'direccion'             => $datos['proveedor_direccion'] ?? null,
                    'estado'                => 'activo',
                ]);
            }
        });

        // Redirigir a la lista con mensaje de éxito
        // with(): Flash message (aparece una vez y desaparece)
        return redirect()
            ->route('usuarios.index')
            ->with('exito', 'Usuario creado exitosamente.');
    }

    /**
     * SHOW — Ver detalles de un usuario
     *
     * GET /usuarios/{usuario}
     *
     * Laravel hace "Route Model Binding": busca automáticamente el usuario
     * por su ID/UUID. Si no existe → responde 404 automáticamente.
     * No necesitas hacer User::findOrFail($id) manualmente.
     */
    public function show(User $usuario): InertiaResponse
    {
        // Cargar las relaciones del usuario
        $usuario->load('roles', 'permissions');

        return Inertia::render('Usuarios/Ver', [
            'usuario' => $usuario,
        ]);
    }

    /**
     * EDIT — Mostrar formulario de edición
     *
     * GET /usuarios/{usuario}/edit
     */
    public function edit(User $usuario): InertiaResponse
    {
        // Cargar los roles y el perfil de proveedor (si existe)
        $usuario->load('roles', 'proveedor');

        return Inertia::render('Usuarios/Editar', [
            'usuario' => $usuario,
            // Todos los roles disponibles para el select
            'roles'   => Role::pluck('name'),
        ]);
    }

    /**
     * UPDATE — Guardar cambios de un usuario
     *
     * PUT/PATCH /usuarios/{usuario}
     */
    public function update(Request $request, User $usuario): RedirectResponse
    {
        // Validación similar a store(), pero:
        // - La contraseña es opcional (solo si quieren cambiarla)
        // - El email es único EXCEPTO para el mismo usuario (ignore)
        $datos = $request->validate([
            'nombre'   => 'required|string|max:100',
            'email'    => 'required|email|unique:usuarios,email,' . $usuario->id,
            // unique con excepción del propio usuario:
            // si Sebastian mantiene su email, no debe dar error de "ya existe"

            'contrasena' => 'nullable|string|min:8|confirmed',
            // nullable: si viene vacío, no cambiamos la contraseña

            'telefono'        => 'nullable|string|max:20',
            'rol'             => 'required|string|exists:roles,name',
            'estado'          => 'required|in:activo,inactivo,suspendido',
            'limite_credito'  => 'nullable|numeric|min:0',
            'plazos_credito'  => 'nullable|integer|min:0',

            // Campos del perfil de proveedor (solo se usan si rol === 'proveedor')
            'proveedor_nombre_empresa'   => 'nullable|string|max:200',
            'proveedor_nit'              => 'nullable|string|max:50',
            'proveedor_persona_contacto' => 'nullable|string|max:100',
            'proveedor_sitio_web'        => 'nullable|url|max:500',
        ]);

        DB::transaction(function () use ($datos, $usuario) {
            // Preparar los datos a actualizar
            $actualizacion = [
                'nombre'         => $datos['nombre'],
                'email'          => $datos['email'],
                'telefono'       => $datos['telefono'] ?? null,
                'rol'            => $datos['rol'],
                'estado'         => $datos['estado'],
                'limite_credito' => $datos['limite_credito'] ?? 0,
                'plazos_credito' => $datos['plazos_credito'] ?? 0,
            ];

            // Solo actualizar contraseña si se envió una nueva
            if (!empty($datos['contrasena'])) {
                $actualizacion['contrasena'] = Hash::make($datos['contrasena']);
            }

            // Actualizar el registro en la BD
            $usuario->update($actualizacion);

            // Sincronizar el rol en Spatie
            // syncRoles() quita los roles actuales y asigna solo el nuevo
            $usuario->syncRoles([$datos['rol']]);

            // ACTUALIZAR O CREAR PERFIL DE PROVEEDOR
            // Si el rol es 'proveedor', persistimos los campos del perfil.
            // Si el proveedor ya existe → updateOrCreate lo actualiza.
            // Si no existe (rol cambiado a proveedor ahora) → lo crea.
            if ($datos['rol'] === 'proveedor') {
                Proveedor::updateOrCreate(
                    ['usuario_id' => $usuario->id],
                    [
                        'nombre_empresa'        => $datos['proveedor_nombre_empresa'] ?? $usuario->nombre,
                        'numero_identificacion' => $datos['proveedor_nit'] ?? '000000000',
                        'persona_contacto'      => $datos['proveedor_persona_contacto'] ?? $usuario->nombre,
                        'sitio_web'             => $datos['proveedor_sitio_web'] ?? null,
                        'telefono'              => $usuario->telefono,
                        'email'                 => $usuario->email,
                        'estado'                => 'activo',
                    ]
                );
            }
        });

        return redirect()
            ->route('usuarios.index')
            ->with('exito', 'Usuario actualizado exitosamente.');
    }

    /**
     * DESTROY — Eliminar un usuario (Soft Delete)
     *
     * DELETE /usuarios/{usuario}
     *
     * ¿QUÉ ES SOFT DELETE?
     *   En lugar de hacer DELETE en la BD, pone la fecha actual en 'eliminado_en'.
     *   El usuario "desaparece" de todas las consultas normales (Eloquent lo filtra).
     *   Pero el registro sigue en la BD → se puede recuperar.
     *
     *   Para ver usuarios eliminados: User::withTrashed()->get()
     *   Para restaurar: $usuario->restore()
     */
    public function destroy(User $usuario): RedirectResponse
    {
        // Evitar que el admin se auto-elimine
        if ($usuario->id === auth()->id()) {
            return back()->with('error', 'No puedes eliminar tu propio usuario.');
        }

        // Soft delete: pone fecha en columna 'eliminado_en'
        $usuario->delete();

        return redirect()
            ->route('usuarios.index')
            ->with('exito', 'Usuario eliminado exitosamente.');
    }

    /**
     * CAMBIAR ESTADO — Activo / Inactivo / Suspendido
     *
     * PATCH /usuarios/{usuario}/estado
     *
     * Esta ruta extra (no es parte del resource estándar) permite
     * cambiar el estado del usuario sin tener que editar todo su perfil.
     * Es más eficiente para un toggle rápido desde la tabla de usuarios.
     */
    public function cambiarEstado(Request $request, User $usuario): RedirectResponse
    {
        $datos = $request->validate([
            'estado' => 'required|in:activo,inactivo,suspendido',
        ]);

        $usuario->update(['estado' => $datos['estado']]);

        return back()->with('exito', 'Estado actualizado a: ' . $datos['estado']);
    }

    /**
     * CAMBIAR ROL — Asignar un nuevo rol
     *
     * PATCH /usuarios/{usuario}/rol
     */
    public function cambiarRol(Request $request, User $usuario): RedirectResponse
    {
        $datos = $request->validate([
            'rol' => 'required|string|exists:roles,name',
        ]);

        DB::transaction(function () use ($datos, $usuario) {
            // Actualizar el campo 'rol' en la tabla usuarios
            $usuario->update(['rol' => $datos['rol']]);

            // Sincronizar con Spatie (tabla modelo_tiene_roles)
            $usuario->syncRoles([$datos['rol']]);
        });

        return back()->with('exito', 'Rol actualizado a: ' . $datos['rol']);
    }
}
