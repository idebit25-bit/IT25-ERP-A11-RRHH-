<?php

namespace App\Rules;

use Closure;
use DateTimeImmutable;
use Illuminate\Contracts\Validation\ValidationRule;

class PersonalData implements ValidationRule
{
    public function __construct(private string $field) {}

    private function validBirthDate(string $value): bool
    {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) || $value < '0001-01-01') return false;
        $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
        return $date && $date->format('Y-m-d') === $value
            && $value <= now('America/Mexico_City')->format('Y-m-d');
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $text = trim((string) $value);
        if ($this->field === 'correo') {
            if (strlen($text) > 254 || strlen(explode('@', $text)[0]) > 64 || !preg_match(";^[a-z0-9!#\$%&'*+/=?^_\\x60{|}~-]+(?:\\.[a-z0-9!#\$%&'*+/=?^_\\x60{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,63}\$;i", $text)) {
                $fail('Ingresa un correo v?lido, por ejemplo: test@test.com.');
            }
            return;
        }
        if ($this->field === 'telefono') {
            if (!preg_match('/^\d{10}$/', $text)) $fail('El teléfono debe contener exactamente 10 dígitos, sin espacios ni letras.');
            return;
        }
        if ($this->field === 'fecha_nacimiento') {
            if (!$this->validBirthDate($text)) $fail('Ingresa una fecha real en formato AAAA-MM-DD que no sea futura.');
            return;
        }
        $pattern = '/^[A-Z][AEIOUX][A-Z]{2}\d{6}[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$/';
        $year = (isset($text[16]) && ctype_digit($text[16]) ? '19' : '20') . substr($text, 4, 2);
        $birthDate = $year . '-' . substr($text, 6, 2) . '-' . substr($text, 8, 2);
        if (!preg_match($pattern, $text) || !$this->validBirthDate($birthDate)) {
            $fail('La CURP debe tener 18 caracteres y una estructura y fecha de nacimiento válidas.');
        }
    }
}
