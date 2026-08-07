<?php

/*
|--------------------------------------------------------------------------
| CONTROLLER: CampanaController
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace este controller?
|
|   Gestiona el CRUD de campañas de marketing desde el panel admin.
|   Una campaña agrupa gastos publicitarios en un canal (Instagram, TikTok,
|   Google, etc.) y se asocia a pedidos para medir el ROI.
|
| MÉTODOS:
|   index()   → lista de campañas con métricas (ROI, pedidos, ventas)
|   create()  → formulario de creación
|   store()   → guardar campaña nueva
|   show()    → detalle de una campaña + sus pedidos
|   edit()    → formulario de edición
|   update()  → guardar cambios
|   destroy() → eliminar campaña (solo si no tiene pedidos)
|
*/

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Campana;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CampanaController extends Controller
{
    /*
    |----------------------------------------------------------------------
    | CANALES DISPONIBLES
    |----------------------------------------------------------------------
    | Se define aquí y se pasa a las vistas para poblar el <select>
    */
    private const CANALES = [
        ['value' => 'instagram', 'label' => '📸 Instagram'],
        ['value' => 'facebook',  'label' => '👤 Facebook'],
        ['value' => 'tiktok',    'label' => '🎵 TikTok'],
        ['value' => 'google',    'label' => '🔍 Google Ads'],
        ['value' => 'youtube',   'label' => '▶️ YouTube'],
        ['value' => 'email',     'label' => '📧 Email / Newsletter'],
        ['value' => 'whatsapp',  'label' => '💬 WhatsApp'],
        ['value' => 'otro',      'label' => '📢 Otro'],
    ];

    private const ESTADOS = [
        ['value' => 'activa',     'label' => 'Activa'],
        ['value' => 'pausada',    'label' => 'Pausada'],
        ['value' => 'finalizada', 'label' => 'Finalizada'],
    ];

    /*
    |----------------------------------------------------------------------
    | index() — Lista de campañas con métricas
    |----------------------------------------------------------------------
    */
    public function index(Request $request): Response
    {
        $query = Campana::query()->orderByDesc('fecha_inicio');

        if ($request->filled('buscar')) {
            $query->where(function ($q) use ($request) {
                $q->where('nombre', 'ilike', "%{$request->buscar}%")
                  ->orWhere('codigo_utm', 'ilike', "%{$request->buscar}%");
            });
        }

        if ($request->filled('canal')) {
            $query->where('canal', $request->canal);
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        // Cargar count de pedidos para mostrar en la tabla
        $campanas = $query->withCount('pedidos')->paginate(15)->withQueryString();

        // Agregar métricas de ventas a cada campaña
        // PENSAR: hacemos esto con transform() para no hacer N consultas individuales
        $campanas->getCollection()->transform(function (Campana $campana) {
            $campana->total_ventas = $campana->totalVentas();
            $campana->roi          = $campana->calcularRoi();
            return $campana;
        });

        return Inertia::render('Marketing/Campanas/Index', [
            'campanas'     => $campanas,
            'filtros'      => $request->only(['buscar', 'canal', 'estado']),
            'canales'      => self::CANALES,
            'estados'      => self::ESTADOS,
            'estadisticas' => [
                'total'      => Campana::count(),
                'activas'    => Campana::activas()->count(),
                'finalizadas' => Campana::where('estado', 'finalizada')->count(),
            ],
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | create() — Formulario de creación
    |----------------------------------------------------------------------
    */
    public function create(): Response
    {
        return Inertia::render('Marketing/Campanas/Crear', [
            'canales' => self::CANALES,
            'estados' => self::ESTADOS,
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | store() — Guardar campaña nueva
    |----------------------------------------------------------------------
    */
    public function store(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            'nombre'       => ['required', 'string', 'max:150'],
            'descripcion'  => ['nullable', 'string', 'max:500'],
            'canal'        => ['required', 'in:instagram,facebook,tiktok,google,youtube,email,whatsapp,otro'],
            'presupuesto'  => ['nullable', 'numeric', 'min:0'],
            'fecha_inicio' => ['required', 'date'],
            'fecha_fin'    => ['required', 'date', 'after_or_equal:fecha_inicio'],
            'codigo_utm'   => ['nullable', 'string', 'max:100', 'unique:campanas,codigo_utm'],
            'url_destino'  => ['nullable', 'url', 'max:500'],
            'estado'       => ['required', 'in:activa,pausada,finalizada'],
            'notas'        => ['nullable', 'string'],
        ]);

        Campana::create($datos);

        return redirect()
            ->route('campanas.index')
            ->with('exito', 'Campaña creada correctamente.');
    }

    /*
    |----------------------------------------------------------------------
    | show() — Detalle de campaña + sus pedidos asociados
    |----------------------------------------------------------------------
    |
    | PENSAR — ¿Para qué sirve el show?
    |
    |   Es la vista de análisis: cuánto se gastó, cuánto se vendió,
    |   qué pedidos vinieron de esta campaña, cuál es el ROI.
    |
    */
    public function show(Campana $campana): Response
    {
        $campana->load(['pedidos' => function ($q) {
            $q->select('id', 'numero_pedido', 'cliente_nombre', 'total', 'estado', 'creado_en', 'campana_id')
              ->orderByDesc('creado_en')
              ->limit(50);
        }]);

        return Inertia::render('Marketing/Campanas/Ver', [
            'campana'      => $campana,
            'total_ventas' => $campana->totalVentas(),
            'roi'          => $campana->calcularRoi(),
            'label_canal'  => $campana->label_canal,
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | edit() — Formulario de edición
    |----------------------------------------------------------------------
    */
    public function edit(Campana $campana): Response
    {
        return Inertia::render('Marketing/Campanas/Editar', [
            'campana' => $campana,
            'canales' => self::CANALES,
            'estados' => self::ESTADOS,
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | update() — Guardar cambios
    |----------------------------------------------------------------------
    */
    public function update(Request $request, Campana $campana): RedirectResponse
    {
        $datos = $request->validate([
            'nombre'       => ['required', 'string', 'max:150'],
            'descripcion'  => ['nullable', 'string', 'max:500'],
            'canal'        => ['required', 'in:instagram,facebook,tiktok,google,youtube,email,whatsapp,otro'],
            'presupuesto'  => ['nullable', 'numeric', 'min:0'],
            'fecha_inicio' => ['required', 'date'],
            'fecha_fin'    => ['required', 'date', 'after_or_equal:fecha_inicio'],
            'codigo_utm'   => ['nullable', 'string', 'max:100', 'unique:campanas,codigo_utm,' . $campana->id],
            'url_destino'  => ['nullable', 'url', 'max:500'],
            'estado'       => ['required', 'in:activa,pausada,finalizada'],
            'notas'        => ['nullable', 'string'],
        ]);

        $campana->update($datos);

        return redirect()
            ->route('campanas.index')
            ->with('exito', 'Campaña actualizada correctamente.');
    }

    /*
    |----------------------------------------------------------------------
    | destroy() — Eliminar campaña
    |----------------------------------------------------------------------
    |
    | PENSAR — ¿Cuándo se puede eliminar una campaña?
    |
    |   Solo si no tiene pedidos asociados. Si los tiene, el nullOnDelete
    |   de la migración ya protege los pedidos, pero perderíamos el historial
    |   de qué pedidos vinieron de ella. Por eso bloqueamos el borrado.
    |
    */
    public function destroy(Campana $campana): RedirectResponse
    {
        if ($campana->pedidos()->exists()) {
            return redirect()
                ->route('campanas.index')
                ->with('error', 'No se puede eliminar: esta campaña tiene ' . $campana->pedidos()->count() . ' pedidos asociados. Finalízala en su lugar.');
        }

        $campana->delete();

        return redirect()
            ->route('campanas.index')
            ->with('exito', 'Campaña eliminada correctamente.');
    }
}
