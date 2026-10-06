import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FormControl } from '@angular/forms';
import { personalDataError, PersonalDataValidator } from './personal-data';

describe('Personal data validation', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-07T01:00:00Z')); });
  afterEach(() => vi.useRealTimers());

  it.each(['test@test.com', 'ana.lopez+rrhh@empresa.com.mx', 'TEST@EXAMPLE.COM'])('accepts email: %s', value => {
    expect(personalDataError('correo', value)).toBe('');
  });
  it.each(['test', 'test@test', 'test@@test.com', 'test test@test.com', '.test@test.com', 'test..test@test.com', 'test@-test.com'])('rejects email: %s', value => {
    expect(personalDataError('correo', value)).not.toBe('');
  });
  it.each(['5512345678', '0123456789'])('accepts ten digits: %s', value => {
    expect(personalDataError('telefono', value)).toBe('');
  });
  it.each(['', '123456789', '12345678901', '55 12345678', '551234567a', '+525512345678'])('rejects invalid phone: %s', value => {
    expect(personalDataError('telefono', value)).not.toBe('');
  });
  it.each(['GODE561231HDFRRN09', 'gode561231hdfrrn09', 'GODE000229HDFRRNA0'])('accepts CURP structure: %s', value => {
    expect(personalDataError('curp', value)).toBe('');
  });
  it.each(['QDUIGDSIUS8HUUWQ', 'AAAAAAAAAAAAAAAAAA', 'GODE560231HDFRRN09', 'GODE561231HZZRRN09', 'GODE561231HDFRRN0X'])('rejects invalid CURP: %s', value => {
    expect(personalDataError('curp', value)).not.toBe('');
  });
  it.each(['2000-02-29', '2002-11-15', '2026-10-06'])('accepts real birth date: %s', value => {
    expect(personalDataError('fecha_nacimiento', value)).toBe('');
  });
  it.each(['2001-02-29', '2026-04-31', '2026-10-07', '15/11/2002', '2002-11-15 24 años', '2002-1-1', '0000-01-01'])('rejects invalid birth date: %s', value => {
    expect(personalDataError('fecha_nacimiento', value)).not.toBe('');
  });
  it('marks an Angular form control invalid so registration cannot submit', () => {
    const validator = new PersonalDataValidator();
    validator.personalField = 'telefono';
    const control = new FormControl('123', validator.validate.bind(validator));
    expect(control.invalid).toBe(true);
    control.setValue('5512345678');
    expect(control.valid).toBe(true);
  });
});
