<?php

/*
|--------------------------------------------------------------------------
| SEEDER: UsuarioAdminSeeder
|--------------------------------------------------------------------------
|
| ¿QUÉ HACE ESTE SEEDER?
|   Crea el primer usuario del sistema: el super administrador.
|   Sin este usuario, nadie puede entrar al sistema después de la instalación.
|
| CREDENCIALES DEL ADMIN:
|   Email:    selora1988@gmail.com
|   Clave:    Admin2024!
|
| ⚠️ IMPORTANTE:
|   Cambia la contraseña después del primer login desde el panel de perfil.
|   Estas credenciales NUNCA deben subirse a un repositorio de producción.
|
*/

namespace Database\Seeders;

// Importamos el modelo User (apunta a la tabla 'usuarios' en PostgreSQL)
use App\Models\User;

// Hash ya no es necesario aquí: el cast 'hashed' del modelo lo hace automáticamente
// use Illuminate\Support\Facades\Hash;

use Illuminate\Database\Seeder;

class UsuarioAdminSeeder extends Seeder
{
    /**
     * Crear el usuario super administrador inicial.
     *
     * ¿POR QUÉ updateOrCreate y no create()?
     *   Si corremos el seeder dos veces (ej: php artisan migrate:fresh --seed),
     *   create() daría error porque el email ya existe.
     *   updateOrCreate busca por email → si existe lo actualiza, si no existe lo crea.
     *   Así el seeder es idempotente (se puede correr N veces sin problemas).
     */
    public function run(): void
    {
        // ─────────────────────────────────────────────────────────
        // Crear o actualizar el usuario super administrador
        // ─────────────────────────────────────────────────────────
        $admin = User::updateOrCreate(
            // Buscar por este campo (clave de búsqueda)
            ['email' => 'selora1988@gmail.com'],

            // Si lo encuentra → actualizar estos datos
            // Si NO lo encuentra → crear con estos datos
            [
                'nombre'     => 'Sebastian',
                'contrasena' => 'Admin2024!',
                // ⚠️ NO usar Hash::make() aquí — ya lo hace el cast automáticamente.
                //
                // El modelo tiene: 'contrasena' => 'hashed' en casts().
                // Esto significa: cada vez que asignas $user->contrasena = 'valor',
                // Laravel ejecuta Hash::make('valor') automáticamente antes de guardar.
                //
                // Si pasamos Hash::make('Admin2024!') aquí, el cast volvería a
                // hashearlo → contraseña DOBLE hasheada → login falla siempre.
                //
                // Pasar el texto plano 'Admin2024!' → el cast lo hashea una sola vez ✅

                'rol'    => 'super_administrador',
                'estado' => 'activo',

                // Marcamos el email como verificado desde el principio
                // para no necesitar el flujo de verificación en desarrollo.
                // new \DateTime() = fecha y hora actual
                'email_verificado_en' => now(),
            ]
        );

        // ─────────────────────────────────────────────────────────
        // Asignar el rol de Spatie al usuario
        // ─────────────────────────────────────────────────────────
        // Ojo: el campo 'rol' en la tabla usuarios es solo informativo.
        // El sistema real de permisos vive en las tablas de Spatie:
        //   modelo_tiene_roles → conecta User con Role
        //
        // assignRole() de Spatie:
        //   1. Busca el rol 'super_administrador' en la tabla 'roles'
        //   2. Inserta un registro en 'modelo_tiene_roles'
        //   3. Ahora $admin->hasRole('super_administrador') → true
        $admin->assignRole('super_administrador');

        // ─────────────────────────────────────────────────────────
        // Confirmación en consola cuando corres php artisan db:seed
        // ─────────────────────────────────────────────────────────
        $this->command->info('✅ Usuario admin creado: selora1988@gmail.com');
        $this->command->info('   Rol asignado: super_administrador');
        $this->command->warn('   ⚠️  Cambia la contraseña después del primer login');
    }
}
