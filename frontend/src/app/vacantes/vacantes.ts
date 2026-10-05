import {
  afterNextRender,
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { VacancyService } from '../services/vacancy';
import { formatMoney, formatMoneyInput, MoneyFormatPipe } from '../shared/money-format';

@Component({
  selector: 'app-vacantes',
  imports: [CommonModule, FormsModule, MoneyFormatPipe],
  templateUrl: './vacantes.html',
  styleUrl: './vacantes.css',
})
export class Vacantes {
  mostrarModal = false;
  intentoGuardar = false;
  guardando = false;
  erroresServidor: string[] = [];

  erroresValidacion(): Record<string, string> {
    const errores: Record<string, string> = {};
    const campos: Record<string, string> = {
      puesto: this.puesto,
      departamento: this.departamento,
      horario: this.horario,
      descripcion_breve: this.descripcion_breve,
      descripcion: this.descripcion,
    };
    const nombres: Record<string, string> = {
      puesto: 'el puesto',
      departamento: 'el departamento',
      horario: 'el horario',
      descripcion_breve: 'la descripción breve',
      descripcion: 'la descripción completa',
    };
    for (const [campo, valor] of Object.entries(campos)) {
      if (!valor?.trim()) errores[campo] = 'Completa ' + nombres[campo] + '.';
    }
    for (const campo of ['puesto', 'departamento', 'horario', 'descripcion_breve']) {
      if (campos[campo]?.length > 255)
        errores[campo] = 'Este campo no puede superar 255 caracteres.';
    }
    const importe = Number(this.salario.replace(/[\s,$]/g, ''));
    if (!this.salario.trim() || !Number.isFinite(importe) || importe <= 0)
      errores['salario'] = 'Ingresa un salario mayor que cero.';
    if (!this.requisitos.length || this.requisitos.some((requisito) => !requisito.trim()))
      errores['requisitos'] =
        'Completa todos los requisitos agregados o elimina los que no necesites.';
    if (!this.imagen && !(this.modoEdicion && this.img))
      errores['img'] = 'Selecciona una imagen de referencia.';
    if (this.imagen && !['image/png', 'image/jpeg', 'image/webp'].includes(this.imagen.type))
      errores['img'] = 'Selecciona una imagen PNG, JPG o WebP.';
    if (this.imagen && this.imagen.size > 5 * 1024 * 1024)
      errores['img'] = 'La imagen no debe superar 5 MB.';
    return errores;
  }

  errorCampo(campo: string): string {
    return this.intentoGuardar ? this.erroresValidacion()[campo] || '' : '';
  }

  get erroresFormulario(): string[] {
    return this.intentoGuardar
      ? [...Object.values(this.erroresValidacion()), ...this.erroresServidor]
      : [];
  }

  private errorGuardado(error: any) {
    this.guardando = false;
    this.erroresServidor =
      error.status === 422 && error.error?.errors
        ? (Object.values(error.error.errors).flat() as string[])
        : ['No se pudo guardar la vacante. Revisa tu conexión e intenta nuevamente.'];
    this.changeDetector.markForCheck();
  }
  readonly limiteDescripcionBreve = 255;
  readonly limiteTextoTabla = 100;
  formularioAbierto = false;
  detalleVacante: any = null;
  campoDetalle: 'descripcion' | 'requisitos' = 'descripcion';
  @ViewChild('detalleDialog') detalleDialog!: ElementRef<HTMLDialogElement>;

  sincronizarFormulario(event: Event) {
    this.formularioAbierto = (event.target as HTMLDetailsElement).open;
  }

  abrirDetalle(vacante: any, campo: 'descripcion' | 'requisitos') {
    this.detalleVacante = vacante;
    this.campoDetalle = campo;
    this.changeDetector.detectChanges();
    this.detalleDialog.nativeElement.showModal();
  }
  private alertaDescripcionBreveMostrada = false;

  abrirModal() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  abrirModalEliminar(vacante: any) {
    this.vacanteSeleccionada = vacante;
    this.mostrarModal = true;
  }

  protected readonly title = signal('frontend');

  informacion: any[] = [];

  puesto = '';
  departamento = '';
  descripcion_breve = '';
  descripcion = '';
  horario = '';
  requisitos: string[] = [''];
  salario = '';
  img = '';
  imagen: File | null = null;

  vacanteSeleccionada: any = null;
  modoEdicion = false;

  private readonly vacancyService = inject(VacancyService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  constructor() {
    afterNextRender(() => {
      queueMicrotask(() => this.obtenerInformacion());
    });
  }

  obtenerInformacion() {
    this.vacancyService.obtenerInformacion().subscribe((data: any) => {
      console.log(data);

      this.informacion = data;
      this.changeDetector.markForCheck();
    });
  }

  seleccionarImagen(event: Event) {
    const input = event.target as HTMLInputElement;

    this.imagen = input.files?.[0] ?? null;
  }

  formatearSalario(valor: string) {
    this.salario = formatMoneyInput(valor);
  }

  guardarVacante(imagenInput?: HTMLInputElement) {
    if (this.guardando) return;
    this.intentoGuardar = true;
    this.erroresServidor = [];
    this.imagen = imagenInput?.files?.[0] ?? this.imagen;
    if (Object.keys(this.erroresValidacion()).length) {
      this.changeDetector.detectChanges();
      document.querySelector<HTMLElement>('.vacancy-form [aria-invalid="true"]')?.focus();
      return;
    }
    this.guardando = true;
    const imagenSeleccionada = this.imagen;

    const vacante = new FormData();

    vacante.append('puesto', this.puesto);
    vacante.append('departamento', this.departamento);
    vacante.append('descripcion_breve', this.descripcion_breve);
    vacante.append('descripcion', this.descripcion);
    vacante.append('horario', this.horario);
    vacante.append('requisitos', this.requisitosLimpios().join('\n'));
    vacante.append('salario', this.salario);

    if (imagenSeleccionada) {
      vacante.append('img', imagenSeleccionada, imagenSeleccionada.name);
    }

    if (this.modoEdicion) {
      vacante.append('_method', 'PUT');

      this.vacancyService.actualizarVacante(this.vacanteSeleccionada.id, vacante).subscribe({
        next: () => {
          alert('vacante actualizada');
          this.obtenerInformacion();
          this.cerrarModal();
          this.limpiarFormulario(imagenInput);
        },
        error: (error) => this.errorGuardado(error),
      });
    } else {
      this.vacancyService.guardarVacante(vacante).subscribe({
        next: () => {
          alert('Vacante agregada');
          this.obtenerInformacion();
          this.limpiarFormulario(imagenInput);
        },
        error: (error) => this.errorGuardado(error),
      });
    }
  }

  eliminarVacante(id: number) {
    this.vacancyService.eliminarVacante(id).subscribe(() => {
      this.mostrarModal = false;

      alert('Vacante eliminada');

      this.obtenerInformacion();
    });
  }

  editarVacante(vacante: any) {
    this.intentoGuardar = false;
    this.erroresServidor = [];
    this.formularioAbierto = true;
    this.changeDetector.detectChanges();
    document.querySelector('.editor-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.modoEdicion = true;

    this.vacanteSeleccionada = vacante;

    this.puesto = vacante.puesto;
    this.departamento = vacante.departamento || '';
    this.descripcion_breve = vacante.descripcion_breve;
    this.descripcion = vacante.descripcion;
    this.horario = vacante.horario;
    this.requisitos = this.separarRequisitos(vacante.requisitos);
    this.salario = formatMoney(vacante.salario);
    this.img = vacante.img;
    this.imagen = null;
  }

  limpiarFormulario(imagenInput?: HTMLInputElement) {
    this.intentoGuardar = false;
    this.guardando = false;
    this.erroresServidor = [];
    this.puesto = '';
    this.departamento = '';
    this.descripcion_breve = '';
    this.descripcion = '';
    this.horario = '';
    this.requisitos = [''];
    this.salario = '';
    this.img = '';
    this.imagen = null;
    this.vacanteSeleccionada = null;
    this.modoEdicion = false;

    if (imagenInput) {
      imagenInput.value = '';
    }
  }

  cambiarEstado(id: number) {
    this.vacancyService.cambiarEstado(id).subscribe(() => {
      this.obtenerInformacion();
    });
  }

  validarDescripcionBreve(valor: string) {
    this.descripcion_breve = valor;

    if (valor.length > this.limiteDescripcionBreve) {
      if (!this.alertaDescripcionBreveMostrada) {
        alert(
          `Has pasado de los ${this.limiteDescripcionBreve} caracteres permitidos en la descripcion breve.`,
        );
        this.alertaDescripcionBreveMostrada = true;
      }
      return;
    }

    this.alertaDescripcionBreveMostrada = false;
  }

  agregarRequisito() {
    this.requisitos.push('');
  }

  eliminarRequisito(index: number) {
    if (this.requisitos.length === 1) {
      this.requisitos[0] = '';
      return;
    }

    this.requisitos.splice(index, 1);
  }

  trackByIndex(index: number) {
    return index;
  }

  private requisitosLimpios() {
    return this.requisitos
      .map((requisito) => requisito.trim())
      .filter((requisito) => requisito.length > 0);
  }

  separarRequisitos(requisitos: string) {
    const separados = (requisitos || '')
      .split(/\r?\n|,/)
      .map((requisito) => requisito.trim())
      .filter((requisito) => requisito.length > 0);

    return separados.length ? separados : [''];
  }

  textoRequisitos(requisitos: string) {
    return this.separarRequisitos(requisitos).join('\n');
  }

  textoVisible(texto: string) {
    const textoSeguro = texto || '';
    return textoSeguro.length > this.limiteTextoTabla
      ? textoSeguro.slice(0, this.limiteTextoTabla).trim() + '…'
      : textoSeguro;
  }
}
