<?php

/*
|--------------------------------------------------------------------------
| SEEDER: TarifaDomicilioSeeder
|--------------------------------------------------------------------------
|
| Carga los precios de domicilio del área metropolitana de Medellín
| y ciudades principales del país.
|
| Precios área metro tomados de la lista oficial 2026.
| Precios otras ciudades son un estimado inicial — el admin puede editarlos.
|
| Para correr:  php artisan db:seed --class=TarifaDomicilioSeeder
|
*/

namespace Database\Seeders;

use App\Models\TarifaDomicilio;
use Illuminate\Database\Seeder;

class TarifaDomicilioSeeder extends Seeder
{
    public function run(): void
    {
        // ── ÁREA METROPOLITANA DE MEDELLÍN ────────────────────────────────
        $areaMetro = [
            ['nombre' => 'Medellín',            'precio' => 12000, 'orden' => 1],
            ['nombre' => 'Bello',               'precio' => 14000, 'orden' => 2],
            ['nombre' => 'Envigado',            'precio' => 14000, 'orden' => 3],
            ['nombre' => 'Itagüí',              'precio' => 14000, 'orden' => 4],
            ['nombre' => 'Sabaneta',            'precio' => 14000, 'orden' => 5],
            ['nombre' => 'La Estrella',         'precio' => 15000, 'orden' => 6],
            ['nombre' => 'San Cristóbal',       'precio' => 15000, 'orden' => 7],
            ['nombre' => 'Tablaza',             'precio' => 16000, 'orden' => 8],
            ['nombre' => 'Copacabana',          'precio' => 16000, 'orden' => 9],
            ['nombre' => 'San Antonio de Prado','precio' => 17000, 'orden' => 10],
            ['nombre' => 'Girardota',           'precio' => 25000, 'orden' => 11],
            ['nombre' => 'Caldas',              'precio' => 25000, 'orden' => 12],
        ];

        foreach ($areaMetro as $dato) {
            TarifaDomicilio::updateOrCreate(
                ['nombre' => $dato['nombre']],
                [
                    'tipo'   => 'area_metro',
                    'precio' => $dato['precio'],
                    'orden'  => $dato['orden'],
                    'activo' => true,
                ]
            );
        }

        // ── CIUDADES PRINCIPALES DEL PAÍS ─────────────────────────────────
        // Precios estimados — el admin los actualiza desde el panel
        $ciudades = [
            ['nombre' => 'Bogotá',        'precio' => 15000, 'orden' => 1],
            ['nombre' => 'Cali',          'precio' => 15000, 'orden' => 2],
            ['nombre' => 'Barranquilla',  'precio' => 17000, 'orden' => 3],
            ['nombre' => 'Cartagena',     'precio' => 17000, 'orden' => 4],
            ['nombre' => 'Bucaramanga',   'precio' => 15000, 'orden' => 5],
            ['nombre' => 'Pereira',       'precio' => 14000, 'orden' => 6],
            ['nombre' => 'Manizales',     'precio' => 14000, 'orden' => 7],
            ['nombre' => 'Armenia',       'precio' => 14000, 'orden' => 8],
            ['nombre' => 'Cúcuta',        'precio' => 17000, 'orden' => 9],
            ['nombre' => 'Santa Marta',   'precio' => 17000, 'orden' => 10],
            ['nombre' => 'Ibagué',        'precio' => 15000, 'orden' => 11],
            ['nombre' => 'Villavicencio', 'precio' => 17000, 'orden' => 12],
            ['nombre' => 'Pasto',         'precio' => 20000, 'orden' => 13],
            ['nombre' => 'Montería',      'precio' => 20000, 'orden' => 14],
            ['nombre' => 'Neiva',         'precio' => 18000, 'orden' => 15],
        ];

        foreach ($ciudades as $dato) {
            TarifaDomicilio::updateOrCreate(
                ['nombre' => $dato['nombre']],
                [
                    'tipo'   => 'ciudad',
                    'precio' => $dato['precio'],
                    'orden'  => $dato['orden'],
                    'activo' => true,
                ]
            );
        }

        $this->command->info('✅ Tarifas de domicilio cargadas correctamente.');
    }
}
