<?php

namespace Tests\Feature;

use App\Http\Controllers\VacancyController;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class VacancyValidationTest extends TestCase
{
    public function test_empty_vacancy_is_rejected_before_persistence(): void
    {
        try {
            app(VacancyController::class)->store(Request::create('/api/vacancy-admin', 'POST', [
                'puesto' => '   ',
            ]));
            $this->fail('An empty vacancy must not be published.');
        } catch (ValidationException $exception) {
            $errors = $exception->errors();
            foreach (['puesto', 'departamento', 'horario', 'descripcion_breve', 'descripcion', 'requisitos', 'salario', 'img'] as $field) {
                $this->assertArrayHasKey($field, $errors);
            }
        }
    }

    public function test_invalid_salary_and_long_summary_are_rejected(): void
    {
        foreach (['0', '-100', 'abc', '$100.999'] as $salary) {
            try {
                app(VacancyController::class)->store(Request::create('/api/vacancy-admin', 'POST', [
                    'puesto' => 'Analista', 'departamento' => 'RRHH', 'horario' => 'Tiempo completo',
                    'descripcion_breve' => str_repeat('a', 256), 'descripcion' => 'Descripción completa',
                    'requisitos' => 'Experiencia', 'salario' => $salary,
                ]));
                $this->fail('Invalid values must not be published.');
            } catch (ValidationException $exception) {
                $this->assertArrayHasKey('salario', $exception->errors());
                $this->assertArrayHasKey('descripcion_breve', $exception->errors());
                $this->assertArrayNotHasKey('puesto', $exception->errors());
            }
        }
    }
}
