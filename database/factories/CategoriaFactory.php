<?php

/*
|--------------------------------------------------------------------------
| FACTORY: CategoriaFactory
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Para qué sirve una factory?
|
|   Una factory genera datos falsos para tests.
|   En lugar de crear registros a mano en cada test, la factory
|   lo hace en una línea: Categoria::factory()->create()
|
|   Laravel usa Faker para generar datos falsos automáticamente.
|
*/

namespace Database\Factories;

use App\Models\Categoria;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Categoria>
 */
class CategoriaFactory extends Factory
{
    /**
     * Define el estado por defecto de una categoría.
     *
     * Esto es lo que Categoria::factory()->create() genera.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Genera un nombre único para evitar conflictos de slug en tests
        $nombre = fake()->unique()->words(2, true);

        return [
            'nombre'    => ucwords($nombre),
            'slug'      => Str::slug($nombre) . '-' . fake()->randomNumber(4),
            'descripcion' => fake()->sentence(),
            'imagen_url'  => null,
            'padre_id'  => null,         // raíz por defecto
            'orden'     => fake()->numberBetween(1, 100),
            'activo'    => true,         // activa por defecto
        ];
    }

    /*
    |----------------------------------------------------------------------
    | ESTADO: inactiva()
    |----------------------------------------------------------------------
    |
    | Uso: Categoria::factory()->inactiva()->create()
    | Sirve para testear que las inactivas no aparecen en la tienda.
    |
    */
    public function inactiva(): static
    {
        return $this->state(fn (array $attributes) => [
            'activo' => false,
        ]);
    }
}
