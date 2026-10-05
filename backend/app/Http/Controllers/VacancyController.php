<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Vacancy;
use Illuminate\Support\Facades\Storage;

class VacancyController extends Controller
{
    public function index()
{
    // usuario
    return response()->json(
        Vacancy::where('estado', true)
            ->get()
            ->map(fn ($vacante) => $this->agregarUrlImagen($vacante))
    );
}

public function adminIndex()
{
    // admin
    return response()->json(
        Vacancy::all()
            ->map(fn ($vacante) => $this->agregarUrlImagen($vacante))
    );
}

public function show($id)
{
    $vacante = Vacancy::where('estado', true)
        ->where('id', $id)
        ->firstOrFail();

    return response()->json(
        $this->agregarUrlImagen($vacante)
    );
}

    public function store(Request $request)
    {
        $this->validarVacante($request, true);

        $info = Vacancy::create([

            'puesto' => $request->puesto,
            'departamento' => $request->departamento,
            'descripcion_breve' => $request->descripcion_breve,
            'descripcion' => $request->descripcion,
            'horario' => $request->horario,
            'requisitos' => $request->requisitos,
            'salario' => $request->salario,
            'img' => $request
                ->file('img')
                ->store('vacancy', 'public'),
        ]);

        return response()->json(
            $this->agregarUrlImagen($info)
        );

    }

    public function update(Request $request, $id)
    {
        $vacante = Vacancy::findOrFail($id);
        $this->validarVacante($request, !$vacante->img);

        $datos = [
            'puesto' => $request->puesto,
            'departamento' => $request->departamento,
            'descripcion_breve' => $request->descripcion_breve,
            'descripcion' => $request->descripcion,
            'horario' => $request->horario,
            'requisitos' => $request->requisitos,
            'salario' => $request->salario,
        ];

        if ($request->hasFile('img')) {
            if ($vacante->img && Storage::disk('public')->exists($vacante->img)) {
                Storage::disk('public')->delete($vacante->img);
            }

            $datos['img'] = $request
                ->file('img')
                ->store('vacancy', 'public');
        }
            
        $vacante->update($datos);

        return response()->json(
            $this->agregarUrlImagen($vacante)
        );
    }

    public function destroy($id) {

    $vacante = Vacancy::findOrFail($id);

    if ($vacante->img && Storage::disk('public')->exists($vacante->img)) {
        Storage::disk('public')->delete($vacante->img);
    }

    $vacante -> delete();
    return response()->json([
        'message' => 'Vacante eliminada'
    ]);

    }

    public function cambiarEstado($id)
{
    $vacante = Vacancy::findOrFail($id);

    $vacante->estado =
        !$vacante->estado;

    $vacante->save();

    return response()->json([
        'message' => 'Estado actualizado',
        'estado' => $vacante->estado
    ]);
}

public function imagen($id)
{
    $vacante = Vacancy::findOrFail($id);

    if (filter_var($vacante->img, FILTER_VALIDATE_URL)) {
        return redirect($vacante->img);
    }

    if (!$vacante->img || !Storage::disk('public')->exists($vacante->img)) {
        abort(404);
    }

    return response()->file(
        Storage::disk('public')->path($vacante->img)
    );
}

private function validarVacante(Request $request, bool $requiereImagen): void
{
    $request->validate([
        'puesto' => 'required|string|max:255',
        'departamento' => 'required|string|max:255',
        'horario' => 'required|string|max:255',
        'descripcion_breve' => 'required|string|max:255',
        'descripcion' => 'required|string',
        'requisitos' => 'required|string',
        'salario' => ['required', 'string', 'max:255', function ($attribute, $value, $fail) {
            $importe = str_replace(['$', ',', ' '], '', $value);
            if (!preg_match('/^\d+(?:\.\d{1,2})?$/', $importe) || (float) $importe <= 0) {
                $fail('Ingresa un salario mayor que cero con hasta dos decimales.');
            }
        }],
        'img' => ($requiereImagen ? 'required' : 'nullable') . '|image|mimes:jpg,jpeg,png,webp|max:5120',
    ], [
        'required' => 'Completa el campo :attribute.',
        'string' => 'El campo :attribute debe contener texto.',
        'max.string' => 'El campo :attribute no puede superar :max caracteres.',
        'img.image' => 'El archivo seleccionado debe ser una imagen.',
        'img.mimes' => 'Selecciona una imagen PNG, JPG o WebP.',
        'img.max' => 'La imagen no debe superar 5 MB.',
    ], [
        'descripcion_breve' => 'descripción breve',
        'descripcion' => 'descripción completa',
        'img' => 'imagen de referencia',
    ]);
}

private function agregarUrlImagen(Vacancy $vacante)
{
    if (!$vacante->img) {
        $vacante->img_url = null;

        return $vacante;
    }

    $vacante->img_url = filter_var($vacante->img, FILTER_VALIDATE_URL)
        ? $vacante->img
        : url("/api/vacancy/{$vacante->id}/imagen");

    return $vacante;
}

}
