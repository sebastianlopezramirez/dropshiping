<?php

/*
|--------------------------------------------------------------------------
| SEEDER: CategoriasSeeder
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace este seeder?
|
|   Crea las 10 categorías principales y sus subcategorías en la BD.
|   Estructura basada en MercadoLibre Colombia y tendencias dropshipping 2025.
|
| PENSAR — ¿Cómo funciona el árbol de categorías?
|
|   Primero insertamos las categorías padre (padre_id = null).
|   Luego insertamos las hijas apuntando al id del padre.
|   Usamos firstOrCreate() para que sea IDEMPOTENTE:
|   si corres el seeder dos veces, no duplica las categorías.
|
| EJECUTAR:
|   php artisan db:seed --class=CategoriasSeeder
|
*/

namespace Database\Seeders;

use App\Models\Categoria;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategoriasSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('📂 Creando categorías y subcategorías...');

        /*
        |----------------------------------------------------------------------
        | ESTRUCTURA DE CATEGORÍAS
        |----------------------------------------------------------------------
        |
        | Cada entrada del array principal es una categoría raíz.
        | La clave 'hijos' contiene sus subcategorías.
        |
        */
        $categorias = [

            // ─── 1. TECNOLOGÍA Y GADGETS ──────────────────────────────────
            [
                'nombre' => 'Tecnología y Gadgets',
                'orden'  => 1,
                'hijos'  => [
                    ['nombre' => 'Accesorios para Celular',   'orden' => 1],
                    ['nombre' => 'Audífonos y Parlantes',     'orden' => 2],
                    ['nombre' => 'Cargadores y Cables',       'orden' => 3],
                    ['nombre' => 'Gadgets Inteligentes',      'orden' => 4],
                    ['nombre' => 'Cámaras y Accesorios',      'orden' => 5],
                    ['nombre' => 'Relojes Inteligentes',      'orden' => 6],
                ],
            ],

            // ─── 2. HOGAR Y COCINA ────────────────────────────────────────
            [
                'nombre' => 'Hogar y Cocina',
                'orden'  => 2,
                'hijos'  => [
                    ['nombre' => 'Organización del Hogar',   'orden' => 1],
                    ['nombre' => 'Utensilios de Cocina',     'orden' => 2],
                    ['nombre' => 'Decoración',               'orden' => 3],
                    ['nombre' => 'Iluminación',              'orden' => 4],
                    ['nombre' => 'Limpieza del Hogar',       'orden' => 5],
                    ['nombre' => 'Baño y Sanitarios',        'orden' => 6],
                ],
            ],

            // ─── 3. SALUD Y BELLEZA ───────────────────────────────────────
            [
                'nombre' => 'Salud y Belleza',
                'orden'  => 3,
                'hijos'  => [
                    ['nombre' => 'Cuidado de la Piel',       'orden' => 1],
                    ['nombre' => 'Maquillaje',               'orden' => 2],
                    ['nombre' => 'Cuidado del Cabello',      'orden' => 3],
                    ['nombre' => 'Masajes y Relajación',     'orden' => 4],
                    ['nombre' => 'Fitness en Casa',          'orden' => 5],
                    ['nombre' => 'Salud y Bienestar',        'orden' => 6],
                ],
            ],

            // ─── 4. MODA Y ACCESORIOS ─────────────────────────────────────
            [
                'nombre' => 'Moda y Accesorios',
                'orden'  => 4,
                'hijos'  => [
                    ['nombre' => 'Relojes',                  'orden' => 1],
                    ['nombre' => 'Bolsos y Billeteras',      'orden' => 2],
                    ['nombre' => 'Bisutería y Joyería',      'orden' => 3],
                    ['nombre' => 'Gafas y Lentes',           'orden' => 4],
                    ['nombre' => 'Gorras y Sombreros',       'orden' => 5],
                    ['nombre' => 'Cinturones',               'orden' => 6],
                ],
            ],

            // ─── 5. DEPORTES Y FITNESS ────────────────────────────────────
            [
                'nombre' => 'Deportes y Fitness',
                'orden'  => 5,
                'hijos'  => [
                    ['nombre' => 'Ropa Deportiva',           'orden' => 1],
                    ['nombre' => 'Accesorios de Entrenamiento', 'orden' => 2],
                    ['nombre' => 'Ciclismo',                 'orden' => 3],
                    ['nombre' => 'Yoga y Pilates',           'orden' => 4],
                    ['nombre' => 'Natación',                 'orden' => 5],
                    ['nombre' => 'Suplementos y Nutrición',  'orden' => 6],
                ],
            ],

            // ─── 6. BEBÉS Y NIÑOS ─────────────────────────────────────────
            [
                'nombre' => 'Bebés y Niños',
                'orden'  => 6,
                'hijos'  => [
                    ['nombre' => 'Juguetes Educativos',      'orden' => 1],
                    ['nombre' => 'Ropa para Bebé',           'orden' => 2],
                    ['nombre' => 'Accesorios para Bebé',     'orden' => 3],
                    ['nombre' => 'Seguridad Infantil',       'orden' => 4],
                    ['nombre' => 'Movilidad y Paseos',       'orden' => 5],
                ],
            ],

            // ─── 7. MASCOTAS ──────────────────────────────────────────────
            [
                'nombre' => 'Mascotas',
                'orden'  => 7,
                'hijos'  => [
                    ['nombre' => 'Accesorios para Perros',   'orden' => 1],
                    ['nombre' => 'Accesorios para Gatos',    'orden' => 2],
                    ['nombre' => 'Alimentación',             'orden' => 3],
                    ['nombre' => 'Juguetes para Mascotas',   'orden' => 4],
                    ['nombre' => 'Higiene y Cuidado',        'orden' => 5],
                ],
            ],

            // ─── 8. HERRAMIENTAS Y JARDÍN ─────────────────────────────────
            [
                'nombre' => 'Herramientas y Jardín',
                'orden'  => 8,
                'hijos'  => [
                    ['nombre' => 'Herramientas Eléctricas',  'orden' => 1],
                    ['nombre' => 'Herramientas Manuales',    'orden' => 2],
                    ['nombre' => 'Jardín y Plantas',         'orden' => 3],
                    ['nombre' => 'Seguridad del Hogar',      'orden' => 4],
                    ['nombre' => 'Plomería y Electricidad',  'orden' => 5],
                ],
            ],

            // ─── 9. AUTOS Y MOTOS ─────────────────────────────────────────
            [
                'nombre' => 'Autos y Motos',
                'orden'  => 9,
                'hijos'  => [
                    ['nombre' => 'Accesorios para Carro',   'orden' => 1],
                    ['nombre' => 'Accesorios para Moto',    'orden' => 2],
                    ['nombre' => 'Limpieza Vehicular',      'orden' => 3],
                    ['nombre' => 'Organización del Vehículo','orden' => 4],
                    ['nombre' => 'Seguridad Vehicular',     'orden' => 5],
                ],
            ],

            // ─── 10. OFICINA Y PAPELERÍA ──────────────────────────────────
            [
                'nombre' => 'Oficina y Papelería',
                'orden'  => 10,
                'hijos'  => [
                    ['nombre' => 'Escritorio y Organización', 'orden' => 1],
                    ['nombre' => 'Papelería',                 'orden' => 2],
                    ['nombre' => 'Impresión y Tóner',         'orden' => 3],
                    ['nombre' => 'Sillas y Ergonomía',        'orden' => 4],
                ],
            ],

        ];

        /*
        |----------------------------------------------------------------------
        | INSERTAR CATEGORÍAS EN LA BASE DE DATOS
        |----------------------------------------------------------------------
        |
        | firstOrCreate() → busca por 'slug', si no existe lo crea.
        | Esto hace el seeder idempotente (seguro de correr varias veces).
        |
        */
        $ahora = now();
        $totalPadres = 0;
        $totalHijos  = 0;

        foreach ($categorias as $datosPadre) {
            $hijos = $datosPadre['hijos'] ?? [];
            unset($datosPadre['hijos']);

            // Crear categoría padre
            $padre = Categoria::firstOrCreate(
                ['slug' => Str::slug($datosPadre['nombre'])],
                [
                    'nombre'        => $datosPadre['nombre'],
                    'orden'         => $datosPadre['orden'],
                    'activo'        => true,
                    'creado_en'     => $ahora,
                    'actualizado_en'=> $ahora,
                ]
            );
            $totalPadres++;

            // Crear subcategorías apuntando al padre
            foreach ($hijos as $datosHijo) {
                Categoria::firstOrCreate(
                    ['slug' => Str::slug($datosHijo['nombre'])],
                    [
                        'nombre'        => $datosHijo['nombre'],
                        'padre_id'      => $padre->id,
                        'orden'         => $datosHijo['orden'],
                        'activo'        => true,
                        'creado_en'     => $ahora,
                        'actualizado_en'=> $ahora,
                    ]
                );
                $totalHijos++;
            }
        }

        $this->command->info("✅ {$totalPadres} categorías principales creadas.");
        $this->command->info("✅ {$totalHijos} subcategorías creadas.");
    }
}
