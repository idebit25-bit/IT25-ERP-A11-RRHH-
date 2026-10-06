import { Directive, forwardRef, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

export type PersonalField = 'correo' | 'telefono' | 'curp' | 'fecha_nacimiento';

export function todayMexico(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (name: string) => parts.find((p) => p.type === name)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function validBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '0001-01-01' || value > todayMexico())
    return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function personalDataError(field: PersonalField, value: unknown): string {
  const text = String(value ?? '').trim();
  if (!text) return 'Este campo es obligatorio.';
  if (field === 'correo')
    return text.length <= 254 &&
      text.split('@')[0].length <= 64 &&
      /^[a-z0-9!#$%&'*+/=?^_\x60{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_\x60{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(
        text,
      )
      ? ''
      : 'Ingresa un correo válido, por ejemplo: test@test.com.';
  if (field === 'telefono')
    return /^\d{10}$/.test(text)
      ? ''
      : 'El teléfono debe contener exactamente 10 dígitos, sin espacios ni letras.';
  if (field === 'fecha_nacimiento')
    return validBirthDate(text)
      ? ''
      : 'Ingresa una fecha real en formato AAAA-MM-DD que no sea futura.';
  const curp = text.toUpperCase();
  const pattern =
    /^[A-Z][AEIOUX][A-Z]{2}\d{6}[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$/;
  const year = (/\d/.test(curp[16] ?? '') ? '19' : '20') + curp.slice(4, 6);
  const birthDate = `${year}-${curp.slice(6, 8)}-${curp.slice(8, 10)}`;
  return pattern.test(curp) && validBirthDate(birthDate)
    ? ''
    : 'La CURP debe tener 18 caracteres y una estructura y fecha de nacimiento válidas.';
}

@Directive({
  selector: '[personalField]',
  standalone: true,
  providers: [
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => PersonalDataValidator), multi: true },
  ],
})
export class PersonalDataValidator implements Validator {
  @Input({ required: true }) personalField!: PersonalField;
  validate(control: AbstractControl): ValidationErrors | null {
    const message = personalDataError(this.personalField, control.value);
    return message ? { personalData: message } : null;
  }
}
