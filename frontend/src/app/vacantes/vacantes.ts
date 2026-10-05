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
    if (this.descripcion_breve.length > this.limiteDescripcionBreve) {
      alert(
        `La descripcion breve no puede superar los ${this.limiteDescripcionBreve} caracteres permitidos.`,
      );
      return;
    }

    const imagenSeleccionada = imagenInput?.files?.[0] ?? this.imagen;

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

      this.vacancyService.actualizarVacante(this.vacanteSeleccionada.id, vacante).subscribe(() => {
        alert('vacante actualizada');
        this.obtenerInformacion();
        this.cerrarModal();
        this.limpiarFormulario(imagenInput);
      });
    } else {
      if (!imagenSeleccionada) {
        alert('Selecciona una imagen para la vacante.');
        return;
      }

      this.vacancyService.guardarVacante(vacante).subscribe(() => {
        alert('Vacante agregada');
        this.obtenerInformacion();
        this.limpiarFormulario(imagenInput);
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
