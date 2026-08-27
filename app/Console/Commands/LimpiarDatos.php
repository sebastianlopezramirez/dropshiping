<?php

/*
|--------------------------------------------------------------------------
| COMANDO: db:limpiar
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Para qué sirve?
|   Borra todos los datos de prueba de la BD sin tocar:
|   - Usuarios (tabla 'usuarios')
|   - Proveedores (tabla 'proveedores')
|   - Roles y permisos (Spatie)
|
|   Útil antes de hacer pruebas limpias o antes de publicar la app.
|
| PENSAR — ¿Cómo funciona?
|   PostgreSQL tiene restricciones de clave foránea (FK).
|   Si intentas borrar 'pedidos' antes de borrar 'items_pedido', falla.
|   Solución: TRUNCATE ... CASCADE → borra en cascada ignorando el orden.
|
| USO:
|   php artisan db:limpiar
|   php artisan db:limpiar --confirmar   ← sin pregunta interactiva (para scripts)
|
*/

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class LimpiarDatos extends Command
{
    /*
     * FIRMA del comando (lo que escribís en la terminal)
     * --confirmar → flag opcional para saltar la confirmación interactiva
     */
    protected $signature = 'db:limpiar {--confirmar : Ejecutar sin pedir confirmación}';

    protected $description = 'Borra todos los datos de prueba conservando usuarios, proveedores y roles';

    /*
     * TABLAS QUE SE BORRAN — en orden correcto (hijas antes que padres)
     *
     * Aunque usamos TRUNCATE CASCADE (ignora FKs en PostgreSQL),
     * el orden explícito documenta la jerarquía del sistema.
     */
    private array $tablasABorrar = [
        // ── Nivel 3: detalles de pedidos ──────────────────────────────
        'items_pedido',            // líneas de producto dentro de un pedido
        'envios',                  // registros de envío por pedido
        'transacciones',           // pagos de clientes por pedido
        'gastos_operativos',       // gastos ligados a pedidos o globales

        // ── Nivel 2: cabecera de pedidos ──────────────────────────────
        'pedidos',                 // los pedidos en sí

        // ── Pagos a proveedores ───────────────────────────────────────
        'pagos_proveedor',         // lo que el admin le paga al proveedor

        // ── Marketing ─────────────────────────────────────────────────
        'consentimientos_marketing',
        'campana_producto',        // pivot campana ↔ producto (si existe)
        'cupon_pedido',            // pivot cupón ↔ pedido (si existe)
        'cupon_producto',          // pivot cupón ↔ producto (si existe)
        'cupones',
        'campanas',
        'tarifas_domicilio',

        // ── Imágenes (Spatie Media Library) ───────────────────────────
        'media',

        // ── Inventario ────────────────────────────────────────────────
        'producto_proveedor',      // pivot producto ↔ proveedor (stock, precio)
        'productos',
        'categorias',

        // ── Cache de sesión (limpia residuos) ─────────────────────────
        'cache',
        'jobs',
        'failed_jobs',
    ];

    public function handle(): int
    {
        // ── Confirmación de seguridad ──────────────────────────────────
        if (! $this->option('confirmar')) {
            $this->newLine();
            $this->warn('⚠️  Este comando borrará TODOS los datos de:');
            $this->line('   productos, pedidos, pagos, cupones, campañas,');
            $this->line('   envíos, transacciones, imágenes, categorías...');
            $this->newLine();
            $this->info('✅  Se conservarán: usuarios, proveedores, roles y permisos.');
            $this->newLine();

            if (! $this->confirm('¿Estás seguro que querés continuar?')) {
                $this->info('❌ Operación cancelada.');
                return self::SUCCESS;
            }
        }

        $this->info('🧹 Iniciando limpieza...');
        $this->newLine();

        // ── Deshabilitar triggers de FK temporalmente ──────────────────
        // En PostgreSQL: SET session_replication_role = 'replica' deshabilita FKs
        // Alternativa más segura: TRUNCATE ... CASCADE
        DB::statement('SET session_replication_role = replica');

        $borradas  = 0;
        $omitidas  = 0;
        $fallidas  = [];

        foreach ($this->tablasABorrar as $tabla) {
            try {
                // Verificar si la tabla existe antes de truncar
                $existe = DB::select("
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = ?
                ", [$tabla]);

                if (empty($existe)) {
                    $this->line("  ⏭  <fg=gray>{$tabla}</> → no existe, omitida");
                    $omitidas++;
                    continue;
                }

                DB::statement("TRUNCATE TABLE \"{$tabla}\" RESTART IDENTITY CASCADE");
                $this->line("  ✅ <fg=green>{$tabla}</> → limpiada");
                $borradas++;

            } catch (\Throwable $e) {
                $this->line("  ❌ <fg=red>{$tabla}</> → ERROR: " . $e->getMessage());
                $fallidas[] = $tabla;
            }
        }

        // ── Re-habilitar FKs ──────────────────────────────────────────
        DB::statement('SET session_replication_role = DEFAULT');

        // ── Resumen ───────────────────────────────────────────────────
        $this->newLine();
        $this->info("✅ Limpieza completada:");
        $this->line("   Tablas borradas : {$borradas}");
        $this->line("   Tablas omitidas : {$omitidas} (no existían)");

        if (! empty($fallidas)) {
            $this->warn("   Tablas con error: " . implode(', ', $fallidas));
        }

        $this->newLine();
        $this->line('📌 Se conservaron: <fg=green>usuarios / proveedores / roles / permisos</>');
        $this->newLine();

        return self::SUCCESS;
    }
}
