<?php

/*
|--------------------------------------------------------------------------
| TEST: AdminControllersTest
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué prueba este archivo?
|
|   Tres controladores del panel admin:
|
|   1. AnalyticsController  → el dashboard carga sin errores
|   2. CuponController      → el endpoint AJAX de validación funciona
|   3. PedidoController     → cambiar estado de un pedido funciona
|
| PENSAR — ¿Cómo manejamos los roles de Spatie en tests?
|
|   Con RefreshDatabase, la BD empieza vacía — sin roles.
|   Spatie lee los roles de la tabla 'roles'. Si no existen, lanza error.
|
|   SOLUCIÓN: crear el rol en el test antes de asignarlo al usuario.
|
|   $rol = Role::create(['name' => 'administrador', 'guard_name' => 'web']);
|   $admin = User::factory()->create();
|   $admin->assignRole($rol);
|
|   Luego: $this->actingAs($admin)->get('/analytics')
|
*/

namespace Tests\Feature;

use App\Models\Cupon;
use App\Models\Pedido;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminControllersTest extends TestCase
{
    use RefreshDatabase;

    /*
    |----------------------------------------------------------------------
    | setUp() — Preparación que corre ANTES de cada test
    |----------------------------------------------------------------------
    |
    | setUp() es un método especial de PHPUnit que se ejecuta automáticamente
    | antes de cada método test_*. Aquí creamos el rol 'administrador'
    | una sola vez por test, sin repetir código.
    |
    */
    protected function setUp(): void
    {
        parent::setUp();

        // Spatie necesita que los roles existan en la BD.
        // Con RefreshDatabase cada test empieza sin roles → los creamos aquí.
        // 'guard_name' = 'web' es el guard por defecto de Laravel.
        Role::create(['name' => 'administrador',       'guard_name' => 'web']);
        Role::create(['name' => 'super_administrador', 'guard_name' => 'web']);
    }

    /*
    |----------------------------------------------------------------------
    | HELPER PRIVADO: crearAdmin()
    |----------------------------------------------------------------------
    |
    | Crea un usuario y le asigna el rol 'administrador'.
    | Lo reutilizamos en varios tests para no repetir las mismas 3 líneas.
    |
    | PATRÓN: Extract Method — si el mismo código aparece en 2+ tests,
    | conviértelo en un método privado con nombre descriptivo.
    |
    */
    private function crearAdmin(): User
    {
        $admin = User::factory()->create();
        $admin->assignRole('administrador');
        return $admin;
    }

    // ======================================================================
    // BLOQUE 1 — AnalyticsController
    // ======================================================================

    /*
    |----------------------------------------------------------------------
    | Test 1 — Analytics requiere login
    |----------------------------------------------------------------------
    |
    | Un visitante sin sesión NO puede ver el dashboard de analytics.
    | Si no hay login → Laravel redirige a /login.
    |
    | ARRANGE: ningún usuario logueado
    | ACT:     GET /analytics
    | ASSERT:  respuesta 302 redirect hacia /login
    |
    */
    public function test_analytics_requiere_login(): void
    {
        $response = $this->get('/analytics');

        $response->assertRedirect('/login');
    }

    /*
    |----------------------------------------------------------------------
    | Test 2 — Admin puede ver el dashboard de analytics
    |----------------------------------------------------------------------
    |
    | Un administrador logueado SÍ puede ver el dashboard.
    | Inertia devuelve 200 con el componente correcto.
    |
    | ARRANGE: usuario con rol 'administrador'
    | ACT:     GET /analytics
    | ASSERT:  200 OK + componente Inertia 'Analytics/Dashboard'
    |
    */
    public function test_admin_puede_ver_dashboard_analytics(): void
    {
        $admin = $this->crearAdmin();

        $response = $this->actingAs($admin)->get('/analytics');

        // 200 OK — el dashboard cargó sin errores de PHP ni de BD
        $response->assertStatus(200);

        // assertInertia() verifica que Inertia renderizó el componente correcto
        // y que los props que esperamos están presentes.
        $response->assertInertia(fn ($page) =>
            $page->component('Analytics/Dashboard')
                 ->has('kpis')              // prop: KPIs del mes
                 ->has('ultimos_6_meses')   // prop: gráfica de barras
                 ->has('stock_bajo')        // prop: alertas de stock
                 ->has('periodo')           // prop: mes y año activos
        );
    }

    /*
    |----------------------------------------------------------------------
    | Test 3 — Analytics con parámetros de período
    |----------------------------------------------------------------------
    |
    | El dashboard acepta ?mes=3&ano=2026 para cambiar el período.
    | Verificamos que no rompe cuando se pasan esos parámetros.
    |
    */
    public function test_analytics_acepta_parametros_de_periodo(): void
    {
        $admin = $this->crearAdmin();

        $response = $this->actingAs($admin)->get('/analytics?mes=3&ano=2025');

        $response->assertStatus(200);

        // El período devuelto debe coincidir con lo que pedimos
        $response->assertInertia(fn ($page) =>
            $page->component('Analytics/Dashboard')
                 ->where('periodo.mes', 3)
                 ->where('periodo.ano', 2025)
        );
    }

    // ======================================================================
    // BLOQUE 2 — CuponController@validar
    // ======================================================================

    /*
    |----------------------------------------------------------------------
    | Test 4 — Validar cupón que existe y es válido
    |----------------------------------------------------------------------
    |
    | El endpoint POST /cupones/validar devuelve JSON.
    | Con un cupón activo y monto suficiente → { valido: true, descuento: X }
    |
    | ARRANGE: cupón activo de 20% sin restricciones
    | ACT:     POST /cupones/validar con { codigo: 'TEST20', total: 100000 }
    | ASSERT:  JSON { valido: true } + campo descuento presente
    |
    */
    public function test_cupon_valido_devuelve_descuento(): void
    {
        $admin = $this->crearAdmin();

        // Creamos un cupón directamente (sin factory por ahora)
        // tipo 'porcentaje' → 20% de descuento sobre el total
        Cupon::create([
            'codigo'        => 'TEST20',
            'tipo'          => 'porcentaje',
            'valor'         => 20,
            'minimo_compra' => 0,
            'usos_actuales' => 0,
            'activo'        => true,
        ]);

        $response = $this->actingAs($admin)
            ->postJson('/tienda/cupones/validar', [
                'codigo' => 'TEST20',
                'total'  => 100000,
            ]);

        $response->assertStatus(200);
        $response->assertJson(['valido' => true]);

        // Verificamos que el descuento calculado está presente y es positivo
        // assertJsonPath usa === estricto — usamos assertGreaterThan para evitar
        // fallos por tipo (el JSON puede devolver 20000 int o 20000.0 float)
        $this->assertGreaterThan(0, $response->json('descuento'));
    }

    /*
    |----------------------------------------------------------------------
    | Test 5 — Cupón que no existe devuelve { valido: false }
    |----------------------------------------------------------------------
    |
    | Si el código no existe en la BD → respuesta de error amigable.
    | NO debe romper con 500 — el negocio maneja el caso.
    |
    */
    public function test_cupon_inexistente_devuelve_invalido(): void
    {
        $admin = $this->crearAdmin();

        $response = $this->actingAs($admin)
            ->postJson('/tienda/cupones/validar', [
                'codigo' => 'CODIGO-QUE-NO-EXISTE',
                'total'  => 100000,
            ]);

        $response->assertStatus(200);
        $response->assertJson(['valido' => false]);
    }

    /*
    |----------------------------------------------------------------------
    | Test 6 — Cupón expirado devuelve { valido: false }
    |----------------------------------------------------------------------
    |
    | Un cupón con fecha_expiracion en el pasado no debe ser aceptado.
    |
    */
    public function test_cupon_expirado_devuelve_invalido(): void
    {
        $admin = $this->crearAdmin();

        Cupon::create([
            'codigo'           => 'EXPIRADO10',
            'tipo'             => 'porcentaje',
            'valor'            => 10,
            'minimo_compra'    => 0,
            'usos_actuales'    => 0,
            'activo'           => true,
            'fecha_expiracion' => now()->subDay()->toDateString(), // ayer → expirado
        ]);

        $response = $this->actingAs($admin)
            ->postJson('/tienda/cupones/validar', [
                'codigo' => 'EXPIRADO10',
                'total'  => 100000,
            ]);

        $response->assertStatus(200);
        $response->assertJson(['valido' => false]);
        $response->assertJsonPath('mensaje', 'Este cupón ya expiró.');
    }

    /*
    |----------------------------------------------------------------------
    | Test 7 — Cupón por debajo del mínimo de compra
    |----------------------------------------------------------------------
    |
    | Si el total del pedido no alcanza el mínimo → también inválido.
    |
    */
    public function test_cupon_no_aplica_si_total_es_menor_al_minimo(): void
    {
        $admin = $this->crearAdmin();

        Cupon::create([
            'codigo'        => 'MINIMO50K',
            'tipo'          => 'porcentaje',
            'valor'         => 15,
            'minimo_compra' => 50000, // requiere compra mínima de $50.000
            'usos_actuales' => 0,
            'activo'        => true,
        ]);

        $response = $this->actingAs($admin)
            ->postJson('/tienda/cupones/validar', [
                'codigo' => 'MINIMO50K',
                'total'  => 20000, // solo $20.000 → no alcanza el mínimo
            ]);

        $response->assertStatus(200);
        $response->assertJson(['valido' => false]);
    }

    // ======================================================================
    // BLOQUE 3 — PedidoController@cambiarEstado
    // ======================================================================

    /*
    |----------------------------------------------------------------------
    | Test 8 — Admin puede cambiar el estado de un pedido
    |----------------------------------------------------------------------
    |
    | ARRANGE: pedido en estado 'pendiente'
    | ACT:     PATCH /pedidos/{id}/estado con { estado: 'confirmado' }
    | ASSERT:  BD tiene el pedido con estado 'confirmado'
    |
    */
    public function test_admin_puede_cambiar_estado_pedido(): void
    {
        $admin = $this->crearAdmin();

        // Creamos un pedido con todos los campos NOT NULL de la tabla.
        // direccion_entrega es VARCHAR(250) — string plano, no JSON.
        // ciudad y departamento también son NOT NULL sin default.
        $pedido = Pedido::create([
            'cliente_nombre'    => 'Juan Pérez',
            'cliente_email'     => 'juan@test.com',
            'cliente_telefono'  => '3001234567',
            'total'             => 100000,
            'estado'            => Pedido::ESTADO_PENDIENTE,
            'direccion_entrega' => 'Calle 1 # 2-3',
            'ciudad'            => 'Bogotá',
            'departamento'      => 'Cundinamarca',
        ]);

        $response = $this->actingAs($admin)
            ->patch("/pedidos/{$pedido->id}/estado", [
                'estado' => Pedido::ESTADO_CONFIRMADO,
            ]);

        // 302 redirect = el cambio fue exitoso (back() en el controller)
        $response->assertRedirect();

        // Verificamos que la BD refleja el cambio
        $this->assertDatabaseHas('pedidos', [
            'id'     => $pedido->id,
            'estado' => Pedido::ESTADO_CONFIRMADO,
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | Test 9 — Estado inválido no se aplica
    |----------------------------------------------------------------------
    |
    | El controller valida que 'estado' sea uno de los valores permitidos.
    | Un estado inventado → 422 Unprocessable Entity (error de validación).
    |
    | ARRANGE: pedido existente
    | ACT:     PATCH /pedidos/{id}/estado con { estado: 'volando' }
    | ASSERT:  422 + pedido sigue en su estado original
    |
    */
    public function test_estado_invalido_no_modifica_el_pedido(): void
    {
        $admin = $this->crearAdmin();

        $pedido = Pedido::create([
            'cliente_nombre'    => 'Ana García',
            'cliente_email'     => 'ana@test.com',
            'cliente_telefono'  => '3109876543',
            'total'             => 50000,
            'estado'            => Pedido::ESTADO_PENDIENTE,
            'direccion_entrega' => 'Carrera 2 # 3-4',
            'ciudad'            => 'Medellín',
            'departamento'      => 'Antioquia',
        ]);

        // Con Inertia, la validación fallida redirige de vuelta (no 422).
        // La aserción importante es que la BD no cambió — ese es el contrato real.
        $this->actingAs($admin)
            ->patch("/pedidos/{$pedido->id}/estado", [
                'estado' => 'volando', // estado que no existe en todosLosEstados()
            ]);

        // El pedido sigue en su estado original — nada cambió en la BD
        $this->assertDatabaseHas('pedidos', [
            'id'     => $pedido->id,
            'estado' => Pedido::ESTADO_PENDIENTE,
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | Test 10 — Cancelar un pedido registra la fecha de cancelación
    |----------------------------------------------------------------------
    |
    | Cuando el estado cambia a 'cancelado', el controller guarda
    | la fecha en 'cancelado_en'. Lo verificamos directamente.
    |
    */
    public function test_cancelar_pedido_registra_fecha_cancelacion(): void
    {
        $admin = $this->crearAdmin();

        $pedido = Pedido::create([
            'cliente_nombre'    => 'Pedro López',
            'cliente_email'     => 'pedro@test.com',
            'cliente_telefono'  => '3201112233',
            'total'             => 75000,
            'direccion_entrega' => 'Avenida 3 # 4-5',
            'ciudad'            => 'Cali',
            'departamento'      => 'Valle del Cauca',
            'estado'           => Pedido::ESTADO_CONFIRMADO,
        ]);

        $this->actingAs($admin)
            ->patch("/pedidos/{$pedido->id}/estado", [
                'estado' => Pedido::ESTADO_CANCELADO,
            ]);

        // Refrescamos el modelo desde la BD para leer el valor actualizado
        $pedido->refresh();

        $this->assertEquals(Pedido::ESTADO_CANCELADO, $pedido->estado);

        // 'cancelado_en' debe tener una fecha (no null)
        $this->assertNotNull($pedido->cancelado_en,
            'Al cancelar un pedido, cancelado_en debe guardarse.'
        );
    }
}
