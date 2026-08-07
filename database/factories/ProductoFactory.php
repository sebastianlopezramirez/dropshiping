<?php

/*
|--------------------------------------------------------------------------
| FACTORY: ProductoFactory
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Para qué sirve esta factory?
|
|   Genera productos falsos para los tests.
|   Un producto necesita obligatoriamente una categoría (categoria_id).
|
|   Uso típico en tests:
|     $categoria = Categoria::factory()->create();
|     $producto  = Producto::factory()->create(['categoria_id' => $categoria->id]);
|
|   O con el estado helper:
|     $producto = Producto::factory()->paraCategoria($categoria)->create();
|
*/

namespace Database\Factories;

use App\Models\Categoria;
use App\Models\Producto;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Producto>
 */
class ProductoFactory extends Factory
{
    /**
     * Define el estado por defecto de un producto.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Genera nombre único para evitar colisión de slugs en tests
        $nombre = fake()->unique()->words(3, true);
        $precio = fake()->numberBetween(20000, 500000);

        return [
            'nombre'          => ucwords($nombre),
            'slug'            => Str::slug($nombre) . '-' . fake()->randomNumber(4),
            'sku'             => strtoupper(fake()->bothify('??-####')),
            'descripcion_corta' => fake()->sentence(),
            'descripcion'     => fake()->paragraphs(2, true),
            'precio_costo'    => $precio * 0.6,
            'precio_venta'    => $precio,
            'precio_oferta'   => null,     // sin oferta por defecto
            'stock'           => fake()->numberBetween(0, 100),
            'stock_minimo'    => 5,
            'imagenes'        => null,     // sin imágenes en tests
            'atributos'       => null,
            'categoria_id'    => Categoria::factory(), // crea una categoría si no se pasa una
            'estado'          => 'activo',
        ];
    }

    /*
    |----------------------------------------------------------------------
    | ESTADO: inactivo()
    |----------------------------------------------------------------------
    |
    | Uso: Producto::factory()->inactivo()->create()
    | Testea que los productos inactivos no aparecen en la tienda.
    |
    */
    public function inactivo(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'inactivo',
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | ESTADO: conOferta()
    |----------------------------------------------------------------------
    |
    | Uso: Producto::factory()->conOferta()->create()
    | Testea que el badge de descuento aparece correctamente.
    |
    */
    public function conOferta(): static
    {
        return $this->state(function (array $attributes) {
            $precioVenta = $attributes['precio_venta'];
            return [
                'precio_oferta' => $precioVenta * 0.8, // 20% de descuento
            ];
        });
    }

    /*
    |----------------------------------------------------------------------
    | ESTADO: sinStock()
    |----------------------------------------------------------------------
    */
    public function sinStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock' => 0,
        ]);
    }
}
