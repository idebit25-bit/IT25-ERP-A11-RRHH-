import { PersonalDataValidator, personalDataError } from '../shared/personal-data';
import { afterNextRender, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { AdditionalInformationService }
from '../services/additional-information';

import { ApplicantsService }
from '../services/applicants';

import { EducationsService }
from '../services/educations';

import { JobApplicationsService }
from '../services/job-applications';

import { WorkExperiencesService }
from '../services/work-experiences';

import { SkillsService }
from '../services/skills';

import { UsuariosService }
from '../services/usuarios';

import { UserAccountService }
from '../services/user-account';
import { formatMoneyInput } from '../shared/money-format';

@Component({
  selector: 'app-formulario',
  standalone: true,
  imports: [PersonalDataValidator, CommonModule, FormsModule],
  templateUrl: './formulario.html',
  styleUrl: './formulario.css',
})
export class Formulario {

  protected readonly title = signal('frontend');

  informacion: any[] = [];
  erroresFormulario: string[] = [];
  erroresPorCampo: Record<string, string[]> = {};
  formSubmitted = false;
  mostrarAvisoArchivos = false;
  mensajeVacanteNoAceptada = '';
  readonly limiteCampoCorto = 255;

  nombre = '';
  apellidoPaterno = '';
  apellidoMaterno = '';
  email = '';
  telefono = '';
  curp = '';
  direccion = '';
  fecha_nacimiento = '';
  estado_civil = '';
  credito_infonavit = false;

  nivel_educativo = '';
  institucion = '';
  titulo_obtenido = '';

  puesto_aplicado = '';
  area = '';
  sueldo_percibido = '';

  tiempo_experiencia = '';
  trabaja_actualmente = false;
  sueldo_actual = '';

  habilidades_blandas = '';

  disponibilidad_horario = '';
  licencia_conducir = false;
  vehiculo_propio = false;
  discapacidad = false;

  tipo_de = '';
  otras_caracteristicas = '';

  cv: File | null = null;
  carta: File | null = null;
  vacanteId: number | null = null;

  cursos: string[] = [''];
  idiomas: string[] = [''];
  software: string[] = [''];
  habilidadesTecnicas: string[] = [''];

  experiencias = [
    {
      empresa: '',
      puesto: '',
      periodo: '',
      responsabilidades: '',
      motivo_salida: '',
    }
  ];

  private readonly applicantsService =
    inject(ApplicantsService);

  private readonly educationsService =
    inject(EducationsService);

  private readonly jobApplicationsService =
    inject(JobApplicationsService);

  private readonly additionalService =
    inject(AdditionalInformationService);

  private readonly workExperiencesService =
    inject(WorkExperiencesService);

  private readonly skillsService =
    inject(SkillsService);

  private readonly router =
    inject(Router);

  private readonly route =
    inject(ActivatedRoute);

  private readonly usuariosService =
    inject(UsuariosService);

  private readonly userAccountService =
    inject(UserAccountService);

  private readonly changeDetector =
    inject(ChangeDetectorRef);

  constructor() {
    afterNextRender(() => {
      this.cargarDatosUsuario();
      this.obtenerInformacion();
      this.cargarVacanteSeleccionada();
    });
  }

  cargarDatosUsuario() {
    const usuario = this.userAccountService.obtenerUsuario();

    if (!usuario) return;

    if (usuario.datos_formulario) {
      this.aplicarDatosFormulario(usuario.datos_formulario);
      this.mostrarAvisoArchivos = true;
    }

    this.nombre = usuario.nombre || '';
    const apellidos = this.separarApellidos(usuario.apellido || '');

    this.apellidoPaterno = this.apellidoPaterno || apellidos.paterno;
    this.apellidoMaterno = this.apellidoMaterno || apellidos.materno;
    this.email = usuario.correo || '';
    this.telefono = usuario.telefono || '';
    this.curp = usuario.curp || '';
    this.direccion = usuario.direccion || '';
    this.fecha_nacimiento = usuario.fecha_nacimiento || '';
  }

  aplicarDatosFormulario(datos: any) {
    const apellidos = this.separarApellidos(datos.apellido || '');

    this.nombre = datos.nombre || this.nombre;
    this.apellidoPaterno = datos.apellido_paterno
      || datos.apellidoPaterno
      || apellidos.paterno
      || this.apellidoPaterno;
    this.apellidoMaterno = datos.apellido_materno
      || datos.apellidoMaterno
      || apellidos.materno
      || this.apellidoMaterno;
    this.email = datos.email || this.email;
    this.telefono = datos.telefono || this.telefono;
    this.curp = datos.curp || this.curp;
    this.direccion = datos.direccion || this.direccion;
    this.fecha_nacimiento = datos.fecha_nacimiento || this.fecha_nacimiento;
    this.estado_civil = datos.estado_civil || this.estado_civil;
    this.credito_infonavit = Boolean(datos.credito_infonavit);
    this.nivel_educativo = datos.nivel_educativo || '';
    this.institucion = datos.institucion || '';
    this.titulo_obtenido = datos.titulo_obtenido || '';
    this.sueldo_percibido = formatMoneyInput(datos.sueldo_percibido);
    this.tiempo_experiencia = datos.tiempo_experiencia || '';
    this.trabaja_actualmente = Boolean(datos.trabaja_actualmente);
    this.sueldo_actual = formatMoneyInput(datos.sueldo_actual);
    this.habilidades_blandas = datos.habilidades_blandas || '';
    this.disponibilidad_horario = datos.disponibilidad_horario || '';
    this.licencia_conducir = Boolean(datos.licencia_conducir);
    this.vehiculo_propio = Boolean(datos.vehiculo_propio);
    this.discapacidad = Boolean(datos.discapacidad);
    this.tipo_de = datos.tipo_de || '';
    this.otras_caracteristicas = datos.otras_caracteristicas || '';
    this.cursos = datos.cursos?.length ? datos.cursos : [''];
    this.idiomas = datos.idiomas?.length ? datos.idiomas : [''];
    this.software = datos.software?.length ? datos.software : [''];
    this.habilidadesTecnicas = datos.habilidadesTecnicas?.length
      ? datos.habilidadesTecnicas
      : [''];
    this.experiencias = datos.experiencias?.length
      ? datos.experiencias
      : this.experiencias;
  }

  agregarCurso() {
    this.cursos.push('');
  }

  eliminarCurso(index: number) {
    this.cursos.splice(index, 1);
  }

  agregarIdioma() {
    this.idiomas.push('');
  }

  eliminarIdioma(index: number) {
    this.idiomas.splice(index, 1);
  }

  agregarSoftware() {
    this.software.push('');
  }

  eliminarSoftware(index: number) {
    this.software.splice(index, 1);
  }

  agregarHabilidadTecnica() {
    this.habilidadesTecnicas.push('');
  }

  eliminarHabilidadTecnica(index: number) {
    this.habilidadesTecnicas.splice(index, 1);
  }

  agregarExperiencia() {
    this.experiencias.push({
      empresa: '',
      puesto: '',
      periodo: '',
      responsabilidades: '',
      motivo_salida: '',
    });
  }

  eliminarExperiencia(index: number) {
    this.experiencias.splice(index, 1);
  }

  obtenerInformacion() {
    this.additionalService.obtenerInformacion()
      .subscribe((data: any) => {
        this.informacion = data;
        this.changeDetector.detectChanges();
      });
  }

  cargarVacanteSeleccionada() {
    const vacanteId = Number(
      this.route.snapshot.queryParamMap.get('vacanteId')
    );

    if (!vacanteId) return;

    this.vacanteId = vacanteId;

    const vacanteNoAceptada =
      this.userAccountService.obtenerVacanteNoAceptada(vacanteId);

    if (vacanteNoAceptada) {
      this.asignarVacanteNoAceptada(
        vacanteNoAceptada.mensaje
          || 'No se aprobo tu solicitud para esta vacante, por eso no puedes volver a postularte.'
      );
    }

    this.usuariosService
      .obtenerVacante(vacanteId)
      .subscribe((vacante: any) => {
        this.puesto_aplicado = vacante.puesto || '';
        this.area = vacante.departamento || '';
        this.verificarVacanteDadaDeBaja(vacanteId, vacante);
        this.changeDetector.detectChanges();
      });
  }

  verificarVacanteDadaDeBaja(vacanteId: number, vacante: any) {
    const usuario = this.userAccountService.obtenerUsuario();

    if (!usuario) return;

    forkJoin({
      applicants: this.applicantsService.obtenerApplicants(),
      postulaciones: this.jobApplicationsService.obtenerJobApplications(),
    }).subscribe({
      next: ({ applicants, postulaciones }: any) => {
        const postulante = (applicants || []).find((applicant: any) => {
          const mismoCorreo = applicant.email
            && usuario.correo
            && applicant.email === usuario.correo;
          const mismaCurp = applicant.curp
            && usuario.curp
            && applicant.curp === usuario.curp;

          return (mismoCorreo || mismaCurp)
            && String(applicant.status || '').toLowerCase() === 'baja';
        });

        if (!postulante) return;

        const postulacionBaja = (postulaciones || []).find(
          (postulacion: any) =>
            postulacion.applicant_id === postulante.id
            && Number(postulacion.vacancy_id) === vacanteId
        );

        if (!postulacionBaja) return;

        const mensaje = `No se aprobo tu solicitud para la vacante ${vacante?.puesto || this.puesto_aplicado || 'seleccionada'}, por eso no puedes volver a postularte.`;

        this.asignarVacanteNoAceptada(mensaje);
        this.userAccountService.guardarVacanteNoAceptada({
          id: vacanteId,
          puesto: vacante?.puesto || this.puesto_aplicado,
          mensaje,
        });
        this.changeDetector.detectChanges();
      },
    });
  }

  seleccionarArchivo(event: Event, tipo: 'cv' | 'carta') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (tipo === 'cv') {
      this.cv = file;
    } else {
      this.carta = file;
    }
  }

  formatearSueldoPercibido(valor: string) {
    this.sueldo_percibido = formatMoneyInput(valor);
  }

  formatearSueldoActual(valor: string) {
    this.sueldo_actual = formatMoneyInput(valor);
  }

  guardarFormulario(
    formulario?: any,
    cvFiles?: FileList | null,
    cartaFiles?: FileList | null
  ) {
    this.curp = this.curp.trim().toUpperCase();
    this.formSubmitted = true;
    this.erroresPorCampo = {};
    this.erroresFormulario = [];

    if (this.mensajeVacanteNoAceptada) {
      this.asignarVacanteNoAceptada(this.mensajeVacanteNoAceptada);
      this.desplazarAlPrimerError();
      return;
    }

    const cvSeleccionado = cvFiles?.[0] ?? this.cv;
    const cartaSeleccionada = cartaFiles?.[0] ?? this.carta;

    const erroresLocales = this.obtenerErroresFormulario(
      formulario,
      cvSeleccionado,
      cartaSeleccionada
    );

    if (Object.keys(this.erroresPorCampo).length > 0) {
      this.erroresFormulario = [];
      this.desplazarAlPrimerError();

      return;
    }

    if (erroresLocales.length > 0) {
      this.erroresFormulario = erroresLocales;
      this.desplazarAlPrimerError();

      return;
    }

    if (!this.userAccountService.estaAutenticado()) {
      const crearCuenta = confirm(
        'No has iniciado sesion. Quieres crear una cuenta para guardar tus datos y usarlos en futuras postulaciones?'
      );

      if (crearCuenta) {
        this.userAccountService
          .guardarDatosFormularioPendientes(this.obtenerDatosFormulario());

        this.router.navigate(['/crear-cuenta'], {
          queryParams: {
            desdeFormulario: '1',
          },
        });

        return;
      }
    }

    const applicants = new FormData();

    applicants.append('nombre', this.nombre);
    applicants.append('apellido_paterno', this.apellidoPaterno);
    applicants.append('apellido_materno', this.apellidoMaterno);
    applicants.append('curp', this.curp);
    applicants.append('email', this.email);
    applicants.append('telefono', this.telefono);
    applicants.append('direccion', this.direccion);
    applicants.append('fecha_nacimiento', this.fecha_nacimiento);
    applicants.append('estado_civil', this.estado_civil);
    applicants.append('puesto_aplicado', this.puesto_aplicado);
    applicants.append('area', this.area);

    if (this.vacanteId) {
      applicants.append('vacancy_id', String(this.vacanteId));
    }

    applicants.append(
      'credito_infonavit',
      this.credito_infonavit ? '1' : '0'
    );

    if (cvSeleccionado) {
      applicants.append(
        'cv',
        cvSeleccionado,
        cvSeleccionado.name
      );
    }

    if (cartaSeleccionada) {
      applicants.append(
        'carta',
        cartaSeleccionada,
        cartaSeleccionada.name
      );
    }

    this.applicantsService
      .guardarAplicante(applicants)
      .pipe(
        switchMap((respuesta: any) => {
          const applicantId = respuesta.id;

          const educations = {
            applicant_id: applicantId,
            nivel_educativo: this.nivel_educativo,
            institucion: this.institucion,
            titulo_obtenido: this.titulo_obtenido,
            cursos: this.cursos.join(', ')
          };

          const jobApplication = {
            applicant_id: applicantId,
            vacancy_id: this.vacanteId,
            puesto_aplicado: this.puesto_aplicado,
            area: this.area,
            sueldo_percibido: this.sueldo_percibido
          };

          const workExperiences = this.experiencias.map((exp) => {
            return {
              applicant_id: applicantId,
              tiempo_experiencia: this.tiempo_experiencia,
              empresa: exp.empresa,
              puesto: exp.puesto,
              periodo: exp.periodo,
              responsabilidades: exp.responsabilidades,
              motivo_salida: exp.motivo_salida,
              trabaja_actualmente: this.trabaja_actualmente,
              sueldo_actual: this.sueldo_actual
            };
          });

          const skill = {
            applicant_id: applicantId,
            idiomas: this.idiomas.join(', '),
            software: this.software.join(', '),
            habilidades_tecnicas:
              this.habilidadesTecnicas.join(', '),
            habilidades_blandas:
              this.habilidades_blandas
          };

          const info = {
            applicant_id: applicantId,
            licencia_conducir: this.licencia_conducir,
            vehiculo_propio: this.vehiculo_propio,
            discapacidad: this.discapacidad,
            disponibilidad_horario: this.disponibilidad_horario,
            tipo_de: this.tipo_de,
            otras_caracteristicas: this.otras_caracteristicas
          };

          const solicitudes = [
            this.educationsService.guardarEducation(educations),
            this.jobApplicationsService.guardarJobApplication(jobApplication),
            this.skillsService.guardarSkill(skill),
            this.additionalService.guardarInformacion(info),
            ...workExperiences.map((workExperience) =>
              this.workExperiencesService
                .guardarWorkExperience(workExperience)
            )
          ];

          return forkJoin(solicitudes);
        })
      )
      .subscribe({
        next: () => {
          alert('Formulario enviado correctamente');
          this.router.navigate(['/']);
        },
        error: (error) => {
          console.error(error);
          this.erroresPorCampo = {};
          this.erroresFormulario = this.obtenerErroresServidor(error);

          const mensajeServidor = this.erroresFormulario.join(' ');

          if (
            this.vacanteId
            && /ya se postulo|ya se postul/i.test(mensajeServidor)
          ) {
            const mensaje = `No se aprobo tu solicitud para la vacante ${this.puesto_aplicado || 'seleccionada'}, por eso no puedes volver a postularte.`;

            this.asignarVacanteNoAceptada(mensaje);
            this.userAccountService.guardarVacanteNoAceptada({
              id: this.vacanteId,
              puesto: this.puesto_aplicado,
              mensaje,
            });
          }

          if (
            this.erroresFormulario.length === 0
            && !this.mensajeVacanteNoAceptada
          ) {
            this.erroresFormulario = [
              'No se pudo guardar el formulario completo. Revisa los datos e intentalo otra vez.'
            ];
          }

          if (
            Object.keys(this.erroresPorCampo).length > 0
            && !this.mensajeVacanteNoAceptada
          ) {
            this.erroresFormulario = [];
          }

          this.desplazarAlPrimerError();
        }
      });
  }

  obtenerErroresServidor(error: any) {
    const errores = error?.error?.errors;
    const errorTexto = typeof error?.error === 'string'
      ? error.error
      : '';

    if (errores) {
      Object.entries(errores).forEach(([campo, mensajes]) => {
        this.agregarErrorCampo(
          this.normalizarCampoServidor(campo),
          String((mensajes as any[]).flat()[0])
        );
      });

      return Object.values(errores)
        .flat()
        .map((mensaje) => String(mensaje));
    }

    if (error?.error?.message) {
      return [String(error.error.message)];
    }

    if (errorTexto.includes('Este usuario ya se postulo a esta vacante')) {
      return ['Este usuario ya se postulo a esta vacante.'];
    }

    if (errorTexto) {
      const mensajeJson = errorTexto.match(/"message"\s*:\s*"([^"]+)"/);

      if (mensajeJson?.[1]) {
        return [mensajeJson[1]];
      }
    }

    return [];
  }

  obtenerErroresFormulario(
    formulario?: any,
    cvSeleccionado?: File | null,
    cartaSeleccionada?: File | null
  ) {
    const errores: string[] = [];
    this.erroresPorCampo = {};

    for (const field of ['telefono', 'curp', 'fecha_nacimiento'] as const) {
      if (!this.campoVacio(this[field])) {
        const message = personalDataError(field, this[field]);
        if (message) { errores.push(message); this.agregarErrorCampo(field, message); }
      }
    }

    const requeridos = [
      { valor: this.nombre, campo: 'Nombre(s)', seccion: 'Datos Personales', key: 'nombre' },
      { valor: this.apellidoPaterno, campo: 'Apellido paterno', seccion: 'Datos Personales', key: 'apellido_paterno' },
      { valor: this.apellidoMaterno, campo: 'Apellido materno', seccion: 'Datos Personales', key: 'apellido_materno' },
      { valor: this.telefono, campo: 'Telefono', seccion: 'Datos Personales', key: 'telefono' },
      { valor: this.email, campo: 'Correo electronico', seccion: 'Datos Personales', key: 'correo' },
      { valor: this.curp, campo: 'CURP', seccion: 'Datos Personales', key: 'curp' },
      { valor: this.direccion, campo: 'Direccion', seccion: 'Datos Personales', key: 'direccion' },
      { valor: this.fecha_nacimiento, campo: 'Fecha de nacimiento y edad', seccion: 'Datos Personales', key: 'fecha_nacimiento' },
      { valor: this.estado_civil, campo: 'Estado civil', seccion: 'Datos Personales', key: 'estado_civil' },
      { valor: this.puesto_aplicado, campo: 'Nombre del puesto', seccion: 'Puesto Solicitado', key: 'puesto' },
      { valor: this.area, campo: 'Area / Departamento', seccion: 'Puesto Solicitado', key: 'departamento' },
      { valor: this.nivel_educativo, campo: 'Nivel de estudios', seccion: 'Educacion', key: 'nivel_estudios' },
      { valor: this.institucion, campo: 'Escuela', seccion: 'Educacion', key: 'escuela' },
      { valor: this.titulo_obtenido, campo: 'Carrera o especialidad', seccion: 'Educacion', key: 'carrera' },
      { valor: this.habilidades_blandas, campo: 'Habilidades blandas', seccion: 'Habilidades', key: 'habilidades_blandas' },
    ];

    requeridos.forEach((item) => {
      if (this.campoVacio(item.valor)) {
        const mensaje = `Falta ${item.campo}.`;
        errores.push(`${item.seccion}: ${mensaje}`);
        this.agregarErrorCampo(item.key, mensaje);
      }
    });

    if (!this.campoVacio(this.email) && !this.correoValido(this.email)) {
      const mensaje = personalDataError('correo', this.email);
      errores.push(`Datos Personales: ${mensaje}`);
      this.agregarErrorCampo('correo', mensaje);
    }

    if (formulario?.invalid && errores.length === 0) {
      errores.push('Hay informacion incompleta o con formato incorrecto. Revisa los campos marcados.');
    }

    if (this.discapacidad && this.campoVacio(this.tipo_de)) {
      const mensaje = 'Especifica el tipo de discapacidad.';
      errores.push(`Informacion Adicional: ${mensaje}`);
      this.agregarErrorCampo('tipo_discapacidad', mensaje);
    }

    if (!cvSeleccionado) {
      const mensaje = 'Debes adjuntar tu CV.';
      errores.push(`Curriculum Vitae: ${mensaje}`);
      this.agregarErrorCampo('cv', mensaje);
    }

    if (!cartaSeleccionada) {
      const mensaje = 'Debes adjuntar tu carta de recomendacion.';
      errores.push(`Curriculum Vitae: ${mensaje}`);
      this.agregarErrorCampo('carta', mensaje);
    }

    this.validarLimite('nombre', this.nombre, this.limiteCampoCorto, errores);
    this.validarLimite('apellido_paterno', this.apellidoPaterno, this.limiteCampoCorto, errores);
    this.validarLimite('apellido_materno', this.apellidoMaterno, this.limiteCampoCorto, errores);
    this.validarLimite('telefono', this.telefono, this.limiteCampoCorto, errores);
    this.validarLimite('correo', this.email, this.limiteCampoCorto, errores);
    this.validarLimite('curp', this.curp, this.limiteCampoCorto, errores);
    this.validarLimite('direccion', this.direccion, this.limiteCampoCorto, errores);
    this.validarLimite('fecha_nacimiento', this.fecha_nacimiento, this.limiteCampoCorto, errores);
    this.validarLimite('estado_civil', this.estado_civil, this.limiteCampoCorto, errores);
    this.validarLimite('puesto', this.puesto_aplicado, this.limiteCampoCorto, errores);
    this.validarLimite('departamento', this.area, this.limiteCampoCorto, errores);
    this.validarLimite('sueldo_percibido', this.sueldo_percibido, this.limiteCampoCorto, errores);
    this.validarLimite('nivel_estudios', this.nivel_educativo, this.limiteCampoCorto, errores);
    this.validarLimite('escuela', this.institucion, this.limiteCampoCorto, errores);
    this.validarLimite('carrera', this.titulo_obtenido, this.limiteCampoCorto, errores);
    this.validarLimite('cursos', this.cursosLimpios().join(', '), this.limiteCampoCorto, errores);
    this.validarLimite('habilidades_blandas', this.habilidades_blandas, this.limiteCampoCorto, errores);
    this.validarLimite('disponibilidad_horario', this.disponibilidad_horario, this.limiteCampoCorto, errores);
    this.validarLimite('tipo_discapacidad', this.tipo_de, this.limiteCampoCorto, errores);
    this.validarLimite('otras_caracteristicas', this.otras_caracteristicas, this.limiteCampoCorto, errores);

    return errores;
  }

  asignarVacanteNoAceptada(mensaje: string) {
    this.mensajeVacanteNoAceptada = mensaje;
    this.erroresFormulario = [];
    this.erroresPorCampo = {
      ...this.erroresPorCampo,
      vacante: [mensaje],
    };
  }

  agregarErrorCampo(campo: string, mensaje: string) {
    if (!campo) return;

    this.erroresPorCampo[campo] = [
      ...(this.erroresPorCampo[campo] || []),
      mensaje,
    ];
  }

  erroresDeCampo(campo: string) {
    if (this.formSubmitted && campo === 'correo') {
      const message = personalDataError('correo', this.email);
      if (message) return [message];
    }
    if (this.formSubmitted && ['telefono', 'curp', 'fecha_nacimiento'].includes(campo)) {
      const field = campo as 'telefono' | 'curp' | 'fecha_nacimiento';
      const message = personalDataError(field, this[field]);
      if (message) return [message];
    }
    return this.erroresPorCampo[campo] || [];
  }

  limpiarErrorDato(campo: string) {
    delete this.erroresPorCampo[campo];
  }

  tieneError(campo: string) {
    return this.erroresDeCampo(campo).length > 0;
  }

  caracteresRestantes(valor: string, limite: number) {
    return limite - String(valor || '').length;
  }

  mostrarLimite(valor: string, limite: number) {
    return String(valor || '').length >= limite - 20;
  }

  claseLimite(valor: string, limite: number) {
    return {
      'limit-exceeded': String(valor || '').length > limite,
    };
  }

  validarLimite(
    campo: string,
    valor: string,
    limite: number,
    errores: string[]
  ) {
    if (String(valor || '').length <= limite) return;

    const mensaje = `Maximo ${limite} caracteres.`;
    errores.push(mensaje);
    this.agregarErrorCampo(campo, mensaje);
  }

  normalizarCampoServidor(campo: string) {
    const campos: Record<string, string> = {
      email: 'correo',
      puesto_aplicado: 'puesto',
      area: 'departamento',
      nivel_educativo: 'nivel_estudios',
      institucion: 'escuela',
      titulo_obtenido: 'carrera',
      tipo_de: 'tipo_discapacidad',
    };

    return campos[campo] || campo;
  }

  desplazarAlPrimerError() {
    setTimeout(() => {
      document
        .querySelector('.field-error, .form-errors')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
    });
  }

  campoVacio(valor: any) {
    return String(valor ?? '').trim().length === 0;
  }

  correoValido(correo: string) {
    return !personalDataError('correo', correo);
  }

  obtenerDatosFormulario() {
    return {
      nombre: this.nombre,
      apellido: this.apellidosCompletos(),
      apellido_paterno: this.apellidoPaterno,
      apellido_materno: this.apellidoMaterno,
      email: this.email,
      telefono: this.telefono,
      curp: this.curp,
      direccion: this.direccion,
      fecha_nacimiento: this.fecha_nacimiento,
      estado_civil: this.estado_civil,
      credito_infonavit: this.credito_infonavit,
      nivel_educativo: this.nivel_educativo,
      institucion: this.institucion,
      titulo_obtenido: this.titulo_obtenido,
      puesto_aplicado: this.puesto_aplicado,
      area: this.area,
      sueldo_percibido: this.sueldo_percibido,
      tiempo_experiencia: this.tiempo_experiencia,
      trabaja_actualmente: this.trabaja_actualmente,
      sueldo_actual: this.sueldo_actual,
      habilidades_blandas: this.habilidades_blandas,
      disponibilidad_horario: this.disponibilidad_horario,
      licencia_conducir: this.licencia_conducir,
      vehiculo_propio: this.vehiculo_propio,
      discapacidad: this.discapacidad,
      tipo_de: this.tipo_de,
      otras_caracteristicas: this.otras_caracteristicas,
      cursos: this.cursos,
      idiomas: this.idiomas,
      software: this.software,
      habilidadesTecnicas: this.habilidadesTecnicas,
      experiencias: this.experiencias,
      vacanteId: this.route.snapshot.queryParamMap.get('vacanteId'),
    };
  }

  cursosLimpios() {
    return this.cursos
      .map((curso) => curso.trim())
      .filter((curso) => curso.length > 0);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  apellidosCompletos() {
    return `${this.apellidoPaterno} ${this.apellidoMaterno}`.trim();
  }

  separarApellidos(apellidos: string) {
    const partes = apellidos
      .trim()
      .split(/\s+/)
      .filter((parte) => parte.length > 0);

    return {
      paterno: partes[0] || '',
      materno: partes.slice(1).join(' '),
    };
  }

}
