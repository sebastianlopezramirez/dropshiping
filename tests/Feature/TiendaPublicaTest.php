<?php

/*
|--------------------------------------------------------------------------
| TEST: TiendaPublicaTest
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué prueba este test?
|
|   Las rutas públicas de la tienda deben responder 200 sin login.
|   Son el mínimo de seguridad: si la tienda da 500, el negocio está caído.
|
*/

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Producto;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TiendaPublicaTest extends TestCase
{
    // RefreshDatabase: corre las migraciones en la BD de test
    // y las revierte al terminar cada test (BD siempre limpia)
    use RefreshDatabase;

    /*
    |----------------------------------------------------------------------
    | Test 1 — La tienda carga sin login
    |----------------------------------------------------------------------
    */
    public function test_tienda_es_accesible_sin_login(): void
    {
        $response = $this->get('/tienda');

        // 200 OK ó 302 redirect son aceptables — lo que NO queremos es 500
        $this->assertNotEquals(500, $response->status());
    }

    /*
    |----------------------------------------------------------------------
    | Test 2 — El detalle de producto por slug devuelve 404 si no existe
    |----------------------------------------------------------------------
    */
    public function test_producto_inexistente_devuelve_404(): void
    {
        $response = $this->get('/tienda/slug-que-no-existe-jamás');

        $response->assertStatus(404);
    }

    /*
    |----------------------------------------------------------------------
    | Test 3 — Un producto activo es visible en la tienda
    |----------------------------------------------------------------------
    */
    public function test_producto_activo_es_visible(): void
    {
        // Creamos una categoría y un producto activo con factory
        $categoria = Categoria::factory()->create([
            'nombre' => 'Test',
            'slug'   => 'test-categoria',
            'activo' => true,
        ]);

        $producto = Producto::factory()->create([
            'nombre'      => 'Producto de prueba',
            'slug'        => 'producto-de-prueba',
            'estado'      => 'activo',
            'stock'       => 10,
            'precio_venta' => 50000,
            'categoria_id' => $categoria->id,
        ]);

        $response = $this->get('/tienda/' . $producto->slug);

        $response->assertStatus(200);
    }

    /*
    |----------------------------------------------------------------------
    | Test 4 — El panel de admin redirige al login si no hay sesión
    |----------------------------------------------------------------------
    */
    public function test_dashboard_admin_requiere_login(): void
    {
        $response = $this->get('/dashboard');

        // Sin login → debe redirigir a /login
        $response->assertRedirect('/login');
    }

    /*
    |----------------------------------------------------------------------
    | Test 5 — Un usuario puede autenticarse con email + contrasena
    |----------------------------------------------------------------------
    */
    public function test_usuario_puede_autenticarse(): void
    {
        $usuario = User::factory()->create([
            'contrasena' => bcrypt('mi-contrasena-segura'),
        ]);

        $response = $this->post('/login', [
            'email'    => $usuario->email,
            'password' => 'mi-contrasena-segura',
        ]);

        $this->assertAuthenticated();
    }

    /*
    |----------------------------------------------------------------------
    | Test 6 — Credenciales inválidas no autentican
    |----------------------------------------------------------------------
    */
    public function test_credenciales_invalidas_no_autentican(): void
    {
        $usuario = User::factory()->create();

        $this->post('/login', [
            'email'    => $usuario->email,
            'password' => 'contrasena-incorrecta',
        ]);

        $this->assertGuest();
    }
}
