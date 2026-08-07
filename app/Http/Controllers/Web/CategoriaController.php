<?php

/*
|--------------------------------------------------------------------------
| CONTROLLER: CategoriaController
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace este controller?
|
|   Gestiona el CRUD de categorías de productos desde el panel admin.
|   Las categorías pueden ser raíces (sin padre) o subcategorías (con padre).
|   No se puede eliminar una categoría que tenga productos o hijos.
|
| MÉTODOS:
|   index()   → lista con filtros y conteo de productos/hijos
|   create()  → formulario de creación (pasa lista de padres posibles)
|   store()   → guardar categoría nueva (slug auto-generado)
|   edit()    → formulario de edición
|   update()  → guardar cambios
|   destroy() → eliminar (bloquea si tiene productos o subcategorías)
|
*/

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CategoriaController extends Controller
{
    /*
    |----------------------------------------------------------------------
    | index() — Lista todas las categorías con filtros
    |----------------------------------------------------------------------
    |
    | PENSAR — ¿Qué datos necesita la lista?
    |
    |   - La categoría padre (para mostrar "es sub de X")
    |   - Conteo de productos asociados
    |   - Conteo de subcategorías hijas
    |   - Filtros: buscar por nombre, activo/inactivo, raíz/subcategoría
    |
    */
    public function index(Request $request): Response
    {
        $query = Categoria::with('padre')
            ->withCount(['productos', 'hijos'])
            ->ordenadas();

        if ($request->filled('buscar')) {
            $query->where(function ($q) use ($request) {
                $q->where('nombre', 'ilike', "%{$request->buscar}%")
                  ->orWhere('slug', 'ilike', "%{$request->buscar}%");
            });
        }

        if ($request->filled('activo')) {
            $query->where('activo', $request->activo === 'true');
        }

        if ($request->filled('tipo')) {
            match ($request->tipo) {
                'raiz' => $query->whereNull('padre_id'),
                'sub'  => $query->whereNotNull('padre_id'),
                default => null,
            };
        }

        $categorias = $query->paginate(20)->withQueryString();

        return Inertia::render('Categorias/Index', [
            'categorias' => $categorias,
            'filtros'    => $request->only(['buscar', 'activo', 'tipo']),
            'stats'      => [
                'total'   => Categoria::count(),
                'activas' => Categoria::where('activo', true)->count(),
                'raices'  => Categoria::whereNull('padre_id')->count(),
            ],
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | create() — Formulario de creación
    |----------------------------------------------------------------------
    |
    | PENSAR — ¿Por qué pasamos 'padres'?
    |
    |   El formulario tiene un selector de categoría padre.
    |   Solo mostramos las raíces activas para no crear jerarquías de más
    |   de 2 niveles (categoría → subcategoría).
    |
    */
    public function create(): Response
    {
        return Inertia::render('Categorias/Crear', [
            'padres' => Categoria::raices()->activas()->ordenadas()
                ->select('id', 'nombre')
                ->get(),
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | store() — Guardar categoría nueva
    |----------------------------------------------------------------------
    |
    | PENSAR — ¿Por qué auto-generamos el slug?
    |
    |   El slug se usa en las URLs de la tienda pública (FASE 8).
    |   Si el usuario no ingresa uno, lo generamos desde el nombre:
    |   "Ropa Deportiva" → "ropa-deportiva"
    |   Si el usuario ingresa uno, lo respetamos.
    |
    */
    public function store(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            'nombre'      => ['required', 'string', 'max:100', 'unique:categorias,nombre'],
            'slug'        => ['nullable', 'string', 'max:120', 'unique:categorias,slug'],
            'descripcion' => ['nullable', 'string', 'max:500'],
            'imagen_url'  => ['nullable', 'url', 'max:500'],
            'padre_id'    => ['nullable', 'exists:categorias,id'],
            'orden'       => ['nullable', 'integer', 'min:0'],
            'activo'      => ['boolean'],
        ]);

        // Si el usuario no escribió un slug, generarlo desde el nombre
        $datos['slug']  = $datos['slug'] ?? Str::slug($datos['nombre']);
        $datos['orden'] = $datos['orden'] ?? 0;

        Categoria::create($datos);

        return redirect()
            ->route('categorias.index')
            ->with('exito', 'Categoría creada correctamente.');
    }

    /*
    |----------------------------------------------------------------------
    | edit() — Formulario de edición
    |----------------------------------------------------------------------
    |
    | PENSAR — ¿Por qué excluimos la categoría actual de los padres posibles?
    |
    |   Una categoría no puede ser su propio padre (eso crearía un loop).
    |   Excluimos $categoria->id de la lista de padres disponibles.
    |
    */
    public function edit(Categoria $categoria): Response
    {
        return Inertia::render('Categorias/Editar', [
            'categoria' => $categoria->load('padre'),
            // Excluir la categoría actual para que no pueda ser su propio padre
            'padres'    => Categoria::raices()->activas()->ordenadas()
                ->where('id', '!=', $categoria->id)
                ->select('id', 'nombre')
                ->get(),
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | update() — Guardar cambios
    |----------------------------------------------------------------------
    */
    public function update(Request $request, Categoria $categoria): RedirectResponse
    {
        $datos = $request->validate([
            'nombre'      => ['required', 'string', 'max:100', 'unique:categorias,nombre,' . $categoria->id],
            'slug'        => ['nullable', 'string', 'max:120', 'unique:categorias,slug,' . $categoria->id],
            'descripcion' => ['nullable', 'string', 'max:500'],
            'imagen_url'  => ['nullable', 'url', 'max:500'],
            'padre_id'    => ['nullable', 'exists:categorias,id'],
            'orden'       => ['nullable', 'integer', 'min:0'],
            'activo'      => ['boolean'],
        ]);

        // Si vino vacío el slug, regenerarlo desde el nombre actualizado
        if (empty($datos['slug'])) {
            $datos['slug'] = Str::slug($datos['nombre']);
        }

        $categoria->update($datos);

        return redirect()
            ->route('categorias.index')
            ->with('exito', 'Categoría actualizada correctamente.');
    }

    /*
    |----------------------------------------------------------------------
    | destroy() — Eliminar categoría
    |----------------------------------------------------------------------
    |
    | PENSAR — ¿Por qué bloqueamos la eliminación?
    |
    |   Si borramos una categoría con productos, esos productos quedarían
    |   sin categoría → inconsistencia en el catálogo.
    |   Si borramos una categoría con hijos, las subcategorías quedan huérfanas.
    |   La solución es BLOQUEAR y pedirle al admin que limpie primero.
    |
    */
    public function destroy(Categoria $categoria): RedirectResponse
    {
        if ($categoria->productos()->count() > 0) {
            return back()->with('error',
                "No se puede eliminar: la categoría «{$categoria->nombre}» tiene " .
                $categoria->productos()->count() . " producto(s) asociado(s). Reasígnales otra categoría primero."
            );
        }

        if ($categoria->hijos()->count() > 0) {
            return back()->with('error',
                "No se puede eliminar: la categoría «{$categoria->nombre}» tiene " .
                $categoria->hijos()->count() . " subcategoría(s). Elimínalas primero."
            );
        }

        $nombre = $categoria->nombre;
        $categoria->delete();

        return redirect()
            ->route('categorias.index')
            ->with('exito', "Categoría «{$nombre}» eliminada correctamente.");
    }
}
