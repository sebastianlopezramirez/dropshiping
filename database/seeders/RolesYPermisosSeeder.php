<?php

/*
|--------------------------------------------------------------------------
| SEEDER: RolesYPermisosSeeder
|--------------------------------------------------------------------------
|
| ¿QUÉ ES ESTE ARCHIVO?
|   Un seeder es una clase que "siembra" datos iniciales en la base de datos.
|   Se ejecuta con: php artisan db:seed
|   O junto con las migraciones: php artisan migrate:fresh --seed
|
| ¿POR QUÉ ROLES Y PERMISOS?
|   Nuestro sistema tiene 6 tipos de usuario con accesos distintos.
|   En lugar de hardcodear "si usuario.rol == 'admin' entonces mostrar botón",
|   usamos Spatie que nos da un sistema granular y flexible:
|
|   ROLE (Rol) = conjunto de permisos agrupados con un nombre
|   PERMISSION (Permiso) = una acción específica sobre un recurso
|
|   Ejemplo de la vida real:
|   "vendedor" puede: ver-productos, crear-pedidos, ver-clientes
|   "vendedor" NO puede: eliminar-usuarios, gestionar-finanzas, cambiar-configuracion
|
| ¿QUÉ ROLES CREAMOS?
|   1. super_administrador → acceso total (el dueño del sistema)
|   2. administrador       → gestión del negocio (sin acceso a config crítica)
|   3. vendedor            → gestión de ventas y clientes
|   4. proveedor           → portal de proveedores (sus productos/pedidos)
|   5. soporte             → atención al cliente
|   6. cliente             → comprar en la tienda (acceso mínimo)
|
*/

namespace Database\Seeders;

// Importamos los modelos de Spatie (se instalaron con composer)
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

// Importamos DB para transacciones y Cache para limpiar el caché de permisos
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Seeder;

class RolesYPermisosSeeder extends Seeder
{
    /**
     * Ejecutar el seeder.
     *
     * ¿POR QUÉ USAMOS UNA TRANSACCIÓN?
     *   Si el seeder falla a la mitad (ej: error al crear un permiso),
     *   la transacción hace ROLLBACK automático → la BD queda limpia.
     *   Sin transacción, quedarían datos a medias y el seeder no se podría
     *   volver a correr sin errores de duplicados.
     */
    public function run(): void
    {
        // Limpiar caché de Spatie antes de empezar
        // Spatie cachea los roles/permisos para rendimiento.
        // Si corremos el seeder dos veces sin limpiar, puede dar errores raros.
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        DB::transaction(function () {

            /*
            |------------------------------------------------------------------
            | PASO 1: Definir todos los permisos del sistema
            |------------------------------------------------------------------
            |
            | ¿CÓMO NOMBRAR PERMISOS?
            |   Convención: "verbo-sustantivo" en español con guiones
            |   Ejemplos: crear-usuarios, ver-pedidos, eliminar-productos
            |
            | ¿POR QUÉ SEPARAR POR MÓDULO?
            |   Hace más fácil entender qué hace cada permiso y
            |   asignarlos al rol correcto abajo.
            |
            */

            // ===== MÓDULO: USUARIOS =====
            // ¿Quién puede gestionar otros usuarios?
            $permisosUsuarios = [
                'ver-usuarios',        // ver la lista de usuarios
                'crear-usuarios',      // crear nuevos usuarios
                'editar-usuarios',     // editar datos de un usuario
                'eliminar-usuarios',   // soft-delete de un usuario
                'asignar-roles',       // cambiar el rol de un usuario
            ];

            // ===== MÓDULO: PRODUCTOS =====
            // ¿Quién puede gestionar el catálogo?
            $permisosProductos = [
                'ver-productos',        // ver el catálogo completo
                'crear-productos',      // agregar nuevos productos
                'editar-productos',     // modificar precio, descripción, imágenes
                'eliminar-productos',   // quitar un producto del catálogo
                'publicar-productos',   // activar/desactivar la venta de un producto
                'importar-productos',   // importar desde Excel/proveedor
            ];

            // ===== MÓDULO: PEDIDOS =====
            // ¿Quién puede ver y gestionar pedidos?
            $permisosPedidos = [
                'ver-pedidos',          // ver todos los pedidos del sistema
                'ver-mis-pedidos',      // ver solo los pedidos propios (vendedor/cliente)
                'crear-pedidos',        // crear un pedido manualmente
                'editar-pedidos',       // modificar un pedido existente
                'cancelar-pedidos',     // cancelar un pedido
                'procesar-pedidos',     // cambiar estado: pendiente → enviado → entregado
                'ver-tracking',         // ver el tracking de envío
            ];

            // ===== MÓDULO: PROVEEDORES =====
            $permisosProveedores = [
                'ver-proveedores',       // ver la lista de proveedores
                'crear-proveedores',     // agregar nuevos proveedores
                'editar-proveedores',    // editar datos del proveedor
                'eliminar-proveedores',  // quitar un proveedor
                'aprobar-proveedores',   // aprobar/rechazar solicitudes de nuevos proveedores
            ];

            // ===== MÓDULO: FINANZAS =====
            $permisosFinanzas = [
                'ver-finanzas',          // ver reportes financieros
                'gestionar-finanzas',    // registrar pagos, ajustes
                'aprobar-credito',       // aprobar crédito a clientes mayoristas
                'ver-cartera',           // ver cuentas por cobrar
                'gestionar-cartera',     // gestionar pagos y vencimientos
            ];

            // ===== MÓDULO: MARKETING =====
            $permisosMarketing = [
                'ver-marketing',         // ver campañas y estadísticas
                'gestionar-campanas',    // crear y editar campañas
                'ver-clientes',          // ver base de datos de clientes
                'gestionar-clientes',    // editar info de clientes
            ];

            // ===== MÓDULO: REPORTES =====
            $permisosReportes = [
                'ver-reportes',          // ver todos los reportes
                'exportar-reportes',     // descargar Excel/PDF de reportes
            ];

            // ===== MÓDULO: CONFIGURACIÓN =====
            $permisosConfiguracion = [
                'gestionar-configuracion',  // cambiar settings del sistema
                'gestionar-integraciones',  // conectar APIs (Wompi, Meta, etc.)
                'ver-logs',                 // ver los logs del sistema
            ];

            // ===== UNIMOS TODOS EN UN ARRAY =====
            $todosLosPermisos = array_merge(
                $permisosUsuarios,
                $permisosProductos,
                $permisosPedidos,
                $permisosProveedores,
                $permisosFinanzas,
                $permisosMarketing,
                $permisosReportes,
                $permisosConfiguracion,
            );

            // ===== CREAMOS LOS PERMISOS EN LA BASE DE DATOS =====
            // firstOrCreate: si ya existe → no duplica, si no existe → lo crea
            // Esto es importante para poder correr el seeder varias veces sin errores
            foreach ($todosLosPermisos as $permiso) {
                Permission::firstOrCreate(['name' => $permiso, 'guard_name' => 'web']);
            }

            $this->command->info('✅ ' . count($todosLosPermisos) . ' permisos creados/verificados');

            /*
            |------------------------------------------------------------------
            | PASO 2: Crear los roles y asignarles permisos
            |------------------------------------------------------------------
            |
            | givePermissionTo() → asigna permisos individuales al rol
            | syncPermissions()  → asigna EXACTAMENTE esos permisos (borra los anteriores)
            |
            | Usamos syncPermissions para que al volver a correr el seeder,
            | los permisos se actualicen correctamente.
            |
            */

            // ─────────────────────────────────────────────
            // ROL 1: super_administrador
            // El dueño del sistema. Acceso total a todo.
            // ─────────────────────────────────────────────
            $superAdmin = Role::firstOrCreate(['name' => 'super_administrador', 'guard_name' => 'web']);
            // Le damos TODOS los permisos de una vez
            $superAdmin->syncPermissions($todosLosPermisos);
            $this->command->info('✅ Rol super_administrador creado con todos los permisos');

            // ─────────────────────────────────────────────
            // ROL 2: administrador
            // Gestiona el negocio pero no puede cambiar config crítica
            // ─────────────────────────────────────────────
            $admin = Role::firstOrCreate(['name' => 'administrador', 'guard_name' => 'web']);
            $admin->syncPermissions([
                // Usuarios — puede ver y editar pero NO asignar super_admin
                'ver-usuarios', 'crear-usuarios', 'editar-usuarios',
                // Productos — control total
                'ver-productos', 'crear-productos', 'editar-productos',
                'eliminar-productos', 'publicar-productos', 'importar-productos',
                // Pedidos — control total
                'ver-pedidos', 'crear-pedidos', 'editar-pedidos',
                'cancelar-pedidos', 'procesar-pedidos', 'ver-tracking',
                // Proveedores
                'ver-proveedores', 'crear-proveedores', 'editar-proveedores',
                'aprobar-proveedores',
                // Finanzas
                'ver-finanzas', 'gestionar-finanzas', 'aprobar-credito',
                'ver-cartera', 'gestionar-cartera',
                // Marketing
                'ver-marketing', 'gestionar-campanas', 'ver-clientes', 'gestionar-clientes',
                // Reportes
                'ver-reportes', 'exportar-reportes',
            ]);
            $this->command->info('✅ Rol administrador creado');

            // ─────────────────────────────────────────────
            // ROL 3: vendedor
            // Se enfoca en ventas y relación con clientes
            // ─────────────────────────────────────────────
            $vendedor = Role::firstOrCreate(['name' => 'vendedor', 'guard_name' => 'web']);
            $vendedor->syncPermissions([
                'ver-productos', 'ver-pedidos', 'ver-mis-pedidos',
                'crear-pedidos', 'procesar-pedidos', 'ver-tracking',
                'ver-clientes', 'gestionar-clientes',
                'ver-reportes',
            ]);
            $this->command->info('✅ Rol vendedor creado');

            // ─────────────────────────────────────────────
            // ROL 4: proveedor
            // Solo ve sus propios productos y pedidos relacionados
            // ─────────────────────────────────────────────
            $proveedor = Role::firstOrCreate(['name' => 'proveedor', 'guard_name' => 'web']);
            $proveedor->syncPermissions([
                'ver-productos', 'crear-productos', 'editar-productos',
                'ver-mis-pedidos', 'ver-tracking',
            ]);
            $this->command->info('✅ Rol proveedor creado');

            // ─────────────────────────────────────────────
            // ROL 5: soporte
            // Atiende clientes y resuelve problemas de pedidos
            // ─────────────────────────────────────────────
            $soporte = Role::firstOrCreate(['name' => 'soporte', 'guard_name' => 'web']);
            $soporte->syncPermissions([
                'ver-usuarios', 'ver-pedidos', 'editar-pedidos',
                'cancelar-pedidos', 'ver-tracking',
                'ver-clientes', 'gestionar-clientes',
            ]);
            $this->command->info('✅ Rol soporte creado');

            // ─────────────────────────────────────────────
            // ROL 6: cliente
            // El comprador. Acceso mínimo solo a sus datos
            // ─────────────────────────────────────────────
            $cliente = Role::firstOrCreate(['name' => 'cliente', 'guard_name' => 'web']);
            $cliente->syncPermissions([
                'ver-mis-pedidos',  // solo sus pedidos
                'ver-tracking',     // rastrear sus envíos
                'ver-productos',    // ver el catálogo
            ]);
            $this->command->info('✅ Rol cliente creado');

        }); // fin de la transacción

        $this->command->info('');
        $this->command->info('🎉 RolesYPermisosSeeder completado exitosamente');
    }
}
