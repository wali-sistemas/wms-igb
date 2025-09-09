import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { EmployeeService } from '../../../services/employee.service';
import { ReportService } from '../../../services/report.service';

type AdminTab = 'datosIngreso' | 'busqueda' | 'solicitudes';
type Vista = 'estadoCuenta' | 'perfil' | null;
type EstadoSolicitud = 'AFILIADO(A)' | 'RECHAZADO(A)';

@Component({
  templateUrl: './femprobien.component.html',
  styleUrls: ['./femprobien.component.css'],
  providers: [UserService, EmployeeService, ReportService]
})
export class EmployeeFemprobienComponent {
  // --- Estado general / UI ---
  public adminTab: AdminTab = 'datosIngreso';
  public vista: Vista = null;
  public isAdmin = false;
  public loading = false;
  // --- Mensajes de alerta ---
  public errorMessage = '';
  public successMessage = '';
  // --- Validación de asociado / estado de cuenta ---
  public documento: number | null = null;
  public fechaNacimiento = '';
  public datosEmpleado: any = null;
  public validado = false;
  // --- Búsqueda de asociados ---
  public filtroBusqueda = '';
  public empleados: any[] = [];
  public empleadosFiltrados: any[] = [];
  public mostrarFormularioAfiliado = false;
  public nuevoAfiliado: any = {};
  public buscadorInhabilitado = false;
  // --- Solicitudes de afiliación ---
  public solicitudesAfiliacion: any[] = [];
  public solicitudesAbiertas: boolean[] = [];
  public accionesEnProgreso: boolean[] = [];
  public tarjetaEnConfirmacion: number | null = null;
  public accionPendiente: EstadoSolicitud | null = null;
  // --- Auxiliares ---
  public identity: any;
  public today: string = new Date().toISOString().split('T')[0];
  public seccionesAbiertas: any = {
    datosPersonales: false,
    contactoEmpresa: false,
    infoFinanciera: false,
    beneficiarios: false
  };
  public mostrarModalAfiliado = false;
  public solicitudSeleccionada: any = null;
  public indexSeleccionado = -1;
  public isSubmitting = false;
  // --- Listas de selects ---
  public empresas: string[] = ['DSM', 'IGB', 'INVERSUR', 'MODULA', 'MOTOREPUESTOS', 'MOTOZONE', 'REDPLAS', 'WALI'];
  public estadosCiviles: string[] = ['SOLTERO(A)', 'CASADO(A)', 'VIUDO(A)', 'SEPARADO(A)', 'RELIGIOSO(A)', 'UNION LIBRE', 'OTRO'];
  public tiposCuenta: string[] = ['AHORROS', 'CORRIENTE'];
  public bancos: string[] = ['BANCO AGRARIO', 'BANCO AV VILLAS', 'BANCO CAJA SOCIAL', 'BANCO PICHINCHA', 'BANCO DAVIVIENDA', 'BANCO POPULAR', 'BBVA COLOMBIA', 'BANCO DE BOGOTA', 'BANCO DE OCCIDENTE', 'BANCOLOMBIA', 'BANCOOMEVA', 'BANCAMIA', 'DAVIPLATA', 'NEQUI'];
  public porcentajes: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  public parentescos: string[] = ['PADRE', 'MADRE', 'HIJO(A)', 'HERMANO(A)', 'CÓNYUGE', 'SOBRINO(A)', 'ABUELO(A)', 'NIETO(A)', 'OTRO'];

  constructor(
    private _employeeService: EmployeeService,
    private _userService: UserService,
    private _reportService: ReportService
  ) { }

  // ========== Ciclo de vida ==========
  ngOnInit() {
    this.identity = this._userService.getItentity();
    const adminUsers = ['jlondonoc', 'jguisao', 'lcano', 'pcolorado', 'sarboleda', 'duribe', 'dbetancur'];

    if (this.identity && this.identity.username) {
      this.isAdmin = adminUsers.indexOf(this.identity.username) !== -1;
      this.adminTab = this.isAdmin ? 'solicitudes' : 'datosIngreso';
    }

    this.loadSolicitudesAfiliacion();
    this.cargarEmpleadosAfiliados();
  }

  // ========== Utilidades UI ==========
  public clearError(): void {
    this.errorMessage = '';
  }

  public toggleSeccion(seccion: string): void {
    this.seccionesAbiertas[seccion] = !this.seccionesAbiertas[seccion];
  }

  public trackByIdx(i: number, _item: any) {
    return i;
  }

  // ========== Pestañas ==========
  public cambiarPestaña(tab: AdminTab) {
    this.adminTab = tab;

    // Al salir de "busqueda", limpiamos detalle
    if (tab !== 'busqueda') {
      this.mostrarFormularioAfiliado = false;
      this.nuevoAfiliado = null;
      this.buscadorInhabilitado = false;
    }
  }

  // ========== Validación de asociado y estado de cuenta ==========
  validarEmpleado() {
    if (!this.documento || !this.fechaNacimiento) {
      this.errorMessage = 'Debe ingresar el número de documento y la fecha de nacimiento.';
      return;
    }

    this.loading = true;
    this._employeeService.validateAssociatedExistence(this.documento.toString(), this.fechaNacimiento).subscribe(
      response => {
        this.loading = false;
        if (response && response.code === 0 && response.content && response.content.id !== null && response.content.codAso !== null && response.content.nomAso !== null && response.content.ap1Aso !== null) {
          this.datosEmpleado = response.content;
          this.validado = true;
          this.vista = 'estadoCuenta';
          this.errorMessage = '';
        } else {
          this.datosEmpleado = null;
          this.validado = false;
          this.vista = null;
          this.errorMessage = 'No se encontró un asociado con los datos ingresados.';
          this.documento = null;
          this.fechaNacimiento = '';
        }
      },
      error => {
        console.error('Error en la validación:', error);
        this.loading = false;
        this.datosEmpleado = null;
        this.validado = false;
        this.vista = null;
        this.errorMessage = 'Ocurrió un error al validar los datos. Intente nuevamente.';
        alert(this.errorMessage);
      }
    );
  }

  public generateAccountStatement() {
    if (!this.documento) {
      this.errorMessage = 'Documento inválido.';
      return;
    }

    const reportDTO = {
      id: this.documento.toString(),
      copias: 1,
      documento: 'accountStatement',
      companyName: 'FEMPROBN_NOVAWEB',
      origen: 'N',
      filtro: '',
      filtroSec: '',
      imprimir: false
    };

    this._reportService.generateReportManager(reportDTO).subscribe(
      response => {
        if (response.code === 0) {
          this.errorMessage = '';
          const publicUrl = 'https://wali.igbcolombia.com/api/shared/' +
            reportDTO.companyName + '/' +
            reportDTO.documento + '/' +
            reportDTO.id + '.pdf';
          window.open(publicUrl, '_blank');
          this.successMessage = 'Estado de cuenta generado correctamente.';
          this.cancelar();
          this.vista = null;
          this.adminTab = 'datosIngreso';
        } else {
          this.errorMessage = 'La generación del estado de cuenta no fue exitosa.';
        }
      },
      error => {
        console.error('Error al generar el reporte:', error);
        this.errorMessage = 'Error al generar el estado de cuenta.';
      }
    );
  }

  cancelar() {
    this.documento = null;
    this.fechaNacimiento = '';
    this.datosEmpleado = null;
    this.validado = false;
    this.mostrarFormularioAfiliado = false;
    this.nuevoAfiliado = {};
  }

  cambiarVista(vista: 'estadoCuenta' | 'perfil') {
    this.vista = vista;
  }

  // ========== Empleados afiliados (búsqueda) ==========
  private cargarEmpleadosAfiliados(): void {
    this._employeeService.loadAffiliatedEmployees().subscribe(
      response => {
        if (response && response.code === 0 && Array.isArray(response.content)) {
          this.empleados = response.content;
          this.empleadosFiltrados = [];
        } else {
          this.empleados = [];
          this.empleadosFiltrados = [];
          console.warn('No se encontraron empleados afiliados.');
        }
      },
      error => {
        console.error('Error cargando empleados afiliados:', error);
        this.empleados = [];
        this.empleadosFiltrados = [];
      }
    );
  }

  public buscarEmpleado() {
    this.mostrarFormularioAfiliado = false;
    this.nuevoAfiliado = null;

    if (!this.filtroBusqueda || this.filtroBusqueda.trim() === '') {
      this.empleadosFiltrados = [];
      return;
    }

    var q = this.filtroBusqueda.toLowerCase();
    this.empleadosFiltrados = this.empleados.filter(function (emp: any) {
      return (emp.nomAso ? String(emp.nomAso).toLowerCase().indexOf(q) !== -1 : false) ||
        (emp.ap1Aso ? String(emp.ap1Aso).toLowerCase().indexOf(q) !== -1 : false) ||
        (emp.ap2Aso ? String(emp.ap2Aso).toLowerCase().indexOf(q) !== -1 : false) ||
        (emp.codAso ? String(emp.codAso).indexOf(q) !== -1 : false);
    });
  }

  public editarEmpleado(emp: any) {
    this.nuevoAfiliado = emp;
    this.mostrarFormularioAfiliado = true;
    this.filtroBusqueda = (emp.nomAso || '') + ' ' + (emp.ap1Aso || '') + ' ' + (emp.ap2Aso || '');
    this.empleadosFiltrados = [];
    this.buscadorInhabilitado = true;

    // Limpiar búsqueda visualmente
    var self = this;
    setTimeout(function () {
      self.filtroBusqueda = '';
      self.empleadosFiltrados = [];
    });
  }

  public cerrarDetalle() {
    this.nuevoAfiliado = null;
    this.mostrarFormularioAfiliado = false;
    this.buscadorInhabilitado = false;
    this.filtroBusqueda = '';
  }

  public limpiarBusqueda(): void {
    this.filtroBusqueda = '';
    this.empleadosFiltrados = [];
    this.mostrarFormularioAfiliado = false;
    this.nuevoAfiliado = {};
  }

  // ========== Solicitudes de afiliación ==========
  loadSolicitudesAfiliacion(): void {
    this._employeeService.loadAssociatedRequests().subscribe(
      response => {
        if (response && response.code === 0 && Array.isArray(response.content)) {
          var solicitudes = response.content;

          if (!this.isAdmin && this.identity && this.identity.username) {
            solicitudes = solicitudes.filter((s: any) => s.creadoPor === this.identity.username);
          }

          this.solicitudesAfiliacion = solicitudes.map((s: any) => ({
            nomAfi: s.nomAso,
            ap1Afi: s.ap1Aso,
            ap2Afi: s.ap2Aso,
            codAfi: s.codAso,
            fecNac: s.fecNac,
            fecIng: s.fecIng,
            nomEmp: s.nomEmp,
            cargo: s.nomCar,
            salarioBasico: s.salBas,
            dirRes: s.dirRes,
            nomBar: s.nomBar,
            telCel: s.telCel,
            eMail: s.email,
            estCivil: s.estCivil,
            ctaTipo: s.ctaTipo,
            ctaBan: s.ctaBan,
            fdoBan: s.fdoBan,
            apMes: s.apMes,
            apPer1: s.apPer1,
            apPer2: s.apPer2,
            periodoAporte: (s.apPer1 && s.apPer2) ? 'AMBAS' : (s.apPer1 ? 'Q1' : (s.apPer2 ? 'Q2' : '')),
            codBen1: s.codBen1,
            nomBen1: s.nomBen1,
            parBen1: s.parBen1,
            codBen2: s.codBen2,
            nomBen2: s.nomBen2,
            parBen2: s.parBen2,
            fecha: s.fecAfi,
            status: s.status ? s.status : 'PENDIENTE'
          }));

          this.solicitudesAbiertas = this.solicitudesAfiliacion.map(() => false);
          this.accionesEnProgreso = this.solicitudesAfiliacion.map(() => false);
        } else {
          this.solicitudesAfiliacion = [];
          alert('No se pudieron cargar las solicitudes.');
        }
      },
      error => {
        console.error('Error cargando solicitudes:', error);
        alert('Ocurrió un error al cargar las solicitudes.');
      }
    );
  }

  public mostrarConfirmacionInline(index: number, accion: EstadoSolicitud) {
    this.tarjetaEnConfirmacion = index;
    this.accionPendiente = accion;
  }

  public cancelarConfirmacion() {
    this.tarjetaEnConfirmacion = null;
    this.accionPendiente = null;
  }

  // Llamada segura desde template (evita usar "!" non-null)
  public confirmarAccionSolicitud(index: number) {
    if (!this.accionPendiente) { return; }
    this.cambiarEstadoSolicitud(index, this.accionPendiente);
  }

  public cambiarEstadoSolicitud(index: number, status: EstadoSolicitud): void {
    const solicitud = this.solicitudesAfiliacion[index];
    this.accionesEnProgreso[index] = true;

    this._employeeService.updateStatusAssociatedReques(solicitud.codAfi, status).subscribe(
      response => {
        this.accionesEnProgreso[index] = false;
        if (response && response.code === 0) {
          this.solicitudesAfiliacion[index].status = status;
          this.tarjetaEnConfirmacion = null;
          this.accionPendiente = null;

          var self = this;
          setTimeout(function () {
            self.solicitudesAfiliacion.splice(index, 1);
            self.solicitudesAbiertas.splice(index, 1);
          }, 300);

          this.successMessage = 'Solicitud actualizada a ' + status + ' correctamente.';
        } else {
          alert('No se pudo actualizar el estado. Intenta nuevamente.');
        }
      },
      error => {
        console.error('Error al actualizar estado:', error);
        this.accionesEnProgreso[index] = false;
        alert('Ocurrió un error al actualizar el estado.');
      }
    );
  }

  public aprobarSolicitud(index: number): void {
    this.cambiarEstadoSolicitud(index, 'AFILIADO(A)');
  }

  public rechazarSolicitud(index: number): void {
    this.cambiarEstadoSolicitud(index, 'RECHAZADO(A)');
  }

  public verDetalleAfiliado(index: number): void {
    this.indexSeleccionado = index;
    this.solicitudSeleccionada = this.solicitudesAfiliacion[index];
    this.mostrarModalAfiliado = true;
  }

  cerrarModalAfiliado(): void {
    this.mostrarModalAfiliado = false;
    this.solicitudSeleccionada = null;
  }

  // ========== Nuevo asociado (formulario en pestaña "Ingreso") ==========
  guardarNuevoAfiliado() {
    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitting = true;

    const camposObligatorios = [
      { valor: this.nuevoAfiliado.codAfi, nombre: 'Documento' },
      { valor: this.nuevoAfiliado.nomAfi, nombre: 'Nombre' },
      { valor: this.nuevoAfiliado.nomEmp, nombre: 'Empresa' }
    ];

    const faltantes = camposObligatorios
      .filter(function (c: any) { return !c.valor || c.valor === ''; })
      .map(function (c: any) { return c.nombre; });

    if (faltantes.length > 0) {
      this.errorMessage = 'Ocurrió un error en la solicitud. Faltan por completar los siguientes campos: ' + faltantes.join(', ') + '.';
      this.isSubmitting = false;
      return;
    }

    const afiliadoTransformado = this.transformarAfiliado(this.nuevoAfiliado);

    this._employeeService.addAfiliadoFemprobien(afiliadoTransformado).subscribe(
      response => {
        if (response && response.content) {
          // Agregar a la lista local ANTES de limpiar
          this.solicitudesAfiliacion.push({ ...this.nuevoAfiliado });
          this.solicitudesAbiertas.push(false);

          // Cerrar y limpiar
          this.mostrarFormularioAfiliado = false;
          this.cancelar();

          // Mensaje de éxito
          this.successMessage = 'Solicitud enviada exitosamente. Femprobien revisará la información y se pondrá en contacto contigo.';
          this.isSubmitting = false;
        } else {
          this.errorMessage = 'Ocurrió un problema con la respuesta del servidor. Intenta nuevamente.';
          this.isSubmitting = false;
        }
      },
      error => {
        console.error('Error al guardar el afiliado:', error);
        this.errorMessage = 'Ocurrió un error al guardar el afiliado. Intenta nuevamente.';
        this.isSubmitting = false;
      }
    );
  }

  private transformarAfiliado(form: any): any {
    return {
      code: form.codAfi,
      name: form.nomAfi,
      apell1: form.ap1Afi,
      apell2: form.ap2Afi,
      birthdate: form.fecNac,
      dateIngr: form.fecIng,
      companyName: form.nomEmp,
      jobTitle: form.cargo,
      salary: form.salarioBasico,
      dateAfil: new Date().toISOString().split('T')[0],
      status: 'PENDIENTE',
      address: form.dirRes,
      locality: form.nomBar,
      phone: form.telCel,
      email: form.eMail,
      statusCivil: form.estCiv,
      typeAccount: form.ctaTipo,
      accountBanc: form.ctaBan,
      fdoBanc: form.fdoBan,
      apMonth: form.apMes,
      apPeriod1: form.periodoAporte === 'Q1' || form.periodoAporte === 'AMBAS',
      apPeriod2: form.periodoAporte === 'Q2' || form.periodoAporte === 'AMBAS',
      codeBenef1: form.codBen1,
      nameBenef1: form.nomBen1,
      parentBenef1: form.parBen1,
      codeBenef2: form.codBen2,
      nameBenef2: form.nomBen2,
      parentBenef2: form.parBen2
    };
  }

  limpiarFormularioAfiliado() {
    this.nuevoAfiliado = {};
  }

  toggleFormularioAfiliado() {
    this.mostrarFormularioAfiliado = !this.mostrarFormularioAfiliado;
  }

  hayDatosEnFormulario(): boolean {
    if (!this.nuevoAfiliado || typeof this.nuevoAfiliado !== 'object') {
      return false;
    }
    for (var key in this.nuevoAfiliado) {
      if (!this.nuevoAfiliado.hasOwnProperty(key)) { continue; }
      var valor = this.nuevoAfiliado[key];
      if (valor !== null && valor !== '' && valor !== undefined) {
        return true;
      }
    }
    return false;
  }
}
