import { PersonalDataValidator, personalDataError } from '../shared/personal-data';
import { afterNextRender, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserAccountService } from '../services/user-account';

@Component({
  selector: 'app-usuario-registro',
  standalone: true,
  imports: [PersonalDataValidator, CommonModule, FormsModule, RouterLink],
  templateUrl: './usuario-registro.html',
  styleUrl: './usuario-registro.css',
})
export class UsuarioRegistro {

  nombre = '';
  apellido = '';
  correo = '';
  password = '';
  telefono = '';
  curp = '';
  direccion = '';
  fecha_nacimiento = '';
  datosFormulario: any = null;
  error = '';
  private readonly changeDetector = inject(ChangeDetectorRef);

  private readonly userAccountService =
    inject(UserAccountService);

  private readonly router =
    inject(Router);

  constructor() {
    afterNextRender(() => {
      queueMicrotask(() => {
        this.cargarDatosPendientes();
        this.changeDetector.markForCheck();
      });
    });
  }

  cargarDatosPendientes() {
    const datos = this.userAccountService
      .obtenerDatosFormularioPendientes();

    if (!datos) return;

    this.datosFormulario = datos;
    this.nombre = datos.nombre || '';
    this.apellido = datos.apellido
      || `${datos.apellido_paterno || ''} ${datos.apellido_materno || ''}`.trim();
    this.correo = datos.email || '';
    this.telefono = datos.telefono || '';
    this.curp = datos.curp || '';
    this.direccion = datos.direccion || '';
    this.fecha_nacimiento = datos.fecha_nacimiento || '';
  }

  crearCuenta() {
    this.error = '';
    this.curp = this.curp.trim().toUpperCase();
    for (const field of ['correo', 'telefono', 'curp', 'fecha_nacimiento'] as const) {
      const message = personalDataError(field, this[field]);
      if (message) { this.error = message; return; }
    }

    if (!this.password.trim() || this.password.length < 6) {
      this.error = 'Crea una contraseña de al menos 6 caracteres para registrar tu cuenta.';
      return;
    }

    this.userAccountService
      .crearCuenta({
        nombre: this.nombre,
        apellido: this.apellido,
        correo: this.correo,
        password: this.password,
        telefono: this.telefono,
        curp: this.curp,
        direccion: this.direccion,
        fecha_nacimiento: this.fecha_nacimiento,
        datos_formulario: this.datosFormulario,
      })
      .subscribe({
        next: () => {
          this.userAccountService.limpiarDatosFormularioPendientes();

          if (this.datosFormulario?.vacanteId) {
            this.router.navigate(['/form'], {
              queryParams: {
                vacanteId: this.datosFormulario.vacanteId,
              },
            });
            return;
          }

          this.router.navigate(['/usuario']);
        },
        error: (error) => {
          const errores = error?.error?.errors;
          const primerError = errores
            ? Object.values(errores).flat()[0]
            : error?.error?.message;

          this.error = primerError
            ? String(primerError)
            : 'No se pudo crear la cuenta. Revisa los datos.';
          this.changeDetector.markForCheck();
        },
      });
  }
}
