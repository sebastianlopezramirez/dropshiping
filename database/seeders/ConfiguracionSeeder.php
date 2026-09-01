<?php
/*
|--------------------------------------------------------------------------
| Seeder: ConfiguracionSeeder
|--------------------------------------------------------------------------
| Inserta los valores por defecto de configuración.
| Se ejecuta con: php artisan db:seed --class=ConfiguracionSeeder
|
| IMPORTANTE: Usa updateOrCreate para que se pueda ejecutar múltiples
| veces sin duplicar registros.
*/

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Configuracion;

class ConfiguracionSeeder extends Seeder
{
    public function run(): void
    {
        $configuraciones = [
            [
                'clave'       => 'disponibilidad_hora_apertura',
                'valor'       => '8',
                'descripcion' => 'Hora de apertura del negocio (0-23, hora Colombia)',
            ],
            [
                'clave'       => 'disponibilidad_hora_cierre',
                'valor'       => '21',
                'descripcion' => 'Hora de cierre del negocio (0-23, hora Colombia)',
            ],
            [
                'clave'       => 'disponibilidad_mensaje_cerrado',
                'valor'       => 'Volvemos a las 8am',
                'descripcion' => 'Mensaje que aparece en el navbar cuando el negocio está cerrado',
            ],
            [
                'clave'       => 'disponibilidad_mensaje_abierto',
                'valor'       => 'Disponibles',
                'descripcion' => 'Mensaje que aparece en el navbar cuando el negocio está abierto',
            ],
        ];

        foreach ($configuraciones as $config) {
            Configuracion::updateOrCreate(
                ['clave' => $config['clave']],
                ['valor' => $config['valor'], 'descripcion' => $config['descripcion']]
            );
        }

        $this->command->info('✅ Configuraciones por defecto insertadas');
    }
}
