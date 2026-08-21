<?php

/*
|--------------------------------------------------------------------------
| SEEDER: DatabaseSeeder
|--------------------------------------------------------------------------
|
| ¿QUÉ ES ESTE ARCHIVO?
|   Es el seeder principal — el "director de orquesta".
|   Cuando corres: php artisan db:seed
|   Laravel solo ejecuta este archivo. Aquí decidimos en qué ORDEN
|   se ejecutan los demás seeders.
|
| ¿POR QUÉ IMPORTA EL ORDEN?
|   RolesYPermisosSeeder DEBE correr ANTES que UsuarioAdminSeeder.
|   Si no, assignRole('super_administrador') fallaría porque el rol
|   aún no existe en la base de datos.
|
|   Regla: siempre crea primero los datos que otros datos dependen de ellos.
|
*/

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Ejecutar todos los seeders del sistema.
     *
     * El método call() ejecuta cada seeder en el orden en que aparece.
     * Laravel espera a que uno termine antes de llamar al siguiente.
     */
    public function run(): void
    {
        $this->command->info('');
        $this->command->info('🌱 Iniciando proceso de siembra de datos...');
        $this->command->info('');

        $this->call([
            // 1. PRIMERO: roles y permisos (otros seeders dependen de esto)
            RolesYPermisosSeeder::class,

            // 2. SEGUNDO: usuario admin (necesita que el rol exista)
            UsuarioAdminSeeder::class,

            // 3. CATEGORÍAS: 10 categorías principales + 54 subcategorías
            CategoriasSeeder::class,
        ]);

        $this->command->info('');
        $this->command->info('🎉 ¡Base de datos sembrada exitosamente!');
        $this->command->info('   Puedes iniciar sesión en: http://localhost:8000');
        $this->command->info('   Email: selora1988@gmail.com');
        $this->command->info('   Clave: Admin2024!');
    }
}
