<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Applicants;
use App\Rules\PersonalData;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class ApplicantsController extends Controller
{
    public function index()
    {
        return response()->json(
            Applicants::all()
        );
    }

    public function show($id)
    {
        return response()->json(
            Applicants::findOrFail($id)
        );
    }

    public function store(Request $request)
    {
        if (is_string($request->curp)) {
            $request->merge(['curp' => strtoupper(trim($request->curp))]);
        }
        $request->validate([
            'nombre' => 'required|string|max:255',
            'apellido_paterno' => 'required|string|max:255',
            'apellido_materno' => 'required|string|max:255',
            'curp' => ['bail', 'required', 'string', new PersonalData('curp')],
            'email' => ['bail', 'required', 'string', new PersonalData('correo'), 'email', 'max:254'],
            'telefono' => ['bail', 'required', 'string', new PersonalData('telefono')],
            'direccion' => 'required|string|max:255',
            'fecha_nacimiento' => ['bail', 'required', 'string', new PersonalData('fecha_nacimiento')],
            'estado_civil' => 'required|string|max:255',
            'cv' => 'required|file|mimes:pdf,doc,docx|max:20480',
            'carta' => 'required|file|mimes:pdf,doc,docx|max:20480',
        ], [
            'email.email' => 'El correo electronico no tiene un formato valido.',
            'cv.required' => 'Debes adjuntar tu CV.',
            'carta.required' => 'Debes adjuntar tu carta de recomendacion.',
            'cv.mimes' => 'El CV debe ser PDF, DOC o DOCX.',
            'carta.mimes' => 'La carta debe ser PDF, DOC o DOCX.',
            'cv.max' => 'El CV no debe pesar mas de 20 MB.',
            'carta.max' => 'La carta no debe pesar mas de 20 MB.',
        ]);

        $coincidencias = Applicants::where('curp', $request->curp)
            ->orWhere('email', $request->email)
            ->orWhere('telefono', $request->telefono)
            ->get();

        if ($coincidencias->pluck('id')->unique()->count() > 1) {
            return response()->json([
                'message' => 'Los datos pertenecen a diferentes postulantes registrados. Revisa CURP, correo y telefono.',
            ], 422);
        }

        $info = $coincidencias->first();

        if ($info && $this->yaSePostuloMismaVacante($request, $info->id)) {
            return response()->json([
                'message' => 'Este usuario ya se postulo a esta vacante.',
            ], 422);
        }

        $apellido = trim(
            $request->apellido_paterno . ' ' . $request->apellido_materno
        );

        $datos = [

            'nombre' => $request->nombre,
            'apellido' => $apellido,
            'apellido_paterno' => $request->apellido_paterno,
            'apellido_materno' => $request->apellido_materno,
            'curp' => $request->curp,
            'email' => $request->email,
            'telefono' => $request->telefono,
            'direccion' => $request->direccion,
            'fecha_nacimiento' => $request->fecha_nacimiento,
            'estado_civil' => $request->estado_civil,
            'credito_infonavit' => $request->boolean('credito_infonavit'),

            // nuevo
            'status' => 'pendiente'

        ];

        if (Schema::hasColumn('applicants', 'apellido_paterno')) {
            $datos['apellido_paterno'] = $request->apellido_paterno;
        }

        if (Schema::hasColumn('applicants', 'apellido_materno')) {
            $datos['apellido_materno'] = $request->apellido_materno;
        }

        if ($info) {
            $info->update($datos);
        } else {
            $info = Applicants::create($datos);
        }

        $documentos = array_merge(
            $this->guardarDocumento($request, $info->id, 'cv'),
            $this->guardarDocumento($request, $info->id, 'carta')
        );

        if (!empty($documentos)) {
            $info->update($documentos);
        }

        return response()->json($info);
    }

    private function yaSePostuloMismaVacante(
        Request $request,
        int $applicantId
    ): bool {
        $consulta = \App\Models\JobApplications::where(
            'applicant_id',
            $applicantId
        );

        if (
            $request->vacancy_id
            && Schema::hasColumn('job_applications', 'vacancy_id')
        ) {
            return $consulta
                ->where('vacancy_id', $request->vacancy_id)
                ->exists();
        }

        if ($request->puesto_aplicado && $request->area) {
            return $consulta
                ->where('puesto_aplicado', $request->puesto_aplicado)
                ->where('area', $request->area)
                ->exists();
        }

        return false;
    }

    private function guardarDocumento(
        Request $request,
        int $applicantId,
        string $tipo
    ): array {
        if (!$request->hasFile($tipo)) {
            return [];
        }

        $archivo = $request->file($tipo);

        if (!$archivo->isValid()) {
            return [];
        }

        return [
            "{$tipo}_path" => $archivo->store(
                "applicants/{$applicantId}",
                'local'
            ),
            "{$tipo}_original_name" => $archivo->getClientOriginalName(),
        ];
    }

    // obtener por estado
    public function obtenerPorEstado($status)
    {
        return response()->json(
            Applicants::where(
                'status',
                $status
            )->get()
        );
    }

    // cambiar estado
    public function cambiarEstado(
        Request $request,
        $id
    )
    {
        $applicant =
            Applicants::findOrFail($id);

        $applicant->status =
            $request->status;

        $applicant->save();

        return response()->json([
            'message' => 'Estado actualizado'
        ]);
    }
    
}
