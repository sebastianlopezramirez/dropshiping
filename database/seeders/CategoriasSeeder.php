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

            // ─── 1. TECNOLOGÍA ────────────────────────────────────────────
            [
                'nombre' => 'Tecnología',
                'orden'  => 1,
                'hijos'  => [
                    ['nombre' => 'Celulares y Smartphones',   'orden' => 1],
                    ['nombre' => 'Computadores y Laptops',    'orden' => 2],
                    ['nombre' => 'Tablets',                   'orden' => 3],
                    ['nombre' => 'Audio y Audífonos',         'orden' => 4],
                    ['nombre' => 'Smartwatches y Wearables',  'orden' => 5],
                    ['nombre' => 'Televisores y Pantallas',   'orden' => 6],
                    ['nombre' => 'Cámaras y Fotografía',      'orden' => 7],
                    ['nombre' => 'Gaming',                    'orden' => 8],
                    ['nombre' => 'Accesorios Tech',           'orden' => 9],
                ],
            ],

            // ─── 2. HOGAR ─────────────────────────────────────────────────
            [
                'nombre' => 'Hogar',
                'orden'  => 2,
                'hijos'  => [
                    ['nombre' => 'Decoración',                'orden' => 1],
                    ['nombre' => 'Iluminación',               'orden' => 2],
                    ['nombre' => 'Organización',              'orden' => 3],
                    ['nombre' => 'Cocina y Comedor',          'orden' => 4],
                    ['nombre' => 'Baño',                      'orden' => 5],
                    ['nombre' => 'Dormitorio',                'orden' => 6],
                    ['nombre' => 'Jardín y Exterior',         'orden' => 7],
                ],
            ],

            // ─── 3. ELECTRODOMÉSTICOS ─────────────────────────────────────
            [
                'nombre' => 'Electrodomésticos',
                'orden'  => 3,
                'hijos'  => [
                    ['nombre' => 'Pequeños Electrodomésticos','orden' => 1],
                    ['nombre' => 'Licuadoras y Freidoras',    'orden' => 2],
                    ['nombre' => 'Cuidado de Ropa',           'orden' => 3],
                    ['nombre' => 'Limpieza del Hogar',        'orden' => 4],
                    ['nombre' => 'Climatización',             'orden' => 5],
                ],
            ],

            // ─── 4. MODA ──────────────────────────────────────────────────
            [
                'nombre' => 'Moda',
                'orden'  => 4,
                'hijos'  => [
                    ['nombre' => 'Ropa Mujer',                'orden' => 1],
                    ['nombre' => 'Ropa Hombre',               'orden' => 2],
                    ['nombre' => 'Ropa Niños',                'orden' => 3],
                    ['nombre' => 'Calzado',                   'orden' => 4],
                    ['nombre' => 'Bolsos y Carteras',         'orden' => 5],
                    ['nombre' => 'Accesorios de Moda',        'orden' => 6],
                ],
            ],

            // ─── 5. BELLEZA Y CUIDADO PERSONAL ───────────────────────────
            [
                'nombre' => 'Belleza y Cuidado Personal',
                'orden'  => 5,
                'hijos'  => [
                    ['nombre' => 'Skincare',                  'orden' => 1],
                    ['nombre' => 'Maquillaje',                'orden' => 2],
                    ['nombre' => 'Cabello',                   'orden' => 3],
                    ['nombre' => 'Perfumes y Fragancias',     'orden' => 4],
                    ['nombre' => 'Cuidado Corporal',          'orden' => 5],
                    ['nombre' => 'Herramientas de Belleza',   'orden' => 6],
                ],
            ],

            // ─── 6. DEPORTES Y FITNESS ────────────────────────────────────
            [
                'nombre' => 'Deportes y Fitness',
                'orden'  => 6,
                'hijos'  => [
                    ['nombre' => 'Equipos de Ejercicio',      'orden' => 1],
                    ['nombre' => 'Ropa Deportiva',            'orden' => 2],
                    ['nombre' => 'Suplementos y Nutrición',   'orden' => 3],
                    ['nombre' => 'Outdoor y Camping',         'orden' => 4],
                    ['nombre' => 'Ciclismo',                  'orden' => 5],
                    ['nombre' => 'Yoga y Pilates',            'orden' => 6],
                ],
            ],

            // ─── 7. JUGUETES Y BEBÉS ──────────────────────────────────────
            [
                'nombre' => 'Juguetes y Bebés',
                'orden'  => 7,
                'hijos'  => [
                    ['nombre' => 'Juguetes Educativos',       'orden' => 1],
                    ['nombre' => 'Juegos de Mesa',            'orden' => 2],
                    ['nombre' => 'Bebés (0-3 años)',          'orden' => 3],
                    ['nombre' => 'Niños (4-12 años)',         'orden' => 4],
                    ['nombre' => 'Accesorios Bebé',           'orden' => 5],
                ],
            ],

            // ─── 8. MASCOTAS ──────────────────────────────────────────────
            [
                'nombre' => 'Mascotas',
                'orden'  => 8,
                'hijos'  => [
                    ['nombre' => 'Perros',                    'orden' => 1],
                    ['nombre' => 'Gatos',                     'orden' => 2],
                    ['nombre' => 'Accesorios para Mascotas',  'orden' => 3],
                    ['nombre' => 'Alimentos para Mascotas',   'orden' => 4],
                    ['nombre' => 'Higiene y Cuidado',         'orden' => 5],
                ],
            ],

            // ─── 9. LIBROS Y ENTRETENIMIENTO ──────────────────────────────
            [
                'nombre' => 'Libros y Entretenimiento',
                'orden'  => 9,
                'hijos'  => [
                    ['nombre' => 'Libros',                    'orden' => 1],
                    ['nombre' => 'Música',                    'orden' => 2],
                    ['nombre' => 'Películas y Series',        'orden' => 3],
                    ['nombre' => 'Papelería y Oficina',       'orden' => 4],
                ],
            ],

            // ─── 10. AUTOS Y MOTOS ────────────────────────────────────────
            [
                'nombre' => 'Autos y Motos',
                'orden'  => 10,
                'hijos'  => [
                    ['nombre' => 'Accesorios para Carro',    'orden' => 1],
                    ['nombre' => 'Accesorios para Moto',     'orden' => 2],
                    ['nombre' => 'Limpieza Vehicular',       'orden' => 3],
                    ['nombre' => 'Organización Vehicular',   'orden' => 4],
                    ['nombre' => 'Seguridad Vehicular',      'orden' => 5],
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
