<?php

namespace Tests\Feature;

use App\Http\Controllers\ApplicantsController;
use App\Http\Controllers\UsuarioController;
use App\Rules\PersonalData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class PersonalDataValidationTest extends TestCase
{
    public function test_shared_rules_reject_invalid_personal_data(): void
    {
        $this->travelTo(now('America/Mexico_City')->setDate(2026, 10, 6)->startOfDay());
        $cases = [
            'correo' => ['test', 'test@test', 'test@@test.com', 'test test@test.com', '.test@test.com', 'test..test@test.com', 'test@-test.com'],
            'telefono' => ['123456789', '12345678901', '55 12345678', '551234567a', '+525512345678'],
            'curp' => ['QDUIGDSIUS8HUUWQ', 'AAAAAAAAAAAAAAAAAA', 'GODE560231HDFRRN09', 'GODE561231HZZRRN09', 'GODE561231HDFRRN0X'],
            'fecha_nacimiento' => ['2001-02-29', '2026-04-31', '2026-10-07', '15/11/2002', '2002-11-15 24 años', '2002-1-1', '0000-01-01'],
        ];
        foreach ($cases as $field => $values) {
            foreach ($values as $value) {
                $this->assertTrue(Validator::make([$field => $value], [$field => new PersonalData($field)])->fails(), $field . ': ' . $value);
            }
        }
    }

    public function test_shared_rules_accept_valid_values_including_leap_year_and_leading_zero(): void
    {
        foreach (['correo' => ['test@test.com', 'ana.lopez+rrhh@empresa.com.mx', 'TEST@EXAMPLE.COM'], 'telefono' => ['5512345678', '0123456789'], 'curp' => ['GODE561231HDFRRN09', 'GODE000229HDFRRNA0'], 'fecha_nacimiento' => ['2000-02-29', '2002-11-15']] as $field => $values) {
            foreach ($values as $value) {
                $this->assertFalse(Validator::make([$field => $value], [$field => new PersonalData($field)])->fails());
            }
        }
    }

    public function test_both_registration_and_application_reject_invalid_data_before_saving(): void
    {
        foreach ([UsuarioController::class, ApplicantsController::class] as $controller) {
            try {
                app($controller)->store(Request::create('/', 'POST', ['correo' => 'test@test', 'email' => 'test@test', 'telefono' => '123', 'curp' => 'ABC', 'fecha_nacimiento' => '2002-02-30']));
                $this->fail('Invalid personal data must not be saved.');
            } catch (ValidationException $exception) {
                foreach ([$controller === UsuarioController::class ? 'correo' : 'email', 'telefono', 'curp', 'fecha_nacimiento'] as $field) $this->assertArrayHasKey($field, $exception->errors());
            }
        }
    }

    public function test_application_normalizes_lowercase_curp_before_validating(): void
    {
        $request = Request::create('/', 'POST', ['curp' => 'gode561231hdfrrn09']);
        try {
            app(ApplicantsController::class)->store($request);
            $this->fail('The remaining required fields are missing.');
        } catch (ValidationException $exception) {
            $this->assertArrayNotHasKey('curp', $exception->errors());
            $this->assertSame('GODE561231HDFRRN09', $request->curp);
        }
    }
}
