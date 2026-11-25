import { Component, OnInit } from '@angular/core';
import { Http, Headers, RequestOptions, ResponseContentType } from '@angular/http';
import { UserService } from '../../../services/user.service';
import { EmployeeService } from '../../../services/employee.service';
import { GLOBAL } from '../../../services/global';

type AdminTab = 'simuladorCredito' | 'datosIngreso' | 'busqueda' | 'solicitudes' | 'solicitudesCredito' | 'historicoCreditos' | 'misSolicitudes' | 'importarDatos' | 'administrarRoles';
type Vista = 'estadoCuenta' | 'perfil' | null;
type EstadoSolicitud = 'AFILIADO(A)' | 'RECHAZADO(A)';

@Component({
  templateUrl: './femprobien.component.html',
  styleUrls: ['./femprobien.component.css'],
  providers: [UserService, EmployeeService]
})

export class EmployeeFemprobienComponent implements OnInit {
  public adminTab: AdminTab = 'datosIngreso';
  public vista: Vista = null;
  public isAdmin = false;
  public puedeAprobarSolicitudes = false;
  public puedeImportarDatos = false;
  public puedeAdministrarRoles = false;
  public mostrarBuscarAsociado = false;
  public loading = false;
  private _errorMessage = '';
  private _successMessage = '';
  public modalFemprobienVisible = false;
  public modalFemprobienTipo = 'info';
  public modalFemprobienTitulo = '';
  public modalFemprobienMensaje = '';
  public modalFemprobienDetalle = '';
  public modalFemprobienTextoAceptar = 'Aceptar';
  public modalFemprobienTextoCancelar = 'Cancelar';
  public modalFemprobienMostrarCancelar = false;
  public modalFemprobienClaseBotonAceptar = 'btn-primary';
  private modalFemprobienAccionAceptar: any = null;
  public documento: number | null = null;
  public fechaNacimiento = '';
  public datosEmpleado: any = null;
  public datosAportes: any = null;
  public loadingAportes = false;
  public modalSinAportesVisible = false;
  public asociadoSinAportes: any = null;
  public loadingEstadoCuenta = false;
  public validado = false;
  public filtroBusqueda = '';
  public empleados: any[] = [];
  public empleadosFiltrados: any[] = [];
  public mostrarFormularioAfiliado = false;
  public nuevoAfiliado: any = {};
  public datosActualizacionCargados = false;
  public cargandoDatosActualizacion = false;
  public buscadorInhabilitado = false;
  public solicitudesAfiliacion: any[] = [];
  public columnasSolicitudesAfiliacion: number[] = [0, 1];
  public accionesEnProgreso: boolean[] = [];
  public loadingSolicitudes = false;
  public filtroEstadoAfiliacion = 'PENDIENTE';
  public filtroTipoSolicitudAfiliacion = 'TODAS';
  public filtroBusquedaSolicitudesAfiliacion = '';
  public cantidadSolicitudesAfiliacionPendientes = 0;
  public solicitudesCreditoAdmin: any[] = [];
  public loadingSolicitudesCreditoAdmin = false;
  public filtroEstadoCreditoAdmin = 'PENDIENTE';
  public filtroBusquedaSolicitudesCreditoAdmin = '';
  public estadosCreditoAdmin: string[] = ['TODAS', 'PENDIENTE', 'EN_ESTUDIO', 'APROBADA', 'APLAZADA', 'NEGADA'];
  public cantidadSolicitudesCreditoPendientes = 0;
  public solicitudCreditoSeleccionadaAdmin: any = null;
  public estadoArchivosCreditoAdmin: any = null;
  public loadingDetalleCreditoAdmin = false;
  public actualizandoEstadoCreditoAdmin = false;
  public comentarioCreditoAdmin = '';
  public loadingFormalizacionCreditoAdmin = false;
  public formalizacionCreditoAdmin: any = null;
  public mostrarFormularioFormalizacionCreditoAdmin = false;
  public formalizandoCreditoAdmin = false;
  public formularioFormalizacionCreditoAdmin: any = this.crearFormularioFormalizacionCreditoAdmin();
  public creditoHistoricoSaldos: any = null;
  public saldosHistoricos: any[] = [];
  public cargandoHistoricoSaldos = false;
  public generandoEstadoCuentaCredito = false;
  public errorEstadoCuentaCredito = '';
  public errorHistoricoSaldos = '';
  private versionHistoricoSaldos = 0;
  public documentoHistoricoCredito = '';
  public historicoCreditos: any[] = [];
  public nombreHistoricoCredito = '';
  public loadingHistoricoCreditos = false;
  public consultaHistoricoRealizada = false;
  public documentoMisSolicitudes = '';
  public fechaNacimientoMisSolicitudes = '';
  public nombreMisSolicitudes = '';
  public solicitudesMisSolicitudes: any[] = [];
  public filtroTipoMisSolicitudes: string = 'TODAS';
  public loadingMisSolicitudes = false;
  public consultaMisSolicitudesRealizada = false;
  public tipoImportacion: 'aportes' | 'creditos' = 'aportes';
  public archivoImportacion: any = null;
  public nombreArchivoImportacion = '';
  public validandoImportacion = false;
  public resultadoValidacionImportacion: any = null;
  public procesandoImportacion = false;
  public resultadoProcesamientoImportacion: any = null;
  public periodoImportacionCreditos = '';
  public archivoImportacionCreditos: any = null;
  public nombreArchivoImportacionCreditos = '';
  public validandoImportacionCreditos = false;
  public procesandoImportacionCreditos = false;
  public resultadoValidacionImportacionCreditos: any = null;
  public resultadoProcesamientoImportacionCreditos: any = null;
  public identity: any;
  public today: string = new Date().toISOString().split('T')[0];
  public intentoEnviarAfiliacion: boolean = false;
  public intentoEnviarCredito: boolean = false;
  public seccionesAbiertas: any = { solicitud: true, datosPersonales: false, informacionLaboral: false, infoFinanciera: false, conyuge: false, patrimonio: false, beneficiarios: false };
  public seccionAfiliacionActiva: string = 'solicitud';
  public seccionesAfiliacionConfig: any[] = [
    { id: 'solicitud', numero: 1, titulo: 'Información de la solicitud', requerida: true },
    { id: 'datosPersonales', numero: 2, titulo: 'Datos personales', requerida: true },
    { id: 'informacionLaboral', numero: 3, titulo: 'Información laboral', requerida: true },
    { id: 'infoFinanciera', numero: 4, titulo: 'Información financiera', requerida: true },
    { id: 'conyuge', numero: 5, titulo: 'Datos del cónyuge', requerida: false },
    { id: 'patrimonio', numero: 6, titulo: 'Bienes y vehículo', requerida: false },
    { id: 'beneficiarios', numero: 7, titulo: 'Beneficiarios', requerida: true }
  ];
  private readonly camposObligatoriosAfiliacion: { campo: string, nombre: string, seccion: string, soloAfiliacion?: boolean }[] = [
    { campo: 'tipoSolicitud', nombre: 'Tipo de solicitud', seccion: 'solicitud' },
    { campo: 'tipoIngreso', nombre: 'Primera vez / Reingreso', seccion: 'solicitud', soloAfiliacion: true },
    { campo: 'fecAfi', nombre: 'Fecha de afiliación', seccion: 'solicitud', soloAfiliacion: true },
    { campo: 'periodoAporte', nombre: 'Forma de descuento', seccion: 'solicitud' },
    { campo: 'cantPorcen', nombre: 'Ahorro mensual', seccion: 'solicitud' },
    { campo: 'porcenAhorro', nombre: 'Porcentaje de ahorro', seccion: 'solicitud' },
    { campo: 'tipoDoc', nombre: 'Tipo de documento', seccion: 'datosPersonales' },
    { campo: 'codAfi', nombre: 'Número de documento', seccion: 'datosPersonales' },
    { campo: 'nomAfi', nombre: 'Nombres', seccion: 'datosPersonales' },
    { campo: 'estCiv', nombre: 'Estado civil', seccion: 'datosPersonales' },
    { campo: 'fecNac', nombre: 'Fecha de nacimiento', seccion: 'datosPersonales' },
    { campo: 'fecExp', nombre: 'Fecha de expedición', seccion: 'datosPersonales' },
    { campo: 'lugarExp', nombre: 'Lugar de expedición', seccion: 'datosPersonales' },
    { campo: 'eMail', nombre: 'Correo electrónico personal', seccion: 'datosPersonales' },
    { campo: 'dirRes', nombre: 'Dirección de residencia', seccion: 'datosPersonales' },
    { campo: 'nomBar', nombre: 'Ciudad de residencia', seccion: 'datosPersonales' },
    { campo: 'telCel', nombre: 'Celular', seccion: 'datosPersonales' },
    { campo: 'nivelEstudios', nombre: 'Nivel de estudios', seccion: 'datosPersonales' },
    { campo: 'nomEmp', nombre: 'Empresa', seccion: 'informacionLaboral' },
    { campo: 'fecIng', nombre: 'Fecha de ingreso a la empresa', seccion: 'informacionLaboral' },
    { campo: 'salBas', nombre: 'Salario básico', seccion: 'informacionLaboral' },
    { campo: 'cargo', nombre: 'Cargo', seccion: 'informacionLaboral' },
    { campo: 'profesion', nombre: 'Profesión', seccion: 'informacionLaboral' },
    { campo: 'ctaTipo', nombre: 'Tipo de cuenta', seccion: 'infoFinanciera' },
    { campo: 'fdoBan', nombre: 'Banco', seccion: 'infoFinanciera' },
    { campo: 'ctaBan', nombre: 'Número de cuenta', seccion: 'infoFinanciera' },
    { campo: 'ap1Afi', nombre: 'Primer apellido', seccion: 'datosPersonales', soloAfiliacion: true }
  ];
  public isSubmitting = false;
  public modoCredito = false;
  public mostrarFormularioCredito = false;
  public simuladorCredito: any = { monto: null, plazoMeses: null, frecuencia: 'MENSUAL' };
  public configuracionSimulador: any = null;
  public resultadoSimulador: any = null;
  public simulacionPendiente: any = null;
  public tasaSimuladorAdmin: any = null;
  public cargandoSimulador = false;
  public cargandoCondicionesCredito = false;
  public guardandoTasaSimulador = false;
  public errorSimulador = '';
  public mensajeTasaSimulador = '';
  private versionSolicitudSimulador = 0;
  public enviandoCredito = false;
  public formularioCredito: any = {};
  public firmaSolicitanteFile: any = null;
  public huellaSolicitanteFile: any = null;
  public firmaDeudor1File: any = null;
  public huellaDeudor1File: any = null;
  public firmaSolicitantePreview = '';
  public huellaSolicitantePreview = '';
  public firmaDeudor1Preview = '';
  public huellaDeudor1Preview = '';
  public subiendoArchivosCredito = false;
  public numeroSolicitudPendienteArchivos: number | null = null;
  public mostrarModalRecorteBiometrico = false;
  public tipoRecorteBiometrico = '';
  public tituloRecorteBiometrico = '';
  public mensajeRecorteBiometrico = '';
  public recorteBiometricoEsHuella = false;
  public tamanoRecorteBiometrico = 70;
  public procesandoRecorteBiometrico = false;
  private imagenRecorteObjeto: any = null;
  private canvasRecorteBiometrico: any = null;
  private contextoRecorteBiometrico: any = null;
  private imagenRecorteX = 0;
  private imagenRecorteY = 0;
  private imagenRecorteWidth = 0;
  private imagenRecorteHeight = 0;
  private recorteX = 0;
  private recorteY = 0;
  private recorteWidth = 0;
  private recorteHeight = 0;
  private arrastrandoRecorteBiometrico = false;
  private offsetRecorteX = 0;
  private offsetRecorteY = 0;
  private readonly MONTO_MINIMO_DEUDOR_SOLIDARIO: number = 10000000;
  private readonly tiposArchivoCredito: string[] = ['firmaSolicitante', 'huellaSolicitante', 'firmaDeudor1', 'huellaDeudor1'];
  public seccionesCreditoAbiertas: any = { solicitud: true, solicitante: false, financiera: false, referencias: false, patrimonio: false, conyuge: false, deudor1: false, autorizaciones: false, firmas: false, fondo: false };
  public seccionCreditoActiva: string = 'solicitud';
  public seccionesCreditoConfig: any[] = [
    { id: 'solicitud', numero: 1, titulo: 'Información de la solicitud' },
    { id: 'solicitante', numero: 2, titulo: 'Datos del asociado solicitante' },
    { id: 'financiera', numero: 3, titulo: 'Información financiera' },
    { id: 'referencias', numero: 4, titulo: 'Desembolso bancario y referencias' },
    { id: 'patrimonio', numero: 5, titulo: 'Bienes raíces y vehículo' },
    { id: 'conyuge', numero: 6, titulo: 'Datos del cónyuge' },
    { id: 'deudor1', numero: 7, titulo: 'Deudor solidario' },
    { id: 'autorizaciones', numero: 8, titulo: 'Autorizaciones' },
    { id: 'firmas', numero: 9, titulo: 'Firma y huella' },
    { id: 'fondo', numero: 10, titulo: 'Información del fondo' }
  ];
  private readonly camposObligatoriosCredito: { campo: string, nombre: string, seccion: string }[] = [
    { campo: 'montoSolicitado', nombre: 'Monto solicitado', seccion: 'solicitud' },
    { campo: 'montoSolicitadoLetras', nombre: 'Monto en letras', seccion: 'solicitud' },
    { campo: 'plazoMeses', nombre: 'Plazo', seccion: 'solicitud' },
    { campo: 'destinoCredito', nombre: 'Destino del crédito', seccion: 'solicitud' },
    { campo: 'formaDescuento', nombre: 'Forma de descuento', seccion: 'solicitud' },
    { campo: 'nombreCompletoSolicitante', nombre: 'Nombre completo', seccion: 'solicitante' },
    { campo: 'tipoDocumentoSolicitante', nombre: 'Tipo documento', seccion: 'solicitante' },
    { campo: 'numeroDocumentoSolicitante', nombre: 'Número documento', seccion: 'solicitante' },
    { campo: 'empresaGrupo', nombre: 'Empresa del grupo', seccion: 'solicitud' },
    { campo: 'profesionSolicitante', nombre: 'Profesión', seccion: 'solicitante' },
    { campo: 'cargoSolicitante', nombre: 'Cargo', seccion: 'solicitante' },
    { campo: 'telefonoOficinaSolicitante', nombre: 'Teléfono oficina', seccion: 'solicitante' },
    { campo: 'antiguedadSolicitante', nombre: 'Antigüedad', seccion: 'solicitante' },
    { campo: 'celularSolicitante', nombre: 'Celular', seccion: 'solicitante' },
    { campo: 'ciudadSolicitante', nombre: 'Ciudad', seccion: 'solicitante' },
    { campo: 'emailPersonalSolicitante', nombre: 'E-mail personal', seccion: 'solicitante' },
    { campo: 'fechaNacimientoSolicitante', nombre: 'Fecha nacimiento', seccion: 'solicitante' },
    { campo: 'estadoCivilSolicitante', nombre: 'Estado civil', seccion: 'solicitante' },
    { campo: 'direccionResidenciaSolicitante', nombre: 'Dirección residencia', seccion: 'solicitante' },
    { campo: 'estratoSolicitante', nombre: 'Estrato', seccion: 'solicitante' },
    { campo: 'telefonoResidenciaSolicitante', nombre: 'Teléfono residencia', seccion: 'solicitante' },
    { campo: 'tipoViviendaSolicitante', nombre: 'Vivienda', seccion: 'solicitante' },
    { campo: 'tiempoResidenciaSolicitante', nombre: 'Tiempo residencia', seccion: 'solicitante' },
    { campo: 'salarioSolicitante', nombre: 'Salario', seccion: 'financiera' },
    { campo: 'nombreReferenciaFamiliarSolicitante', nombre: 'Referencia familiar', seccion: 'referencias' },
    { campo: 'parentescoReferenciaFamiliarSolicitante', nombre: 'Parentesco referencia familiar', seccion: 'referencias' },
    { campo: 'direccionReferenciaFamiliarSolicitante', nombre: 'Dirección referencia familiar', seccion: 'referencias' },
    { campo: 'telefonoReferenciaFamiliarSolicitante', nombre: 'Teléfono referencia familiar', seccion: 'referencias' },
    { campo: 'nombreReferenciaPersonalSolicitante', nombre: 'Referencia personal', seccion: 'referencias' },
    { campo: 'parentescoReferenciaPersonalSolicitante', nombre: 'Relación referencia personal', seccion: 'referencias' },
    { campo: 'direccionReferenciaPersonalSolicitante', nombre: 'Dirección referencia personal', seccion: 'referencias' },
    { campo: 'telefonoReferenciaPersonalSolicitante', nombre: 'Teléfono referencia personal', seccion: 'referencias' }
  ];
  public tiposViviendaCredito: string[] = ['PROPIA', 'ARRIENDO', 'PADRES', 'OTRA'];
  public estratosCredito: number[] = [1, 2, 3, 4, 5, 6];
  public empresas: string[] = ['DSM', 'IGB', 'INVERSUR', 'MODULA', 'MOTOREPUESTOS', 'MOTOZONE', 'REDPLAS', 'WALI'];
  public estadosCiviles: string[] = ['SOLTERO(A)', 'CASADO(A)', 'VIUDO(A)', 'SEPARADO(A)', 'RELIGIOSO(A)', 'UNION LIBRE', 'OTRO'];
  public tiposCuenta: string[] = ['AHORROS', 'CORRIENTE'];
  public bancos: string[] = ['BANCO AGRARIO', 'BANCO AV VILLAS', 'BANCO CAJA SOCIAL', 'BANCO PICHINCHA', 'BANCO DAVIVIENDA', 'BANCO POPULAR', 'BBVA COLOMBIA', 'BANCO DE BOGOTA', 'BANCO DE OCCIDENTE', 'BANCOLOMBIA', 'BANCOOMEVA', 'BANCAMIA', 'DAVIPLATA', 'NEQUI'];
  public porcentajes: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  public parentescos: string[] = ['PADRE', 'MADRE', 'HIJO(A)', 'HERMANO(A)', 'CÓNYUGE', 'SOBRINO(A)', 'ABUELO(A)', 'NIETO(A)', 'OTRO'];
  public tiposDocumento: string[] = ['CC', 'CE', 'TI', 'PASAPORTE', 'OTRO'];
  public nivelesEstudio: string[] = ['PRIMARIA', 'BACHILLER', 'TÉCNICO', 'TECNÓLOGO', 'UNIVERSITARIO', 'POSGRADO', 'OTRO'];
  public vistaAdministracionRoles: string = 'usuarios';
  public loadingUsuariosRolesAdmin = false;
  public guardandoRolesUsuarioAdmin = false;
  public retirandoUsuarioRolesAdmin = false;
  public accionUsuarioRolesPendiente = '';
  public filtroUsuariosRolesAdmin = '';
  public usernameRolesManual = '';
  public usuariosRolesAdmin: any[] = [];
  public usuariosRolesFiltrados: any[] = [];
  public usuarioRolesSeleccionado: any = null;
  public rolesUsuarioAdmin: any = {};
  public permisosEfectivosUsuarioAdmin: string[] = [];
  public loadingRolesCatalogoAdmin = false;
  public guardandoPermisosRolAdmin = false;
  public rolesCatalogoAdmin: any[] = [];
  public rolSeleccionadoAdmin: any = null;
  public permisosRolAdmin: any[] = [];
  public permisosRolSeleccionadosAdmin: any = {};
  public loadingAuditoriaRolesAdmin = false;
  public auditoriaRolesAdmin: any[] = [];
  public auditoriaRolesFiltradaAdmin: any[] = [];
  public filtroAuditoriaRolesAdmin = '';
  private bridgeApiUrl: string = GLOBAL.urlBridge;

  constructor(private _employeeService: EmployeeService, private _http: Http, private _userService: UserService) { }

  ngOnInit() {
    this.identity = this._userService.getItentity();
    this.adminTab = 'datosIngreso';
    this.nuevoAfiliado = this.crearFormularioAfiliacion();
    this.formularioCredito = this.crearFormularioCredito();
    this.cargarPermisosFemprobien();
    this.cargarEmpleadosAfiliados();
  }

  public get errorMessage() {
    return this._errorMessage;
  }

  public set errorMessage(value: string) {
    const mensaje = value !== null && value !== undefined ? value.toString().trim() : '';
    this._errorMessage = mensaje;
    if (!mensaje) {
      return;
    }
    const tipo = this.resolverTipoAlertaErrorFemprobien(mensaje);
    const titulo = this.resolverTituloAlertaErrorFemprobien(tipo);
    this.mostrarMensajeFemprobien(tipo, titulo, mensaje);
  }

  public get successMessage() {
    return this._successMessage;
  }

  public set successMessage(value: string) {
    const mensaje = value !== null && value !== undefined ? value.toString().trim() : '';
    this._successMessage = mensaje;
    if (!mensaje) {
      return;
    }
    this.mostrarMensajeFemprobien('success', 'Proceso completado', mensaje);
  }

  private resolverTipoAlertaErrorFemprobien(mensaje: string) {
    const texto = (mensaje || '').toString().toLowerCase().trim();
    const mensajesValidacion: string[] = [
      'debes ',
      'debe ',
      'deberás ',
      'solo se ',
      'selecciona ',
      'seleccione ',
      'ingresa ',
      'ingrese ',
      'completa ',
      'complete ',
      'no tienes permisos',
      'no tiene permisos',
      'no se encontró',
      'no se encontraron',
      'no puede ser',
      'deben ser',
      'debe ser',
      'el monto solicitado',
      'el plazo',
      'cada archivo',
      'para créditos iguales',
      'la solicitud #'
    ];
    return mensajesValidacion.some(function (mensaje) {
      return texto.indexOf(mensaje) !== -1;
    }) ? 'warning' : 'error';
  }

  private resolverTituloAlertaErrorFemprobien(tipo: string) {
    if (tipo === 'warning') {
      return 'Revisa la información';
    }
    return 'No fue posible continuar';
  }

  public abrirModalFemprobien(tipo: string, titulo: string, mensaje: string, detalle: string, mostrarCancelar: boolean, textoAceptar: string, textoCancelar: string, claseBotonAceptar: string, accionAceptar: any) {
    this.modalFemprobienTipo = tipo || 'info';
    this.modalFemprobienTitulo = titulo || 'FEMPROBIEN';
    this.modalFemprobienMensaje = mensaje || '';
    this.modalFemprobienDetalle = detalle || '';
    this.modalFemprobienMostrarCancelar = mostrarCancelar === true;
    this.modalFemprobienTextoAceptar = textoAceptar || 'Aceptar';
    this.modalFemprobienTextoCancelar = textoCancelar || 'Cancelar';
    this.modalFemprobienClaseBotonAceptar = claseBotonAceptar || 'btn-primary';
    this.modalFemprobienAccionAceptar = accionAceptar || null;
    this.modalFemprobienVisible = true;
  }

  public confirmarFemprobien(titulo: string, mensaje: string, detalle: string, textoAceptar: string, accionAceptar: any, tipo?: string, claseBotonAceptar?: string) {
    this.abrirModalFemprobien(tipo || 'warning', titulo, mensaje, detalle, true, textoAceptar || 'Confirmar', 'Cancelar', claseBotonAceptar || 'btn-danger', accionAceptar);
  }

  public mostrarMensajeFemprobien(tipo: string, titulo: string, mensaje: string, detalle?: string) {
    const clases: any = { success: 'btn-success', warning: 'btn-warning', error: 'btn-danger' };
    this.abrirModalFemprobien(tipo || 'info', titulo, mensaje, detalle || '', false, 'Aceptar', '', clases[tipo] || 'btn-primary', null);
  }

  public aceptarModalFemprobien() {
    const accion = this.modalFemprobienAccionAceptar;
    this.cerrarModalFemprobien();
    if (accion) {
      accion();
    }
  }

  public cerrarModalFemprobien() {
    this.modalFemprobienVisible = false;
    this.modalFemprobienAccionAceptar = null;
  }

  public obtenerIconoModalFemprobien() {
    switch (this.modalFemprobienTipo) {
      case 'success': return 'fa-check';
      case 'warning': return 'fa-exclamation-triangle';
      case 'error': return 'fa-times';
      default: return 'fa-info';
    }
  }

  private cargarPermisosFemprobien() {
    this.isAdmin = false;
    this.puedeAprobarSolicitudes = false;
    this.puedeImportarDatos = false;
    this.puedeAdministrarRoles = false;
    if (!this.identity || !this.identity.username) {
      return;
    }
    const username = this.identity.username.toString().toLowerCase().trim();
    if (!username) {
      return;
    }
    const url = this.bridgeApiUrl + '/femprobien/roles/permisos?username=' + encodeURIComponent(username);

    this._http.get(url).subscribe(
      response => {
        let data: any = null;
        try {
          data = response.json();
        } catch (e) {
          return;
        }
        const roles: string[] = data && Array.isArray(data.roles) ? data.roles : [];
        const permisos: string[] = data && Array.isArray(data.permisos) ? data.permisos : [];
        this.isAdmin = roles.indexOf('ADMIN_FEMPROBIEN') !== -1;
        this.puedeAprobarSolicitudes = permisos.indexOf('APROBAR_SOLICITUDES') !== -1;
        this.puedeImportarDatos = permisos.indexOf('IMPORTAR_DATOS') !== -1;
        this.puedeAdministrarRoles = permisos.indexOf('ADMINISTRAR_ROLES') !== -1;

        if (this.puedeAprobarSolicitudes) {
          this.loadSolicitudesAfiliacion();
          this.cargarCantidadSolicitudesCreditoPendientes();
        }
      }, error => {
        this.isAdmin = false;
        this.puedeAprobarSolicitudes = false;
        this.puedeImportarDatos = false;
      });
  }

  public abrirAdministracionRoles() {
    if (!this.puedeAdministrarRoles) {
      this.errorMessage = 'No tienes permisos para administrar roles FEMPROBIEN.';
      return;
    }
    this.adminTab = 'administrarRoles';
    this.vistaAdministracionRoles = 'usuarios';
    this.clearError();
    this.cargarUsuariosRolesAdmin();
    this.cargarRolesCatalogoAdmin();
  }

  public cambiarVistaAdministracionRoles(vista: string) {
    this.vistaAdministracionRoles = vista;
    if (vista === 'usuarios') {
      if (this.usuariosRolesAdmin.length === 0) {
        this.cargarUsuariosRolesAdmin();
      }
    }
    else if (vista === 'roles') {
      if (this.rolesCatalogoAdmin.length === 0) {
        this.cargarRolesCatalogoAdmin();
      }
    }
    else if (vista === 'auditoria') {
      this.cargarAuditoriaRolesAdmin();
    }
  }

  private opcionesAdministracionRoles(contentTypeJson?: boolean): RequestOptions {
    const headers = new Headers();
    const username = this.identity && this.identity.username ? this.identity.username.toString().trim().toLowerCase() : '';
    headers.append('X-Femprobien-User', username);
    if (contentTypeJson !== false) {
      headers.append('Content-Type', 'application/json');
    }
    return new RequestOptions({
      headers: headers
    });
  }

  public cargarUsuariosRolesAdmin() {
    this.loadingUsuariosRolesAdmin = true;
    const url = this.bridgeApiUrl + '/femprobien/roles/admin/usuarios';

    this._http.get(url, this.opcionesAdministracionRoles(false)).subscribe(
      response => {
        this.loadingUsuariosRolesAdmin = false;
        const data = response.json();
        this.usuariosRolesAdmin = Array.isArray(data) ? data : [];
        this.filtrarUsuariosRolesAdmin();
      }, error => {
        this.loadingUsuariosRolesAdmin = false;
        this.manejarErrorAdministracionRoles(error, 'No fue posible consultar los usuarios con roles.');
      });
  }

  public filtrarUsuariosRolesAdmin() {
    const filtro = (this.filtroUsuariosRolesAdmin || '').toLowerCase().trim();
    if (!filtro) {
      this.usuariosRolesFiltrados = this.usuariosRolesAdmin.slice();
      return;
    }
    this.usuariosRolesFiltrados = this.usuariosRolesAdmin.filter(item => {
      const username = item && item.username ? item.username.toString().toLowerCase() : '';
      return username.indexOf(filtro) !== -1;
    });
  }

  public buscarUsuarioRolesAdmin() {
    const username = (this.usernameRolesManual || '').toLowerCase().trim();
    if (!username) {
      this.errorMessage = 'Ingresa el usuario que deseas administrar.';
      return;
    }
    this.seleccionarUsuarioRolesAdmin(username);
  }

  public seleccionarUsuarioRolesAdmin(username: string) {
    if (this.guardandoRolesUsuarioAdmin || this.retirandoUsuarioRolesAdmin || this.loadingUsuariosRolesAdmin) {
      return;
    }
    this.accionUsuarioRolesPendiente = '';
    const usuario = (username || '').toLowerCase().trim();
    if (!usuario) {
      return;
    }
    this.loadingUsuariosRolesAdmin = true;
    const url = this.bridgeApiUrl + '/femprobien/roles/admin/usuarios/' + encodeURIComponent(usuario);

    this._http.get(url, this.opcionesAdministracionRoles(false)).subscribe(
      response => {
        this.loadingUsuariosRolesAdmin = false;
        const data = response.json();
        this.usuarioRolesSeleccionado = data;
        this.usernameRolesManual = data && data.username ? data.username : usuario;
        this.rolesUsuarioAdmin = {};
        const roles = data && Array.isArray(data.roles) ? data.roles : [];
        roles.forEach((rol: any) => {
          this.rolesUsuarioAdmin[rol.codigo] = rol.asignado === true || rol.asignado === 1 || rol.asignado === '1';
        });
        this.permisosEfectivosUsuarioAdmin = data && Array.isArray(data.permisos) ? data.permisos : [];
      }, error => {
        this.loadingUsuariosRolesAdmin = false;
        this.manejarErrorAdministracionRoles(error, 'No fue posible consultar los roles del usuario.');
      });
  }

  public esUsuarioRolesActual() {
    const seleccionado = this.usuarioRolesSeleccionado;
    return !!(seleccionado && this.identity &&
      String(seleccionado.username || '').toLowerCase().trim() === String(this.identity.username || '').toLowerCase().trim());
  }

  public solicitarRetiroUsuarioRoles(accion: string) {
    if (!this.puedeAdministrarRoles || this.esUsuarioRolesActual() || !this.usuarioRolesSeleccionado || !this.usuarioRolesSeleccionado.configurado || this.guardandoRolesUsuarioAdmin || this.retirandoUsuarioRolesAdmin || (accion !== 'desactivar' && accion !== 'eliminar')) {
      return;
    }
    const username = this.usuarioRolesSeleccionado.username;
    this.confirmarFemprobien(accion === 'eliminar' ? 'Eliminar configuración' : 'Desactivar usuario',
      accion === 'eliminar' ? '¿Deseas eliminar la configuración de ' + username + '?' : '¿Deseas desactivar a ' + username + ' en FEMPROBIEN?',
      'La cuenta de WMS y el historial de auditoría se conservan.',
      accion === 'eliminar' ? 'Eliminar configuración' : 'Desactivar usuario', () => {
        if (!this.usuarioRolesSeleccionado || this.usuarioRolesSeleccionado.username !== username) { return; }
        this.accionUsuarioRolesPendiente = accion;
        this.confirmarRetiroUsuarioRoles();
      });
  }

  public confirmarRetiroUsuarioRoles() {
    const accion = this.accionUsuarioRolesPendiente;
    if (!this.puedeAdministrarRoles || this.esUsuarioRolesActual() || !this.usuarioRolesSeleccionado || this.retirandoUsuarioRolesAdmin || this.guardandoRolesUsuarioAdmin || (accion !== 'desactivar' && accion !== 'eliminar')) {
      return;
    }
    const username = this.usuarioRolesSeleccionado.username;
    const url = this.bridgeApiUrl + '/femprobien/roles/admin/usuarios/' + encodeURIComponent(username);
    this.retirandoUsuarioRolesAdmin = true;
    this.clearError();
    const peticion = accion === 'eliminar' ? this._http.delete(url, this.opcionesAdministracionRoles(false)) : this._http.put(url + '/desactivar', JSON.stringify({}), this.opcionesAdministracionRoles());

    peticion.subscribe(
      response => {
        this.retirandoUsuarioRolesAdmin = false;
        this.accionUsuarioRolesPendiente = '';
        if (accion === 'eliminar') {
          this.usuarioRolesSeleccionado = null;
          this.usernameRolesManual = '';
          this.rolesUsuarioAdmin = {};
          this.permisosEfectivosUsuarioAdmin = [];
        } else {
          this.usuarioRolesSeleccionado = response.json();
          this.rolesUsuarioAdmin = {};
          this.permisosEfectivosUsuarioAdmin = [];
        }
        this.successMessage = accion === 'eliminar' ? 'Se eliminó la configuración de roles FEMPROBIEN de ' + username + '.' : 'El usuario ' + username + ' quedó inactivo en FEMPROBIEN.';
        this.cargarUsuariosRolesAdmin();
      }, error => {
        this.retirandoUsuarioRolesAdmin = false;
        this.manejarErrorAdministracionRoles(error, 'No fue posible actualizar la configuración del usuario.');
      });
  }

  public cambiarRolUsuarioAdmin(codigoRol: string, checked: boolean) {
    this.rolesUsuarioAdmin[codigoRol] = checked === true;
  }

  public guardarRolesUsuarioAdmin(confirmado?: boolean) {
    if (!this.puedeAdministrarRoles || this.guardandoRolesUsuarioAdmin || this.retirandoUsuarioRolesAdmin) {
      return;
    }
    this.accionUsuarioRolesPendiente = '';
    if (!this.usuarioRolesSeleccionado || !this.usuarioRolesSeleccionado.username) {
      this.errorMessage = 'Selecciona un usuario antes de guardar los roles.';
      return;
    }
    const roles: string[] = [];
    const disponibles = Array.isArray(this.usuarioRolesSeleccionado.roles) ? this.usuarioRolesSeleccionado.roles : [];
    disponibles.forEach((rol: any) => {
      if (this.rolesUsuarioAdmin[rol.codigo] === true) {
        roles.push(rol.codigo);
      }
    });
    const username = this.usuarioRolesSeleccionado.username.toString().toLowerCase().trim();
    const url = this.bridgeApiUrl + '/femprobien/roles/admin/usuarios/' + encodeURIComponent(username) + '/roles';
    if (!confirmado) {
      this.confirmarFemprobien('Guardar roles del usuario', '¿Deseas guardar los roles de ' + username + '?', 'Sus permisos de FEMPROBIEN se actualizarán con esta configuración.', 'Guardar roles', () => this.guardarRolesUsuarioAdmin(true));
      return;
    }
    this.guardandoRolesUsuarioAdmin = true;
    this._http.put(url, JSON.stringify({ roles: roles }), this.opcionesAdministracionRoles()).subscribe(
      response => {
        this.guardandoRolesUsuarioAdmin = false;
        const data = response.json();
        this.usuarioRolesSeleccionado = data;
        this.rolesUsuarioAdmin = {};
        const rolesResponse = data && Array.isArray(data.roles) ? data.roles : [];
        rolesResponse.forEach((rol: any) => {
          this.rolesUsuarioAdmin[rol.codigo] = rol.asignado === true || rol.asignado === 1 || rol.asignado === '1';
        });
        this.permisosEfectivosUsuarioAdmin = data && Array.isArray(data.permisos) ? data.permisos : [];
        this.successMessage = 'Los roles del usuario ' + username + ' fueron actualizados correctamente.';
        this.cargarUsuariosRolesAdmin();
        if (this.identity && this.identity.username && this.identity.username.toString().toLowerCase().trim() === username) {
          this.cargarPermisosFemprobien();
        }
      }, error => {
        this.guardandoRolesUsuarioAdmin = false;
        this.manejarErrorAdministracionRoles(error, 'No fue posible guardar los roles del usuario.');
      });
  }

  public cargarRolesCatalogoAdmin() {
    this.loadingRolesCatalogoAdmin = true;
    const url = this.bridgeApiUrl + '/femprobien/roles/admin/roles';

    this._http.get(url, this.opcionesAdministracionRoles(false)).subscribe(
      response => {
        this.loadingRolesCatalogoAdmin = false;
        const data = response.json();
        this.rolesCatalogoAdmin = Array.isArray(data) ? data : [];
      }, error => {
        this.loadingRolesCatalogoAdmin = false;
        this.manejarErrorAdministracionRoles(error, 'No fue posible consultar el catálogo de roles.');
      });
  }

  public seleccionarRolAdmin(rol: any) {
    if (!rol || !rol.codigo) {
      return;
    }
    this.loadingRolesCatalogoAdmin = true;
    const url = this.bridgeApiUrl + '/femprobien/roles/admin/roles/' + encodeURIComponent(rol.codigo) + '/permisos';

    this._http.get(url, this.opcionesAdministracionRoles(false)).subscribe(
      response => {
        this.loadingRolesCatalogoAdmin = false;
        const data = response.json();
        this.rolSeleccionadoAdmin = data ? data.rol : null;
        this.permisosRolAdmin = data && Array.isArray(data.permisos) ? data.permisos : [];
        this.permisosRolSeleccionadosAdmin = {};
        this.permisosRolAdmin.forEach(permiso => {
          this.permisosRolSeleccionadosAdmin[permiso.codigo] = permiso.asignado === true || permiso.asignado === 1 || permiso.asignado === '1';
        });
      }, error => {
        this.loadingRolesCatalogoAdmin = false;
        this.manejarErrorAdministracionRoles(error, 'No fue posible consultar los permisos del rol.');
      });
  }

  public cambiarPermisoRolAdmin(codigoPermiso: string, checked: boolean) {
    if (this.rolSeleccionadoAdmin && this.rolSeleccionadoAdmin.codigo === 'ADMIN_FEMPROBIEN' && codigoPermiso === 'ADMINISTRAR_ROLES' && checked === false) {
      this.errorMessage = 'El rol Administrador FEMPROBIEN debe conservar el permiso ADMINISTRAR_ROLES.';
      this.permisosRolSeleccionadosAdmin[codigoPermiso] = true;
      return;
    }
    this.permisosRolSeleccionadosAdmin[codigoPermiso] = checked === true;
  }

  public guardarPermisosRolAdmin(confirmado?: boolean) {
    if (!this.puedeAdministrarRoles || this.guardandoPermisosRolAdmin) {
      return;
    }
    if (!this.rolSeleccionadoAdmin || !this.rolSeleccionadoAdmin.codigo) {
      this.errorMessage = 'Selecciona un rol antes de guardar sus permisos.';
      return;
    }
    const permisos: string[] = [];
    this.permisosRolAdmin.forEach(permiso => {
      if (this.permisosRolSeleccionadosAdmin[permiso.codigo] === true) {
        permisos.push(permiso.codigo);
      }
    });
    const codigoRol = this.rolSeleccionadoAdmin.codigo;
    const url = this.bridgeApiUrl + '/femprobien/roles/admin/roles/' + encodeURIComponent(codigoRol) + '/permisos';
    if (!confirmado) {
      this.confirmarFemprobien('Guardar permisos del rol', '¿Deseas actualizar los permisos de este rol?', 'El cambio afectará a los usuarios que tengan asignado el rol ' + codigoRol + '.', 'Guardar permisos', () => this.guardarPermisosRolAdmin(true));
      return;
    }
    this.guardandoPermisosRolAdmin = true;

    this._http.put(url, JSON.stringify({ permisos: permisos }), this.opcionesAdministracionRoles()).subscribe(
      response => {
        this.guardandoPermisosRolAdmin = false;
        const data = response.json();
        this.rolSeleccionadoAdmin = data ? data.rol : null;
        this.permisosRolAdmin = data && Array.isArray(data.permisos) ? data.permisos : [];
        this.permisosRolSeleccionadosAdmin = {};
        this.permisosRolAdmin.forEach(permiso => {
          this.permisosRolSeleccionadosAdmin[permiso.codigo] = permiso.asignado === true || permiso.asignado === 1 || permiso.asignado === '1';
        });
        this.successMessage = 'Los permisos del rol ' + codigoRol + ' fueron actualizados correctamente.';
        this.cargarRolesCatalogoAdmin();
        this.cargarPermisosFemprobien();
      }, error => {
        this.guardandoPermisosRolAdmin = false;
        this.manejarErrorAdministracionRoles(error, 'No fue posible guardar los permisos del rol.');
      });
  }

  public cargarAuditoriaRolesAdmin() {
    this.loadingAuditoriaRolesAdmin = true;
    const url = this.bridgeApiUrl + '/femprobien/roles/admin/auditoria?limite=100';

    this._http.get(url, this.opcionesAdministracionRoles(false)).subscribe(
      response => {
        this.loadingAuditoriaRolesAdmin = false;
        const data = response.json();
        this.auditoriaRolesAdmin = Array.isArray(data) ? data : [];
        this.filtrarAuditoriaRolesAdmin();
      }, error => {
        this.loadingAuditoriaRolesAdmin = false;
        this.manejarErrorAdministracionRoles(error, 'No fue posible consultar la auditoría de roles.');
      });
  }

  public filtrarAuditoriaRolesAdmin() {
    const filtro = (this.filtroAuditoriaRolesAdmin || '').toString().trim().toLowerCase();
    if (!filtro) {
      this.auditoriaRolesFiltradaAdmin = this.auditoriaRolesAdmin.slice();
      return;
    }
    this.auditoriaRolesFiltradaAdmin = this.auditoriaRolesAdmin.filter(item => {
      const fecha = item && item.fecha_registro ? item.fecha_registro.toString().toLowerCase() : '';
      const accion = item && item.accion ? item.accion.toString().toLowerCase() : '';
      const accionTexto = this.textoAccionAuditoria(item ? item.accion : '').toLowerCase();
      const usuario = item && item.username_afectado ? item.username_afectado.toString().toLowerCase() : '';
      const rol = item && item.rol_codigo ? item.rol_codigo.toString().toLowerCase() : '';
      const permiso = item && item.permiso_codigo ? item.permiso_codigo.toString().toLowerCase() : '';
      const realizadoPor = item && item.realizado_por ? item.realizado_por.toString().toLowerCase() : '';
      return (fecha.indexOf(filtro) !== -1 || accion.indexOf(filtro) !== -1 || accionTexto.indexOf(filtro) !== -1 || usuario.indexOf(filtro) !== -1 || rol.indexOf(filtro) !== -1 || permiso.indexOf(filtro) !== -1 || realizadoPor.indexOf(filtro) !== -1);
    });
  }

  public limpiarFiltroAuditoriaRolesAdmin() {
    this.filtroAuditoriaRolesAdmin = '';
    this.filtrarAuditoriaRolesAdmin();
  }

  public textoAccionAuditoria(accion: string) {
    const codigo = (accion || '').toString().trim().toUpperCase();
    const textos: { [codigo: string]: string } = {
      ASIGNAR_ROL_USUARIO: 'Rol asignado',
      QUITAR_ROL_USUARIO: 'Rol retirado',
      ASIGNAR_PERMISO_ROL: 'Permiso asignado',
      QUITAR_PERMISO_ROL: 'Permiso retirado'
    };
    return Object.prototype.hasOwnProperty.call(textos, codigo) ? textos[codigo] : accion || 'Movimiento';
  }

  public claseAccionAuditoria(accion: string) {
    const codigo = (accion || '').toString().trim().toUpperCase();
    if (codigo === 'ASIGNAR_ROL_USUARIO' || codigo === 'ASIGNAR_PERMISO_ROL') {
      return 'roles-admin-auditoria-accion-asignar';
    }
    if (codigo === 'QUITAR_ROL_USUARIO' || codigo === 'QUITAR_PERMISO_ROL') {
      return 'roles-admin-auditoria-accion-quitar';
    }
    return 'roles-admin-auditoria-accion-neutral';
  }

  private manejarErrorAdministracionRoles(error: any, mensajeDefault: string) {
    let mensaje = mensajeDefault;
    try {
      const data = error && error.json ? error.json() : null;
      if (data &&
        data.message) {
        mensaje = data.message;
      }
    }
    catch (e) { }
    this.errorMessage = mensaje;
  }

  private crearFormularioAfiliacion() {
    return {
      tipoSolicitud: 'AFILIACION', tipoIngreso: 'PRIMERA_VEZ', fecAfi: this.today, periodoAporte: '', cantPorcen: null, porcenAhorro: null,
      tipoDoc: 'CC', codAfi: null, nomAfi: '', ap1Afi: '', ap2Afi: '', estCiv: '', fecNac: '', fecExp: '', lugarExp: '', eMail: '',
      dirRes: '', nomBar: '', tel: '', telCel: '', otroTel: '', nivelEstudios: '', nomEmp: '', fecIng: '', salBas: null, promPres: null,
      promBoni: null, cargo: '', profesion: '', ctaTipo: '', fdoBan: '', ctaBan: '', manejaRecursosPublicos: 'NO',
      reconocimientoPublico: 'NO', nomConyuge: '', ocuConyuge: '', telConyuge: '', tipoDocConyuge: '', docConyuge: '', bienRaices: 'NO',
      bienesDir: '', vehiculo: 'NO', marcaVeh: '', modeloVeh: '', tipoDocBen1: '', codBen1: '', nomBen1: '', parBen1: '', tipoDocBen2: '',
      codBen2: '', nomBen2: '', parBen2: '', tipoDocBen3: '', codBen3: '', nomBen3: '', parBen3: ''
    };
  }

  public esActualizacionDatos() {
    return !!(this.nuevoAfiliado && this.nuevoAfiliado.tipoSolicitud === 'ACTUALIZACION_DATOS');
  }

  public puedeMostrarFormularioAfiliacionCompleto() {
    return !this.esActualizacionDatos() || this.datosActualizacionCargados;
  }

  public reiniciarDatosActualizacion() {
    const formulario = this.crearFormularioAfiliacion();
    formulario.tipoSolicitud = 'ACTUALIZACION_DATOS';
    this.nuevoAfiliado = formulario;
    this.datosActualizacionCargados = false;
    this.cargandoDatosActualizacion = false;
    this.intentoEnviarAfiliacion = false;
    this.reiniciarSeccionesAfiliacion();
    this.clearError();
    this.irASeccionAfiliacion('solicitud');
  }

  private fechaParaInput(fecha: any) {
    if (fecha === null || fecha === undefined) {
      return '';
    }
    const valor = fecha.toString().trim();
    if (!valor) {
      return '';
    }
    return valor.substring(0, 10);
  }

  private valorSiNo(valor: any) {
    if (valor === true || valor === 1) {
      return 'SI';
    }
    if (valor === null || valor === undefined) {
      return 'NO';
    }
    const textoValor = valor.toString().trim().toUpperCase();
    if (textoValor === 'SI' || textoValor === 'SÍ' || textoValor === 'Y' || textoValor === 'TRUE' || textoValor === '1') {
      return 'SI';
    }
    return 'NO';
  }

  public cargarDatosActualizacion() {
    this.clearError();
    if (!this.esActualizacionDatos()) {
      return;
    }
    if (!this.nuevoAfiliado.codAfi || !this.nuevoAfiliado.fecNac) {
      this.errorMessage = 'Para actualizar tus datos debes ingresar el número de documento y la fecha de nacimiento.';
      this.irASeccionAfiliacion('solicitud');
      return;
    }
    if (this.cargandoDatosActualizacion) {
      return;
    }
    this.cargandoDatosActualizacion = true;
    this.datosActualizacionCargados = false;
    const documento = this.nuevoAfiliado.codAfi.toString().trim();
    const fechaNacimiento = this.fechaParaInput(this.nuevoAfiliado.fecNac);
    const url = this.bridgeApiUrl + '/femprobien/asociados/validar-actualizacion';
    const body = { cod_asp: documento, fec_nac: fechaNacimiento };

    this._http.post(url, body).subscribe(
      response => {
        this.cargandoDatosActualizacion = false;
        let asociado: any = null;
        try {
          asociado = response.json();
        } catch (e) {
          this.errorMessage = 'No fue posible interpretar la información del asociado.';
          return;
        }
        if (!asociado) {
          this.errorMessage = 'No fue posible cargar la información del asociado.';
          return;
        }
        this.cargarAsociadoEnFormularioActualizacion(asociado);
        this.datosActualizacionCargados = true;
        this.successMessage = '';
        this.seccionesAbiertas.solicitud = true;
        this.seccionesAbiertas.datosPersonales = true;
        this.irASeccionAfiliacion('datosPersonales');
      }, error => {
        this.cargandoDatosActualizacion = false;
        this.datosActualizacionCargados = false;

        if (error && error.status === 404) {
          this.errorMessage = 'No se encontró un asociado con el documento y la fecha de nacimiento ingresados.';
          return;
        }
        this.errorMessage = 'No fue posible consultar los datos del asociado. Intente nuevamente.';
      });
  }

  private cargarAsociadoEnFormularioActualizacion(asociado: any) {
    if (!asociado) {
      return;
    }
    this.nuevoAfiliado.tipoSolicitud = 'ACTUALIZACION_DATOS';
    this.nuevoAfiliado.tipoIngreso = asociado.tipo_ingreso || 'PRIMERA_VEZ';
    this.nuevoAfiliado.fecAfi = this.fechaParaInput(asociado.fec_afi || asociado.fec_ing || this.today);
    this.nuevoAfiliado.periodoAporte = asociado.forma_desc || '';
    this.nuevoAfiliado.cantPorcen = asociado.cant_porcen;
    this.nuevoAfiliado.porcenAhorro = asociado.porcen_ahorro;
    this.nuevoAfiliado.tipoDoc = asociado.tipo_documento || 'CC';
    this.nuevoAfiliado.codAfi = asociado.cod_asp;
    this.nuevoAfiliado.nomAfi = asociado.nom_aso || '';
    this.nuevoAfiliado.ap1Afi = '';
    this.nuevoAfiliado.ap2Afi = '';
    this.nuevoAfiliado.estCiv = asociado.est_civil || '';
    this.nuevoAfiliado.fecNac = this.fechaParaInput(asociado.fec_nac);
    this.nuevoAfiliado.fecExp = this.fechaParaInput(asociado.fec_exp);
    this.nuevoAfiliado.lugarExp = asociado.lugar_exp || '';
    this.nuevoAfiliado.eMail = asociado.email_per || '';
    this.nuevoAfiliado.dirRes = asociado.dir_res || '';
    this.nuevoAfiliado.nomBar = asociado.nom_bar || '';
    this.nuevoAfiliado.tel = asociado.tel || '';
    this.nuevoAfiliado.telCel = asociado.cel || '';
    this.nuevoAfiliado.otroTel = asociado.otro_tel || '';
    this.nuevoAfiliado.nivelEstudios = asociado.nivel_estudios || '';
    this.nuevoAfiliado.nomEmp = asociado.nom_emp || '';
    this.nuevoAfiliado.fecIng = this.fechaParaInput(asociado.fec_ing);
    this.nuevoAfiliado.salBas = asociado.sal_bas;
    this.nuevoAfiliado.promPres = asociado.prom_pres;
    this.nuevoAfiliado.promBoni = asociado.prom_boni;
    this.nuevoAfiliado.cargo = asociado.cargo || '';
    this.nuevoAfiliado.profesion = asociado.profesion || '';
    this.nuevoAfiliado.ctaTipo = asociado.tipo_cuenta || '';
    this.nuevoAfiliado.fdoBan = asociado.banco || '';
    this.nuevoAfiliado.ctaBan = asociado.n_cuenta || '';
    this.nuevoAfiliado.manejaRecursosPublicos = this.valorSiNo(asociado.maneja_recursos_publicos);
    this.nuevoAfiliado.reconocimientoPublico = this.valorSiNo(asociado.reconocimiento_publico);
    this.nuevoAfiliado.nomConyuge = asociado.nom_conyuge || '';
    this.nuevoAfiliado.ocuConyuge = asociado.ocu_conyuge || '';
    this.nuevoAfiliado.telConyuge = asociado.tel_conyuge || '';
    this.nuevoAfiliado.tipoDocConyuge = asociado.tipo_doc_conyuge || asociado.tip_doc || '';
    this.nuevoAfiliado.docConyuge = asociado.doc_conyuge || '';
    this.nuevoAfiliado.bienRaices = this.valorSiNo(asociado.bien_raices);
    this.nuevoAfiliado.bienesDir = asociado.bienes_dir || asociado.bienes_dic || '';
    this.nuevoAfiliado.vehiculo = this.valorSiNo(asociado.vehiculo);
    this.nuevoAfiliado.marcaVeh = asociado.marca_veh || '';
    this.nuevoAfiliado.modeloVeh = asociado.modelo_veh || '';
    this.nuevoAfiliado.tipoDocBen1 = asociado.tipo_doc_ben1 || '';
    this.nuevoAfiliado.codBen1 = asociado.ben_doc1 || '';
    this.nuevoAfiliado.nomBen1 = asociado.ben_nom1 || '';
    this.nuevoAfiliado.parBen1 = asociado.parentesco1 || '';
    this.nuevoAfiliado.tipoDocBen2 = asociado.tipo_doc_ben2 || '';
    this.nuevoAfiliado.codBen2 = asociado.ben_doc2 || '';
    this.nuevoAfiliado.nomBen2 = asociado.ben_nom2 || '';
    this.nuevoAfiliado.parBen2 = asociado.parentesco2 || '';
    this.nuevoAfiliado.tipoDocBen3 = asociado.tipo_doc_ben3 || '';
    this.nuevoAfiliado.codBen3 = asociado.ben_doc3 || '';
    this.nuevoAfiliado.nomBen3 = asociado.ben_nom3 || '';
    this.nuevoAfiliado.parBen3 = asociado.parentesco3 || '';
  }

  private crearDatosDeudorCredito(tipoDocumento: string) {
    const valores: any = {
      nombreCompleto: '', tipoDocumento: tipoDocumento, numeroDocumento: '', empresa: '', profesion: '', cargo: '', antiguedad: '',
      direccionOficina: '', telefono: '', salario: 0, otrosIngresos: 0, egresos: 0, activos: 0, pasivos: 0, patrimonio: 0,
      fechaNacimiento: '', estadoCivil: '', numeroHijos: 0, direccionResidencia: '', estrato: null, telefonoResidencia: '', tipoVivienda: '',
      otraVivienda: '', tiempoResidencia: '', valorArriendo: 0, nombreReferenciaFamiliar: '', parentescoReferenciaFamiliar: '',
      direccionReferenciaFamiliar: '', telefonoReferenciaFamiliar: '', nombreReferenciaPersonal: '', parentescoReferenciaPersonal: '',
      direccionReferenciaPersonal: '', telefonoReferenciaPersonal: '', tieneBienRaiz: false, tipoBien: '', direccionBien: '',
      matriculaInmobiliaria: '', ciudadBien: '', valorComercialBien: 0, valorHipoteca: 0, hipotecaAFavorDe: '', patrimonioFamilia: false,
      tieneVehiculo: false, modeloVehiculo: '', placaVehiculo: '', marcaVehiculo: '', valorComercialVehiculo: 0, vehiculoPignorado: false,
      tipoServicioVehiculo: ''
    };
    const datos: any = {};
    Object.keys(valores).forEach(campo => datos[campo + 'Deudor1'] = valores[campo]);
    return datos;
  }

  private crearFormularioCredito() {
    return Object.assign({
      fechaSolicitud: this.today, empresaGrupo: '', montoSolicitado: null, montoSolicitadoLetras: '', plazoMeses: null,
      abonosExtraordinarios: false, detalleAbonosExtraordinarios: '', destinoCredito: '', formaDescuento: '', nombreCompletoSolicitante: '',
      tipoDocumentoSolicitante: 'CC', numeroDocumentoSolicitante: '', profesionSolicitante: '', cargoSolicitante: '',
      telefonoOficinaSolicitante: '', antiguedadSolicitante: '', celularSolicitante: '', ciudadSolicitante: '', emailPersonalSolicitante: '',
      fechaNacimientoSolicitante: '', estadoCivilSolicitante: '', numeroHijosSolicitante: 0, direccionResidenciaSolicitante: '',
      estratoSolicitante: null, telefonoResidenciaSolicitante: '', tipoViviendaSolicitante: '', otraViviendaSolicitante: '',
      tiempoResidenciaSolicitante: '', valorArriendoSolicitante: 0, salarioSolicitante: null, otrosIngresosSolicitante: 0,
      descripcionOtrosIngresosSolicitante: '', egresosSolicitante: 0, activosSolicitante: 0, pasivosSolicitante: 0, patrimonioSolicitante: 0,
      autorizaDesembolsoBancario: false, tipoCuentaBancaria: '', bancoSolicitante: '', numeroCuentaSolicitante: '',
      nombreReferenciaFamiliarSolicitante: '', parentescoReferenciaFamiliarSolicitante: '', direccionReferenciaFamiliarSolicitante: '',
      telefonoReferenciaFamiliarSolicitante: '', nombreReferenciaPersonalSolicitante: '', parentescoReferenciaPersonalSolicitante: '',
      direccionReferenciaPersonalSolicitante: '', telefonoReferenciaPersonalSolicitante: '', tieneBienRaizSolicitante: false,
      tipoBienSolicitante: '', direccionBienSolicitante: '', matriculaInmobiliariaSolicitante: '', ciudadBienSolicitante: '',
      valorComercialBienSolicitante: 0, valorHipotecaSolicitante: 0, hipotecaAFavorDeSolicitante: '', patrimonioFamiliaSolicitante: false,
      tieneVehiculoSolicitante: false, modeloVehiculoSolicitante: '', placaVehiculoSolicitante: '', marcaVehiculoSolicitante: '',
      valorComercialVehiculoSolicitante: 0, vehiculoPignoradoSolicitante: false, tipoServicioVehiculoSolicitante: '', aplicaConyuge: false,
      nombreCompletoConyuge: '', tipoDocumentoConyuge: 'CC', numeroDocumentoConyuge: '', fechaNacimientoConyuge: '', actividadConyuge: '',
      empresaConyuge: '', telefonoConyuge: '', antiguedadConyuge: '', ingresosConyuge: 0, requiereDeudor1: false,
    }, this.crearDatosDeudorCredito('CC'), {
      autorizacionCentralRiesgo: false, autorizacionTratamientoDatos: false, autorizacionDescuentoNomina: false,
      certificacionDestinoFondos: false, valorCreditoAutorizacion: null, cantidadCuotas: null, valorCuota: null,
      empresaAutorizadaDescuento: '', tipoCuentaDescuento: '', numeroCuentaDescuento: '', bancoDescuento: '', aceptaFirmaHuella: false
    });
  }

  public clearError() {
    this._errorMessage = '';
    this._successMessage = '';
    if (this.modalFemprobienVisible &&
      !this.modalFemprobienMostrarCancelar) {
      this.cerrarModalFemprobien();
    }
  }

  private estaVacio(valor: any) {
    return valor === null || valor === undefined || String(valor).trim() === '';
  }

  private obtenerArchivoExcel(event: any) {
    if (!event || !event.target || !event.target.files || event.target.files.length <= 0) {
      return null;
    }
    const archivo = event.target.files[0];
    const nombre = archivo && archivo.name ? archivo.name.toString() : '';
    const extension = nombre.toLowerCase().split('.').pop();
    if (extension !== 'xlsx' && extension !== 'xls') {
      event.target.value = '';
      this.errorMessage = 'Solo se permiten archivos de Excel con extensión .xlsx o .xls.';
      return null;
    }
    return { archivo: archivo, nombre: nombre };
  }

  private crearFormDataImportacion(archivo: any) {
    const formData = new FormData();
    formData.append('archivo', archivo, archivo.name);
    formData.append('usuario', this.identity && this.identity.username ? this.identity.username : '');
    return formData;
  }

  private limpiarInputArchivo(id: string) {
    const input: any = document.getElementById(id);
    if (input) {
      input.value = '';
    }
  }

  private irASeccion(prefijo: string, seccion: string) {
    setTimeout(function () {
      const elemento = document.getElementById(prefijo + seccion);
      if (elemento) {
        elemento.scrollIntoView();
        window.scrollBy(0, -110);
      }
    }, 0);
  }

  private contarSeccionesCompletas(secciones: string[], credito: boolean) {
    return secciones.filter(seccion =>
      (credito ? this.estadoSeccionCredito(seccion) : this.estadoSeccionAfiliacion(seccion)) === 'completa').length;
  }

  private calcularPatrimonio(activos: any, pasivos: any) {
    return this.numeroCredito(activos) - this.numeroCredito(pasivos);
  }

  public abrirImportacionDatos() {
    if (!this.puedeImportarDatos) {
      this.errorMessage = 'No tienes permisos para importar información de FEMPROBIEN.';
      return;
    }
    this.adminTab = 'importarDatos';
    this.tipoImportacion = 'aportes';
    this.clearError();
  }

  public seleccionarArchivoImportacion(event: any, credito: boolean = false) {
    const sufijo = credito ? 'Creditos' : '';
    this.clearError();
    (this as any)['resultadoValidacionImportacion' + sufijo] = null;
    (this as any)['resultadoProcesamientoImportacion' + sufijo] = null;
    (this as any)['procesandoImportacion' + sufijo] = false;
    const seleccion = this.obtenerArchivoExcel(event);
    (this as any)['archivoImportacion' + sufijo] = seleccion ? seleccion.archivo : null;
    (this as any)['nombreArchivoImportacion' + sufijo] = seleccion ? seleccion.nombre : '';
  }

  public validarArchivoImportacion() {
    this.validarImportacionExcel(false);
  }

  private validarImportacionExcel(credito: boolean) {
    const sufijo = credito ? 'Creditos' : '';
    const validando = 'validandoImportacion' + sufijo;
    const resultado = 'resultadoValidacionImportacion' + sufijo;
    const instancia: any = this;
    const archivo = instancia['archivoImportacion' + sufijo];
    if (!this.puedeImportarDatos) {
      this.errorMessage = credito ? 'No tienes permisos para importar la cartera de créditos.' : 'No tienes permisos para importar información de FEMPROBIEN.';
      return;
    }
    if (!archivo) {
      this.errorMessage = credito ? 'Debes seleccionar el archivo de cartera de créditos.' : 'Debes seleccionar un archivo de Excel.';
      return;
    }
    if (instancia[validando] || (credito && this.procesandoImportacionCreditos)) {
      return;
    }
    this.clearError();
    instancia[validando] = true;
    instancia[resultado] = null;
    instancia['resultadoProcesamientoImportacion' + sufijo] = null;
    if (!credito) { this.procesandoImportacion = false; }
    const formData = this.crearFormDataImportacion(archivo);
    if (credito) { formData.append('periodo', this.periodoImportacionCreditos); }
    const url = this.bridgeApiUrl + '/femprobien/importacion/' + (credito ? 'creditos/' : '') + 'validar';
    this._http.post(url, formData).subscribe(
      response => {
        instancia[validando] = false;
        try {
          const data = response.json();
          if (data && data.status === 200) {
            if (credito && data.periodoCorte !== this.periodoImportacionCreditos) {
              instancia[resultado] = null;
              this.errorMessage = 'El corte devuelto no coincide con el seleccionado. Actualiza BridgeApi y vuelve a validar.'; return;
            }
            instancia[resultado] = data;
            this.successMessage = credito ? 'Archivo de créditos validado correctamente. El corte seleccionado es ' + (data.etiquetaPeriodo || '') + '. La base de datos todavía NO ha sido modificada.' : 'Archivo validado correctamente. La base de datos todavía NO ha sido modificada.';
          } else {
            instancia[resultado] = null;
            this.errorMessage = data && data.message ? data.message : 'No fue posible validar el archivo' + (credito ? ' de créditos' : '') + '.';
          }
        } catch (e) {
          instancia[resultado] = null;
          this.errorMessage = 'No fue posible interpretar la respuesta del servidor.';
        }
      }, error => {
        instancia[validando] = false;
        instancia[resultado] = null;
        this.errorMessage = this.obtenerMensajeErrorCredito(error, 'Ocurrió un error al validar el archivo' + (credito ? ' de créditos' : '') + '.');
      });
  }

  private ejecutarProcesamientoImportacionExcel(credito: boolean) {
    const sufijo = credito ? 'Creditos' : '';
    const procesando = 'procesandoImportacion' + sufijo;
    const resultado = 'resultadoProcesamientoImportacion' + sufijo;
    const instancia: any = this;
    this.clearError();
    instancia[procesando] = true;
    instancia[resultado] = null;
    const formData = this.crearFormDataImportacion(instancia['archivoImportacion' + sufijo]);
    if (credito) { formData.append('periodo', this.periodoImportacionCreditos); }
    const url = this.bridgeApiUrl + '/femprobien/importacion/' + (credito ? 'creditos/' : '') + 'procesar';
    this._http.post(url, formData).subscribe(
      response => {
        instancia[procesando] = false;
        try {
          const data = response.json();
          if (data && data.status === 200) {
            instancia[resultado] = data;
            this.successMessage = data.message || (credito ? 'La cartera de créditos fue actualizada correctamente.' : 'El archivo fue procesado correctamente.');
          } else {
            instancia[resultado] = null;
            this.errorMessage = data && data.message ? data.message : 'No fue posible procesar ' + (credito ? 'la cartera de créditos.' : 'el archivo.');
          }
        } catch (e) {
          instancia[resultado] = null;
          this.errorMessage = 'No fue posible interpretar la respuesta del servidor.';
        }
      }, error => {
        instancia[procesando] = false;
        instancia[resultado] = null;
        this.errorMessage = this.obtenerMensajeErrorCredito(error, 'Ocurrió un error al procesar ' + (credito ? 'la cartera de créditos.' : 'el archivo.'));
      });
  }

  public procesarArchivoImportacion(confirmado?: boolean) {
    if (!this.puedeImportarDatos) {
      this.errorMessage = 'No tienes permisos para importar información de FEMPROBIEN.';
      return;
    }
    if (!this.archivoImportacion) {
      this.errorMessage = 'Debes seleccionar un archivo de Excel.';
      return;
    }
    if (!this.resultadoValidacionImportacion) {
      this.errorMessage = 'Primero debes validar el archivo.';
      return;
    }
    if (Number(this.resultadoValidacionImportacion.errores || 0) > 0) {
      this.errorMessage = 'El archivo contiene errores. Corrígelos antes de procesarlo.';
      return;
    }
    if (this.procesandoImportacion || this.validandoImportacion) {
      return;
    }
    if (!confirmado) {
      const totalFilas = Number(this.resultadoValidacionImportacion.totalFilas || 0);
      const detalle = totalFilas > 0 ? totalFilas + ' registros serán procesados según el resultado de la validación.' : 'Los registros validados serán procesados.';
      this.confirmarFemprobien('Confirmar procesamiento', 'Estás a punto de modificar la base de datos de FEMPROBIEN.', detalle +
        ' Esta operación realizará INSERT y UPDATE según corresponda.', 'Procesar y actualizar', () => this.procesarArchivoImportacion(true), 'warning', 'btn-danger');
      return;
    }
    this.ejecutarProcesamientoImportacionExcel(false);
  }

  private limpiarImportacionExcel(credito: boolean) {
    const sufijo = credito ? 'Creditos' : '';
    (this as any)['archivoImportacion' + sufijo] = null;
    (this as any)['nombreArchivoImportacion' + sufijo] = '';
    (this as any)['resultadoValidacionImportacion' + sufijo] = null;
    (this as any)['resultadoProcesamientoImportacion' + sufijo] = null;
    (this as any)['validandoImportacion' + sufijo] = false;
    (this as any)['procesandoImportacion' + sufijo] = false;
    this.clearError();
    this.limpiarInputArchivo('archivoImportacion' + sufijo + 'Femprobien');
  }

  public limpiarImportacionDatos() {
    this.limpiarImportacionExcel(false);
  }

  public seleccionarImportacionAportes() {
    this.tipoImportacion = 'aportes';
    this.clearError();
  }

  public abrirImportacionCreditos() {
    if (!this.puedeImportarDatos) {
      this.errorMessage = 'No tienes permisos para importar la cartera de créditos.';
      return;
    }
    this.adminTab = 'importarDatos';
    this.tipoImportacion = 'creditos';
    this.clearError();
  }

  public seleccionarArchivoImportacionCreditos(event: any) {
    this.seleccionarArchivoImportacion(event, true);
  }

  public cambiarPeriodoImportacionCreditos() {
    this.resultadoValidacionImportacionCreditos = null;
    this.resultadoProcesamientoImportacionCreditos = null;
    this.clearError();
  }

  public validarArchivoImportacionCreditos() {
    if (!this.periodoImportacionCreditos) { this.errorMessage = 'Selecciona el mes de corte del archivo.'; return; }
    this.validarImportacionExcel(true);
  }

  public procesarArchivoImportacionCreditos(confirmado?: boolean) {
    if (!this.puedeImportarDatos) {
      this.errorMessage = 'No tienes permisos para importar la cartera de créditos.';
      return;
    }
    if (!this.archivoImportacionCreditos) {
      this.errorMessage = 'Debes seleccionar el archivo de cartera de créditos.';
      return;
    }
    if (!this.resultadoValidacionImportacionCreditos) {
      this.errorMessage = 'Primero debes validar el archivo de créditos.';
      return;
    }
    if (this.resultadoValidacionImportacionCreditos.periodoCorte !== this.periodoImportacionCreditos) {
      this.errorMessage = 'El corte cambió. Debes volver a validar el archivo.'; return;
    }
    if (Number(this.resultadoValidacionImportacionCreditos.errores || 0) > 0) {
      this.errorMessage = 'El archivo contiene errores. Corrígelos antes de procesarlo.';
      return;
    }
    if (this.procesandoImportacionCreditos || this.validandoImportacionCreditos) {
      return;
    }
    const periodo = this.resultadoValidacionImportacionCreditos.etiquetaPeriodo || this.resultadoValidacionImportacionCreditos.periodoCorte || '';
    if (!confirmado) {
      const totalCreditos = Number(this.resultadoValidacionImportacionCreditos.creditosEnCorte || 0);
      let detalle = totalCreditos > 0 ? totalCreditos + ' créditos del corte serán procesados.' : 'La cartera validada será procesada.';
      if (periodo) {
        detalle = 'Corte: ' + periodo + '. ' + detalle;
      }
      this.confirmarFemprobien('Confirmar actualización de cartera', 'Estás a punto de modificar la cartera de créditos de FEMPROBIEN.', detalle + ' La operación realizará INSERT y UPDATE en tblAporteCredito sin modificar la estructura de la tabla.', 'Procesar y actualizar', () => this.procesarArchivoImportacionCreditos(true), 'warning', 'btn-danger');
      return;
    }
    this.ejecutarProcesamientoImportacionExcel(true);
  }

  public limpiarImportacionCreditos() {
    this.periodoImportacionCreditos = '';
    this.limpiarImportacionExcel(true);
  }

  public abrirSolicitudes() {
    if (!this.puedeAprobarSolicitudes) {
      this.errorMessage = 'No tienes permisos para administrar solicitudes de afiliación.';
      return;
    }
    this.adminTab = 'solicitudes';
    this.clearError();
    this.loadSolicitudesAfiliacion();
  }

  public abrirSolicitudesCredito() {
    if (!this.puedeAprobarSolicitudes) {
      this.errorMessage = 'No tienes permisos para administrar solicitudes de crédito.';
      return;
    }
    this.adminTab = 'solicitudesCredito';
    this.clearError();
    this.solicitudCreditoSeleccionadaAdmin = null;
    this.estadoArchivosCreditoAdmin = null;
    this.comentarioCreditoAdmin = '';
    this.loadSolicitudesCreditoAdmin();
  }

  public cargarCantidadSolicitudesCreditoPendientes() {
    if (!this.puedeAprobarSolicitudes) {
      this.cantidadSolicitudesCreditoPendientes = 0;
      return;
    }
    this._employeeService.consultarSolicitudesCredito('PENDIENTE').subscribe(
      response => {
        try {
          const data = response.json();
          this.cantidadSolicitudesCreditoPendientes = Array.isArray(data) ? data.length : 0;
        } catch (e) {
          this.cantidadSolicitudesCreditoPendientes = 0;
        }
      }, error => {
        this.cantidadSolicitudesCreditoPendientes = 0;
      });
  }

  public loadSolicitudesCreditoAdmin() {
    if (!this.puedeAprobarSolicitudes) {
      this.solicitudesCreditoAdmin = [];
      this.loadingSolicitudesCreditoAdmin = false;
      return;
    }
    this.loadingSolicitudesCreditoAdmin = true;
    this.errorMessage = '';
    this._employeeService.consultarSolicitudesCredito().subscribe(
      response => {
        this.loadingSolicitudesCreditoAdmin = false;
        try {
          const data = response.json();
          this.solicitudesCreditoAdmin = Array.isArray(data) ? data : [];
          this.cantidadSolicitudesCreditoPendientes = this.solicitudesCreditoAdmin.filter((solicitud: any) => solicitud.estado_credito === 'PENDIENTE').length;
        } catch (e) {
          this.solicitudesCreditoAdmin = [];
          this.errorMessage = 'La respuesta del servidor para solicitudes de crédito no tiene el formato esperado.';
        }
      }, error => {
        this.loadingSolicitudesCreditoAdmin = false;
        this.solicitudesCreditoAdmin = [];
        this.errorMessage = this.obtenerMensajeErrorCredito(error, 'Ocurrió un error al cargar las solicitudes de crédito.');
      });
  }

  public cambiarFiltroEstadoCreditoAdmin(estado: string) {
    this.filtroEstadoCreditoAdmin = estado;
    this.solicitudCreditoSeleccionadaAdmin = null;
    this.estadoArchivosCreditoAdmin = null;
    this.comentarioCreditoAdmin = '';
    this.clearError();
  }

  public limpiarBusquedaSolicitudesCreditoAdmin() {
    this.filtroBusquedaSolicitudesCreditoAdmin = '';
  }

  private filtrarSolicitudes(solicitudes: any[], busqueda: any, contenido: (solicitud: any) => any[], filtros: any[]) {
    const texto = busqueda ? busqueda.toString().trim().toUpperCase() : '';
    if (texto) {
      return solicitudes.filter(solicitud => contenido(solicitud).join(' ').toUpperCase().indexOf(texto) >= 0);
    }
    return filtros.reduce((resultado, filtro) => filtro[1] && filtro[1] !== 'TODAS' ?
      resultado.filter((solicitud: any) => solicitud[filtro[0]] === filtro[1]) : resultado, solicitudes);
  }

  public obtenerSolicitudesCreditoAdminFiltradas() {
    return this.filtrarSolicitudes(this.solicitudesCreditoAdmin || [], this.filtroBusquedaSolicitudesCreditoAdmin, solicitud => {
      const estadoCredito = solicitud.estado_credito ? solicitud.estado_credito.toString().replace(/_/g, ' ') : '';
      return [
        solicitud.numero_solicitud || '',
        solicitud.nombre_completo_solicitante || '',
        solicitud.nom_aso || '',
        solicitud.numero_documento_solicitante || '',
        solicitud.cod_asp || '',
        solicitud.email_personal_solicitante || '',
        solicitud.celular_solicitante || '',
        solicitud.empresa_grupo || '',
        solicitud.destino_credito || '',
        solicitud.monto_solicitado || '',
        solicitud.plazo_meses || '',
        estadoCredito
      ];
    }, [['estado_credito', this.filtroEstadoCreditoAdmin]]);
  }

  public verFormatoCreditoAdmin(numeroSolicitud: number) {
    this.clearError();
    if (!numeroSolicitud) {
      this.errorMessage = 'No se encontró el número de la solicitud de crédito.';
      return;
    }
    const url = this.bridgeApiUrl + '/femprobien/creditos/solicitudes/' + encodeURIComponent(numeroSolicitud.toString()) + '/formato';
    const ventana = window.open(url, '_blank');
    if (!ventana) {
      this.errorMessage = 'El navegador bloqueó la apertura del formato. Habilita las ventanas emergentes para WALI e inténtalo nuevamente.';
    }
  }

  private irADetalleSolicitudCreditoAdmin() {
    setTimeout(() => {
      const elemento = document.getElementById('detalleSolicitudCreditoAdmin');
      if (!elemento) {
        return;
      }
      const margenSuperior = 115;
      const posicion = elemento.getBoundingClientRect().top + window.pageYOffset - margenSuperior;
      window.scrollTo(0, posicion > 0 ? posicion : 0);
    }, 0);
  }

  public verSolicitudCreditoAdmin(numeroSolicitud: number) {
    if (!numeroSolicitud) {
      this.errorMessage = 'No se encontró el número de la solicitud de crédito.';
      return;
    }
    this.clearError();
    this.loadingDetalleCreditoAdmin = true;
    this.irADetalleSolicitudCreditoAdmin();
    this.reiniciarDetalleCreditoAdmin();
    this._employeeService.consultarSolicitudCredito(numeroSolicitud).subscribe(
      response => {
        this.loadingDetalleCreditoAdmin = false;
        try {
          const data = response.json();
          this.solicitudCreditoSeleccionadaAdmin = data;
          this.irADetalleSolicitudCreditoAdmin();
          this.cargarEstadoArchivosCreditoAdmin(numeroSolicitud);
          this.cargarFormalizacionCreditoAdmin(numeroSolicitud);
        } catch (e) {
          this.errorMessage = 'No fue posible interpretar el detalle de la solicitud de crédito.';
        }
      }, error => {
        this.loadingDetalleCreditoAdmin = false;
        this.errorMessage = this.obtenerMensajeErrorCredito(error, 'Ocurrió un error al consultar la solicitud de crédito.');
      });
  }

  public cargarFormalizacionCreditoAdmin(numeroSolicitud: number) {
    if (!numeroSolicitud) {
      this.formalizacionCreditoAdmin = {
        formalizado: false
      };
      this.loadingFormalizacionCreditoAdmin = false;
      return;
    }
    this.loadingFormalizacionCreditoAdmin = true;
    this.formalizacionCreditoAdmin = null;
    const url = this.bridgeApiUrl + '/femprobien/creditos/solicitudes/' + encodeURIComponent(numeroSolicitud.toString()) + '/formalizacion';

    this._http.get(url).subscribe(
      response => {
        this.loadingFormalizacionCreditoAdmin = false;
        try {
          const data = response.json();
          this.formalizacionCreditoAdmin = data && typeof data === 'object' ? data : { formalizado: false };
        } catch (e) {
          this.formalizacionCreditoAdmin = {
            formalizado: false
          };
        }
      }, error => {
        this.loadingFormalizacionCreditoAdmin = false;
        this.formalizacionCreditoAdmin = {
          formalizado: false
        };
      });
  }

  private crearFormularioFormalizacionCreditoAdmin() {
    return {
      montoAprobado: null, plazoAprobado: null, numeroCuotas: null, valorCuota: null, fechaPrimeraCuota: '', periodicidad: 'QUINCENAL',
      observacion: ''
    };
  }

  public abrirFormalizacionCreditoAdmin() {
    this.clearError();
    if (!this.solicitudCreditoSeleccionadaAdmin || !this.solicitudCreditoSeleccionadaAdmin.numero_solicitud) {
      this.errorMessage = 'No hay una solicitud de crédito seleccionada.';
      return;
    }
    const estado = this.solicitudCreditoSeleccionadaAdmin.estado_credito ? this.solicitudCreditoSeleccionadaAdmin.estado_credito.toString().toUpperCase() : '';
    if (estado !== 'APROBADA') {
      this.errorMessage = 'Solo se pueden formalizar solicitudes de crédito aprobadas.';
      return;
    }
    if (this.formalizacionCreditoAdmin &&
      this.formalizacionCreditoAdmin.formalizado) {
      this.errorMessage = 'Esta solicitud de crédito ya fue formalizada.';
      return;
    }
    this.formularioFormalizacionCreditoAdmin = {
      montoAprobado: this.solicitudCreditoSeleccionadaAdmin.monto_solicitado !== null && this.solicitudCreditoSeleccionadaAdmin.monto_solicitado !== undefined ? Number(this.solicitudCreditoSeleccionadaAdmin.monto_solicitado) : null,
      plazoAprobado: this.solicitudCreditoSeleccionadaAdmin.plazo_meses !== null && this.solicitudCreditoSeleccionadaAdmin.plazo_meses !== undefined ? Number(this.solicitudCreditoSeleccionadaAdmin.plazo_meses) : null,
      numeroCuotas: this.solicitudCreditoSeleccionadaAdmin.cantidad_cuotas !== null && this.solicitudCreditoSeleccionadaAdmin.cantidad_cuotas !== undefined ? Number(this.solicitudCreditoSeleccionadaAdmin.cantidad_cuotas) : null,
      valorCuota: this.solicitudCreditoSeleccionadaAdmin.valor_cuota !== null && this.solicitudCreditoSeleccionadaAdmin.valor_cuota !== undefined ? Number(this.solicitudCreditoSeleccionadaAdmin.valor_cuota) : null,
      fechaPrimeraCuota: '', periodicidad: 'QUINCENAL', observacion: ''
    };
    this.mostrarFormularioFormalizacionCreditoAdmin = true;
  }

  public cancelarFormalizacionCreditoAdmin() {
    if (this.formalizandoCreditoAdmin) {
      return;
    }
    this.mostrarFormularioFormalizacionCreditoAdmin = false;
    this.formularioFormalizacionCreditoAdmin = this.crearFormularioFormalizacionCreditoAdmin();
    this.clearError();
  }

  public formalizarCreditoAdmin(confirmado?: boolean) {
    this.clearError();
    if (this.formalizandoCreditoAdmin) {
      return;
    }
    if (!this.solicitudCreditoSeleccionadaAdmin || !this.solicitudCreditoSeleccionadaAdmin.numero_solicitud) {
      this.errorMessage = 'No hay una solicitud de crédito seleccionada.';
      return;
    }
    const f = this.formularioFormalizacionCreditoAdmin;
    const montoAprobado = Number(f.montoAprobado);
    const plazoAprobado = Number(f.plazoAprobado);
    const numeroCuotas = Number(f.numeroCuotas);
    const valorCuota = Number(f.valorCuota);
    if (!montoAprobado || montoAprobado <= 0) {
      this.errorMessage = 'El monto aprobado debe ser mayor que cero.';
      return;
    }
    if (!plazoAprobado || plazoAprobado <= 0) {
      this.errorMessage = 'El plazo aprobado debe ser mayor que cero.';
      return;
    }
    if (!numeroCuotas || numeroCuotas <= 0) {
      this.errorMessage = 'El número de cuotas debe ser mayor que cero.';
      return;
    }
    if (!valorCuota || valorCuota <= 0) {
      this.errorMessage = 'El valor de la cuota debe ser mayor que cero.';
      return;
    }
    if (!f.fechaPrimeraCuota || f.fechaPrimeraCuota.toString().trim() === '') {
      this.errorMessage = 'La fecha de la primera cuota es obligatoria.';
      return;
    }
    const periodicidad = f.periodicidad ? f.periodicidad.toString().trim().toUpperCase() : 'QUINCENAL';
    if (periodicidad !== 'QUINCENAL' &&
      periodicidad !== 'MENSUAL') {
      this.errorMessage = 'La periodicidad debe ser QUINCENAL o MENSUAL.';
      return;
    }
    const numeroSolicitud = Number(this.solicitudCreditoSeleccionadaAdmin.numero_solicitud);
    const url = this.bridgeApiUrl + '/femprobien/creditos/solicitudes/' + encodeURIComponent(numeroSolicitud.toString()) + '/formalizar';
    const body = {
      montoAprobado: montoAprobado, plazoAprobado: plazoAprobado, numeroCuotas: numeroCuotas, valorCuota: valorCuota,
      fechaPrimeraCuota: f.fechaPrimeraCuota, periodicidad: periodicidad, observacion: f.observacion ? f.observacion.toString().trim() : '',
      usuario: this.identity && this.identity.username ? this.identity.username : ''
    };
    if (!confirmado) {
      this.confirmarFemprobien('Confirmar formalización', '¿Deseas formalizar el crédito #' + numeroSolicitud + '?', 'Se registrará un crédito activo con los valores revisados.', 'Formalizar crédito', () => this.formalizarCreditoAdmin(true));
      return;
    }
    this.formalizandoCreditoAdmin = true;
    this._http.post(url, body).subscribe(
      response => {
        this.formalizandoCreditoAdmin = false;
        let data: any = null;
        try {
          data = response.json();
        } catch (e) {
          data = null;
        }
        if (data &&
          data.status === 201) {
          this.successMessage = 'Crédito #' + (data.id_credito || '') + ' formalizado correctamente y registrado como ACTIVO.';
          this.mostrarFormularioFormalizacionCreditoAdmin = false;
          this.cargarFormalizacionCreditoAdmin(numeroSolicitud);
          return;
        }
        this.errorMessage = data && data.message ? data.message : 'No fue posible formalizar el crédito.';
      }, error => {
        this.formalizandoCreditoAdmin = false;
        this.errorMessage = this.obtenerMensajeErrorCredito(error, 'Ocurrió un error al formalizar el crédito.');
      });
  }

  public cargarEstadoArchivosCreditoAdmin(numeroSolicitud: number) {
    const url = this.bridgeApiUrl + '/femprobien/creditos/solicitudes/' + encodeURIComponent(numeroSolicitud.toString()) + '/archivos/estado';

    this._http.get(url).subscribe(
      response => {
        try {
          this.estadoArchivosCreditoAdmin = response.json();
        } catch (e) {
          this.estadoArchivosCreditoAdmin = null;
        }
      }, error => {
        this.estadoArchivosCreditoAdmin = null;
        this.errorMessage = this.obtenerMensajeErrorCredito(error, 'Ocurrió un error al consultar el estado de los archivos de la solicitud de crédito.');
      });
  }

  private reiniciarDetalleCreditoAdmin() {
    this.solicitudCreditoSeleccionadaAdmin = null;
    this.estadoArchivosCreditoAdmin = null;
    this.comentarioCreditoAdmin = '';
    this.loadingFormalizacionCreditoAdmin = false;
    this.formalizacionCreditoAdmin = null;
    this.mostrarFormularioFormalizacionCreditoAdmin = false;
    this.formalizandoCreditoAdmin = false;
  }

  public cerrarSolicitudCreditoAdmin() {
    if (this.actualizandoEstadoCreditoAdmin) {
      return;
    }
    this.reiniciarDetalleCreditoAdmin();
    this.formularioFormalizacionCreditoAdmin = this.crearFormularioFormalizacionCreditoAdmin();
    this.clearError();
  }

  public puedeCambiarEstadoCreditoAdmin(nuevoEstado: string) {
    if (!this.solicitudCreditoSeleccionadaAdmin || !this.solicitudCreditoSeleccionadaAdmin.estado_credito) {
      return false;
    }
    const actual = this.solicitudCreditoSeleccionadaAdmin.estado_credito.toString().toUpperCase();
    if (actual === 'PENDIENTE') {
      return nuevoEstado === 'EN_ESTUDIO' || nuevoEstado === 'APROBADA' || nuevoEstado === 'APLAZADA' || nuevoEstado === 'NEGADA';
    }
    if (actual === 'EN_ESTUDIO') {
      return nuevoEstado === 'APROBADA' || nuevoEstado === 'APLAZADA' || nuevoEstado === 'NEGADA';
    }
    if (actual === 'APLAZADA') {
      return nuevoEstado === 'EN_ESTUDIO' || nuevoEstado === 'APROBADA' || nuevoEstado === 'NEGADA';
    }
    return false;
  }

  public actualizarEstadoCreditoAdmin(nuevoEstado: string, confirmado?: boolean) {
    if (!this.solicitudCreditoSeleccionadaAdmin || !this.solicitudCreditoSeleccionadaAdmin.numero_solicitud) {
      this.errorMessage = 'No hay una solicitud de crédito seleccionada.';
      return;
    }
    if (!this.puedeCambiarEstadoCreditoAdmin(nuevoEstado)) {
      this.errorMessage = 'La transición de estado solicitada no está permitida.';
      return;
    }
    if ((nuevoEstado === 'NEGADA' || nuevoEstado === 'APLAZADA') &&
      (!this.comentarioCreditoAdmin || this.comentarioCreditoAdmin.trim() === '')) {
      this.errorMessage = 'Para negar o aplazar un crédito debes registrar un comentario.';
      return;
    }
    if (!confirmado) {
      const numeroSolicitudModal = Number(this.solicitudCreditoSeleccionadaAdmin.numero_solicitud);
      let tituloModal = 'Confirmar cambio de estado';
      let mensajeModal = '¿Deseas actualizar el estado de la solicitud de crédito #' + numeroSolicitudModal + '?';
      let textoBotonModal = 'Confirmar cambio';
      let tipoModal = 'warning';
      let claseBotonModal = 'btn-warning';
      if (nuevoEstado === 'EN_ESTUDIO') {
        tituloModal = 'Confirmar estudio del crédito';
        mensajeModal = 'La solicitud de crédito #' + numeroSolicitudModal + ' pasará a estado EN ESTUDIO.';
        textoBotonModal = 'Pasar a estudio';
        tipoModal = 'info';
        claseBotonModal = 'btn-info';
      }
      if (nuevoEstado === 'APROBADA') {
        tituloModal = 'Confirmar aprobación';
        mensajeModal = '¿Deseas aprobar la solicitud de crédito #' + numeroSolicitudModal + '?';
        textoBotonModal = 'Aprobar crédito';
        tipoModal = 'success';
        claseBotonModal = 'btn-success';
      }
      if (nuevoEstado === 'APLAZADA') {
        tituloModal = 'Confirmar aplazamiento';
        mensajeModal = '¿Deseas aplazar la solicitud de crédito #' + numeroSolicitudModal + '?';
        textoBotonModal = 'Aplazar crédito';
        tipoModal = 'warning';
        claseBotonModal = 'btn-warning';
      }
      if (nuevoEstado === 'NEGADA') {
        tituloModal = 'Confirmar negación';
        mensajeModal = '¿Deseas negar la solicitud de crédito #' + numeroSolicitudModal + '?';
        textoBotonModal = 'Negar crédito';
        tipoModal = 'error';
        claseBotonModal = 'btn-danger';
      }
      const detalleModal = this.comentarioCreditoAdmin &&
        this.comentarioCreditoAdmin.trim() !== '' ? 'Comentario: ' +
      this.comentarioCreditoAdmin.trim() : 'Este cambio quedará registrado en el historial de la solicitud.';
      this.confirmarFemprobien(tituloModal, mensajeModal, detalleModal, textoBotonModal, () => this.actualizarEstadoCreditoAdmin(nuevoEstado, true), tipoModal, claseBotonModal);
      return;
    }
    this.clearError();
    const numeroSolicitud = Number(this.solicitudCreditoSeleccionadaAdmin.numero_solicitud);
    const url = this.bridgeApiUrl + '/femprobien/creditos/solicitudes/' + encodeURIComponent(numeroSolicitud.toString()) + '/estado';
    const body = {
      estado: nuevoEstado,
      comentario: this.comentarioCreditoAdmin ? this.comentarioCreditoAdmin.trim() : '',
      usuario: this.identity && this.identity.username ? this.identity.username : ''
    };
    this.actualizandoEstadoCreditoAdmin = true;

    this._http.patch(url, body).subscribe(
      response => {
        this.actualizandoEstadoCreditoAdmin = false;
        const data = response.json();
        if (data && data.status === 200) {
          this.successMessage = 'La solicitud de crédito #' + numeroSolicitud + ' cambió a ' + nuevoEstado + ' correctamente.';
          this.comentarioCreditoAdmin = '';
          this.loadSolicitudesCreditoAdmin();
          this.cargarCantidadSolicitudesCreditoPendientes();
          this.verSolicitudCreditoAdmin(numeroSolicitud);
        } else {
          this.errorMessage = data && data.message ? data.message : 'No fue posible actualizar el estado del crédito.';
        }
      }, error => {
        this.actualizandoEstadoCreditoAdmin = false;
        this.errorMessage = this.obtenerMensajeErrorCredito(error, 'Ocurrió un error al actualizar el estado del crédito.');
      });
  }

  public abrirMisSolicitudes() {
    this.adminTab = 'misSolicitudes';
    this.clearError();
    if (!this.documentoMisSolicitudes && this.documento) {
      this.documentoMisSolicitudes = this.documento.toString();
    }
    if (!this.fechaNacimientoMisSolicitudes && this.fechaNacimiento) {
      this.fechaNacimientoMisSolicitudes = this.fechaNacimiento.toString();
    }
  }

  public consultarMisSolicitudes() {
    const documento = this.documentoMisSolicitudes ? this.documentoMisSolicitudes.toString().trim() : '';
    const fechaNacimiento = this.fechaNacimientoMisSolicitudes ? this.fechaNacimientoMisSolicitudes.toString().trim() : '';
    if (!documento || !fechaNacimiento) {
      this.errorMessage = 'Ingresa el número de documento y la fecha de nacimiento para consultar tus solicitudes.';
      return;
    }
    this.clearError();
    this.loadingMisSolicitudes = true;
    this.consultaMisSolicitudesRealizada = false;
    this.nombreMisSolicitudes = '';
    this.solicitudesMisSolicitudes = [];
    this.filtroTipoMisSolicitudes = 'TODAS';
    const url = this.bridgeApiUrl + '/femprobien/mis-solicitudes/consultar';
    const body: any = { codAsp: documento, fechaNacimiento: fechaNacimiento };

    this._http.post(url, body).subscribe(
      response => {
        this.loadingMisSolicitudes = false;
        this.consultaMisSolicitudesRealizada = true;
        try {
          const data = response.json();
          const solicitudes = data && Array.isArray(data.solicitudes) ? data.solicitudes : [];
          this.nombreMisSolicitudes = data && data.nombre ? data.nombre.toString() : '';
          for (let i = 0; i < solicitudes.length; i++) {
            solicitudes[i]._seguimientoAbierto = false;
            solicitudes[i]._loadingHistorial = false;
            solicitudes[i]._historialCargado = false;
            solicitudes[i]._historial = [];
            solicitudes[i]._errorHistorial = '';
            solicitudes[i]._tipoEtiqueta = this.etiquetaTipoMisSolicitud(solicitudes[i].tipo);
            solicitudes[i]._estadoEtiqueta = this.etiquetaEstadoMisSolicitud(solicitudes[i].tipo, solicitudes[i].estado);
          }
          this.solicitudesMisSolicitudes = solicitudes;
        } catch (e) {
          this.nombreMisSolicitudes = '';
          this.solicitudesMisSolicitudes = [];
          this.errorMessage = 'No fue posible interpretar la información de tus solicitudes.';
        }
      }, error => {
        this.loadingMisSolicitudes = false;
        this.consultaMisSolicitudesRealizada = false;
        this.nombreMisSolicitudes = '';
        this.solicitudesMisSolicitudes = [];
        this.errorMessage = this.obtenerMensajeErrorCredito(error, 'Ocurrió un error al consultar tus solicitudes.');
      });
  }

  public limpiarMisSolicitudes() {
    this.documentoMisSolicitudes = '';
    this.fechaNacimientoMisSolicitudes = '';
    this.nombreMisSolicitudes = '';
    this.solicitudesMisSolicitudes = [];
    this.filtroTipoMisSolicitudes = 'TODAS';
    this.loadingMisSolicitudes = false;
    this.consultaMisSolicitudesRealizada = false;
    this.clearError();
  }

  public cambiarFiltroTipoMisSolicitudes(tipo: string) {
    this.filtroTipoMisSolicitudes = tipo ? tipo : 'TODAS';
  }

  public obtenerSolicitudesMisSolicitudesFiltradas(tipo: string = this.filtroTipoMisSolicitudes) {
    if (!tipo || tipo === 'TODAS') {
      return this.solicitudesMisSolicitudes;
    }
    return this.solicitudesMisSolicitudes.filter((solicitud: any) => solicitud &&
      solicitud.tipo === tipo);
  }

  public cantidadMisSolicitudesPorTipo(tipo: string): number {
    return this.obtenerSolicitudesMisSolicitudesFiltradas(tipo || 'TODAS').length;
  }

  public toggleSeguimientoMisSolicitud(solicitud: any) {
    if (!solicitud) {
      return;
    }
    if (solicitud._seguimientoAbierto) {
      solicitud._seguimientoAbierto = false;
      return;
    }
    solicitud._seguimientoAbierto = true;
    solicitud._errorHistorial = '';
    if (solicitud._historialCargado || solicitud._loadingHistorial) {
      return;
    }
    const documento = this.documentoMisSolicitudes ? this.documentoMisSolicitudes.toString().trim() : '';
    const fechaNacimiento = this.fechaNacimientoMisSolicitudes ? this.fechaNacimientoMisSolicitudes.toString().trim() : '';
    if (!documento || !fechaNacimiento) {
      solicitud._errorHistorial = 'No fue posible validar los datos para consultar el seguimiento.';
      return;
    }
    const credito = solicitud.tipo === 'CREDITO';
    const identificador = credito ? solicitud.numero_solicitud : solicitud.id;
    if (!identificador) {
      solicitud._errorHistorial = credito
        ? 'No fue posible identificar la solicitud de crédito.' : 'No fue posible identificar la solicitud.';
      return;
    }
    const recurso = credito ? 'creditos/' : 'afiliaciones/';
    const url = this.bridgeApiUrl + '/femprobien/mis-solicitudes/' + recurso + encodeURIComponent(identificador.toString()) + '/historial';
    solicitud._loadingHistorial = true;
    const body: any = { codAsp: documento, fechaNacimiento: fechaNacimiento };

    this._http.post(url, body).subscribe(
      response => {
        solicitud._loadingHistorial = false;
        try {
          const data = response.json();
          const historial = Array.isArray(data) ? data : [];
          for (let i = 0; i < historial.length; i++) {
            historial[i]._estadoEtiqueta = this.etiquetaEstadoMisSolicitud(solicitud.tipo, historial[i].estado);
          }
          solicitud._historial = historial;
          solicitud._historialCargado = true;
        } catch (e) {
          solicitud._historial = [];
          solicitud._historialCargado = false;
          solicitud._errorHistorial = 'No fue posible interpretar el seguimiento de la solicitud.';
        }
      }, error => {
        solicitud._loadingHistorial = false;
        solicitud._historial = [];
        solicitud._historialCargado = false;
        solicitud._errorHistorial = this.obtenerMensajeErrorCredito(error, 'Ocurrió un error al consultar el seguimiento de la solicitud.');
      });
  }

  public etiquetaTipoMisSolicitud(tipo: any) {
    const valor = tipo === null || tipo === undefined ? '' : tipo.toString().trim().toUpperCase();
    const etiquetas: { [clave: string]: string } = {
      CREDITO: 'SOLICITUD DE CRÉDITO',
      ACTUALIZACION_DATOS: 'ACTUALIZACIÓN DE DATOS',
      AFILIACION: 'SOLICITUD DE AFILIACIÓN'
    };
    return Object.prototype.hasOwnProperty.call(etiquetas, valor) ? etiquetas[valor] : valor || 'SOLICITUD';
  }

  private etiquetaEstadoMisSolicitud(tipo: any, estado: any) {
    const tipoValor = tipo === null || tipo === undefined ? '' : tipo.toString().trim().toUpperCase();
    const valor = estado === null || estado === undefined ? '' : estado.toString().trim().toUpperCase();
    if (valor === 'PENDIENTE') {
      return 'Solicitud enviada';
    }
    const etiquetas: { [clave: string]: string } = {
      'CREDITO:EN_ESTUDIO': 'En estudio', 'CREDITO:APROBADA': 'Solicitud aprobada', 'CREDITO:APLAZADA': 'Solicitud aplazada',
      'CREDITO:NEGADA': 'Solicitud no aprobada', 'AFILIACION:AFILIADO(A)': 'Afiliación aprobada',
      'AFILIACION:RECHAZADO(A)': 'Afiliación no aprobada', 'ACTUALIZACION_DATOS:AFILIADO(A)': 'Datos actualizados',
      'ACTUALIZACION_DATOS:RECHAZADO(A)': 'Actualización no aprobada'
    };
    const clave = tipoValor + ':' + valor;
    return Object.prototype.hasOwnProperty.call(etiquetas, clave) ? etiquetas[clave] : valor || 'Sin estado';
  }

  public abrirHistoricoCreditos() {
    this.adminTab = 'historicoCreditos';
    this.clearError();
    if (!this.documentoHistoricoCredito &&
      this.documento) {
      this.documentoHistoricoCredito = this.documento.toString();
    }
  }

  public consultarHistoricoCreditos() {
    const documento = this.documentoHistoricoCredito ? this.documentoHistoricoCredito.toString().trim() : '';
    if (!documento) {
      this.errorMessage = 'Ingresa el número de documento para consultar los créditos.';
      return;
    }
    this.clearError();
    this.loadingHistoricoCreditos = true;
    this.consultaHistoricoRealizada = false;
    this.historicoCreditos = [];
    this.nombreHistoricoCredito = '';
    const url = this.bridgeApiUrl + '/femprobien/creditos/historico/asociado/' + encodeURIComponent(documento);

    this._http.get(url).subscribe(
      response => {
        this.loadingHistoricoCreditos = false;
        this.consultaHistoricoRealizada = true;
        try {
          const data = response.json();
          this.historicoCreditos = data && Array.isArray(data.creditos) ? data.creditos : [];
          this.nombreHistoricoCredito = data && data.nombre ? data.nombre : '';
          if (this.historicoCreditos.length === 0) {
            this.errorMessage = 'No se encontraron créditos para el documento ' + documento + '.';
          }
        } catch (e) {
          this.historicoCreditos = [];
          this.nombreHistoricoCredito = '';
          this.errorMessage = 'No fue posible interpretar el histórico de créditos.';
        }
      }, error => {
        this.loadingHistoricoCreditos = false;
        this.consultaHistoricoRealizada = true;
        this.historicoCreditos = [];
        this.nombreHistoricoCredito = '';
        this.errorMessage = this.obtenerMensajeErrorCredito(error, 'Ocurrió un error al consultar los créditos.');
      });
  }

  public verHistoricoSaldos(credito: any) {
    this.errorEstadoCuentaCredito = '';
    this.creditoHistoricoSaldos = credito;
    this.saldosHistoricos = [];
    this.errorHistoricoSaldos = '';
    this.cargandoHistoricoSaldos = true;
    const version = ++this.versionHistoricoSaldos;
    this._http.get(this.bridgeApiUrl + '/femprobien/creditos/historico/detalle/' + credito.id).subscribe(
      response => {
        if (version !== this.versionHistoricoSaldos) { return; }
        this.cargandoHistoricoSaldos = false;
        try {
          const data = response.json();
          if (!data || !Array.isArray(data.saldos)) { throw new Error(); }
          this.creditoHistoricoSaldos = data;
          this.saldosHistoricos = data.saldos.slice().sort((a: any, b: any) => new Date(a.periodo).getTime() - new Date(b.periodo).getTime());
        } catch (e) { this.errorHistoricoSaldos = 'El servicio no devolvió un histórico de saldos válido.'; }
      }, error => {
        if (version !== this.versionHistoricoSaldos) { return; }
        this.cargandoHistoricoSaldos = false;
        this.errorHistoricoSaldos = this.obtenerMensajeErrorCredito(error, 'No fue posible consultar el histórico de saldos.');
      });
  }

  public cuotaProgramadaHistorico(periodo: string): string {
    const inicio = /^(\d{4})-(\d{2})/.exec(String(this.creditoHistoricoSaldos.inicio_dcto || ''));
    const corte = /^(\d{4})-(\d{2})/.exec(String(periodo || ''));
    if (!inicio || !corte || +inicio[1] <= 1900 || +inicio[2] < 1 || +inicio[2] > 12 || +corte[2] < 1 || +corte[2] > 12) { return '—'; }
    const cuota = (+corte[1] - +inicio[1]) * 12 + +corte[2] - +inicio[2] + 1;
    if (cuota <= 0) { return '—'; }
    const plazo = +this.creditoHistoricoSaldos.plazo;
    return plazo > 0 && cuota > plazo ? 'Fuera del plazo original' : 'Cuota ' + cuota;
  }

  public cuotasDescontadasAlCorte(): string {
    const plazo = +this.creditoHistoricoSaldos.plazo;
    if (!this.saldosHistoricos.length || !isFinite(plazo) || plazo <= 0 || plazo % 1 !== 0) { return 'Sin información'; }
    const cuota = /^Cuota (\d+)$/.exec(this.cuotaProgramadaHistorico(this.saldosHistoricos[this.saldosHistoricos.length - 1].periodo));
    return cuota ? cuota[1] + '/' + plazo : 'Sin información';
  }

  public generarEstadoCuentaCredito() {
    if (!this.creditoHistoricoSaldos || this.cargandoHistoricoSaldos || this.generandoEstadoCuentaCredito) { return; }
    this.errorEstadoCuentaCredito = '';
    const ventana = window.open('', '_blank');
    if (!ventana) {
      this.errorEstadoCuentaCredito = 'Permite las ventanas emergentes para ver el estado de cuenta.';
      return;
    }
    ventana.opener = null;
    ventana.document.title = 'Generando estado de cuenta del crédito…';
    ventana.document.body.textContent = 'Generando estado de cuenta del crédito…';
    const id = this.creditoHistoricoSaldos.id;
    const version = this.versionHistoricoSaldos;
    this.generandoEstadoCuentaCredito = true;
    this._http.get(this.bridgeApiUrl + '/femprobien/creditos/historico/detalle/' + id + '/estado-cuenta',
      new RequestOptions({ responseType: ResponseContentType.Blob })).subscribe(response => {
        this.generandoEstadoCuentaCredito = false;
        try {
          const pdf = response.blob();
          if (!pdf.size || ((response.headers && response.headers.get('Content-Type')) || '').indexOf('application/pdf') < 0) { throw new Error(); }
          if (ventana.closed) { return; }
          const url = window.URL.createObjectURL(pdf);
          ventana.location.href = url;
          const limpieza = setInterval(() => {
            if (ventana.closed) { window.URL.revokeObjectURL(url); clearInterval(limpieza); }
          }, 1000);
        } catch (e) {
          ventana.close();
          if (version === this.versionHistoricoSaldos) { this.errorEstadoCuentaCredito = 'No fue posible mostrar el estado de cuenta.'; }
        }
      }, error => {
        this.generandoEstadoCuentaCredito = false;
        ventana.close();
        if (version === this.versionHistoricoSaldos) { this.errorEstadoCuentaCredito = 'No fue posible generar el estado de cuenta. Intenta nuevamente.'; }
      });
  }

  public cerrarHistoricoSaldos() {
    this.versionHistoricoSaldos++;
    this.creditoHistoricoSaldos = null;
    this.saldosHistoricos = [];
  }

  public limpiarHistoricoCreditos() {
    this.documentoHistoricoCredito = '';
    this.historicoCreditos = [];
    this.nombreHistoricoCredito = '';
    this.consultaHistoricoRealizada = false;
    this.clearError();
  }

  public abrirCreditoEnHistorico(codAsp: any) {
    if (codAsp === null || codAsp === undefined || codAsp.toString().trim() === '') {
      return;
    }
    this.documentoHistoricoCredito = codAsp.toString();
    this.adminTab = 'historicoCreditos';
    this.consultarHistoricoCreditos();
  }

  private obtenerMensajeErrorCredito(error: any, mensajeDefecto: string) {
    if (error && error._body) {
      try {
        const body = JSON.parse(error._body);
        if (body && body.message) {
          return body.message;
        }
      } catch (e) { }
    }
    return mensajeDefecto;
  }

  private cambiarEstadoSecciones(config: any[], estados: any, abrir: boolean) {
    for (let i = 0; i < config.length; i++) {
      estados[config[i].id] = abrir;
    }
  }

  private reiniciarSeccionesAfiliacion() {
    this.seccionesAfiliacionConfig.forEach(seccion => {
      this.seccionesAbiertas[seccion.id] = seccion.id === 'solicitud';
    });
  }

  public toggleSeccion(seccion: string) {
    this.seccionAfiliacionActiva = seccion;
    this.seccionesAbiertas[seccion] = !this.seccionesAbiertas[seccion];
  }

  private cambiarEstadoSeccionesAfiliacion(abrir: boolean) {
    const identidadPendiente = this.esActualizacionDatos() && !this.datosActualizacionCargados;
    this.cambiarEstadoSecciones(this.seccionesAfiliacionConfig, this.seccionesAbiertas, abrir && !identidadPendiente);
    if (identidadPendiente) this.seccionesAbiertas.solicitud = true;
  }

  public expandirTodasSeccionesAfiliacion() {
    this.cambiarEstadoSeccionesAfiliacion(true);
  }

  public contraerTodasSeccionesAfiliacion() {
    this.cambiarEstadoSeccionesAfiliacion(false);
  }

  public irASeccionAfiliacion(seccion: string) {
    this.seccionAfiliacionActiva = seccion;
    this.seccionesAbiertas[seccion] = true;
    this.irASeccion('afiliacion-seccion-', seccion);
  }

  private obtenerCamposBeneficiario(numero: number) {
    const indice = numero === 1 ? 1 : numero === 2 ? 2 : 3;
    return ['tipoDocBen', 'codBen', 'nomBen', 'parBen'].map(campo => this.nuevoAfiliado[campo + indice]);
  }

  public beneficiarioTieneDatos(numero: number) {
    return this.obtenerCamposBeneficiario(numero).some(campo => !this.estaVacio(campo));
  }

  public beneficiarioCompleto(numero: number) {
    return this.obtenerCamposBeneficiario(numero).every(campo => !this.estaVacio(campo));
  }

  public tieneBeneficiarioCompleto() {
    return this.beneficiarioCompleto(1) || this.beneficiarioCompleto(2) || this.beneficiarioCompleto(3);
  }

  public tieneBeneficiarioParcial() {
    return [1, 2, 3].some(numero => this.beneficiarioTieneDatos(numero) && !this.beneficiarioCompleto(numero));
  }

  public campoBeneficiarioInvalido(numero: number, valor: any) {
    if (!this.intentoEnviarAfiliacion) {
      return false;
    }
    return ((!this.tieneBeneficiarioCompleto() && numero === 1) || this.beneficiarioTieneDatos(numero))
      ? this.estaVacio(valor) : false;
  }

  private obtenerCamposObligatoriosAfiliacion(seccion?: string) {
    const esActualizacion = this.esActualizacionDatos();
    return this.camposObligatoriosAfiliacion.filter(campo =>
      (!seccion || campo.seccion === seccion) && (!esActualizacion || !campo.soloAfiliacion));
  }

  public estadoSeccionAfiliacion(seccion: string) {
    if (seccion === 'conyuge' || seccion === 'patrimonio') {
      return 'si-aplica';
    }
    if (seccion === 'beneficiarios') {
      if (this.tieneBeneficiarioCompleto() && !this.tieneBeneficiarioParcial()) {
        return 'completa';
      }
      if (this.beneficiarioTieneDatos(1) || this.beneficiarioTieneDatos(2) || this.beneficiarioTieneDatos(3) || this.intentoEnviarAfiliacion) {
        return 'pendiente';
      }
      return 'sin-diligenciar';
    }
    return seccion ? this.estadoCamposObjeto(this.nuevoAfiliado || {}, this.obtenerCamposObligatoriosAfiliacion(seccion).map(campo => campo.campo)) : 'sin-diligenciar';
  }

  public cantidadSeccionesAfiliacionCompletas(): number {
    let cantidad = this.contarSeccionesCompletas([
      'solicitud',
      'datosPersonales',
      'informacionLaboral',
      'infoFinanciera'
    ], false);
    if (this.tieneBeneficiarioCompleto() &&
      !this.tieneBeneficiarioParcial()) {
      cantidad++;
    }
    return cantidad;
  }

  public cantidadSeccionesAfiliacionRequeridas(): number { return 5; }

  public porcentajeProgresoAfiliacion(): number {
    return Math.round((this.cantidadSeccionesAfiliacionCompletas() * 100) / this.cantidadSeccionesAfiliacionRequeridas());
  }

  public textoEstadoSeccion(estado: string) {
    const textos: any = {
      'completa': 'Completa', 'pendiente': 'Pendiente', 'si-aplica': 'Si aplica', 'opcional': 'Opcional', 'no-requerida': 'No requerida',
      'fondo': 'Uso del fondo'
    };
    return textos[estado] || 'Sin diligenciar';
  }

  public campoObligatorioVacio(valor: any) { return this.estaVacio(valor); }

  private limpiarDatosAsociado() {
    this.datosEmpleado = null;
    this.datosAportes = null;
    this.loadingAportes = false;
    this.validado = false;
    this.vista = null;
  }

  public validarEmpleado() {
    this.clearError();
    this.modalSinAportesVisible = false;
    this.asociadoSinAportes = null;
    if (!this.documento || !this.fechaNacimiento) {
      this.errorMessage = 'Debe ingresar el número de documento y la fecha de nacimiento.';
      return;
    }
    const documento = this.documento.toString().trim();
    const fechaNacimiento = this.fechaNacimiento.toString().trim();
    this.loading = true;

    this._employeeService.consultarAsociadoFemprobien(documento).subscribe(
      response => {
        this.loading = false;
        let registro: any = null;
        try {
          registro = response.json();
        } catch (e) {
          this.errorMessage = 'No fue posible interpretar la respuesta del servidor.';
          return;
        }
        if (!registro || registro.id_aso === null || registro.id_aso === undefined || !registro.cod_asp || !registro.nom_aso) {
          this.limpiarDatosAsociado();
          this.errorMessage = 'No se encontró un asociado con los datos ingresados.';
          return;
        }
        const fechaBackend = this.fechaParaInput(registro.fec_nac);
        const fechaIngresada = this.fechaParaInput(fechaNacimiento);
        if (!fechaBackend || !fechaIngresada || fechaBackend !== fechaIngresada) {
          this.limpiarDatosAsociado();
          this.errorMessage = 'No se encontró un asociado con los datos ingresados.';
          return;
        }
        this.datosEmpleado = this.mapearAsociadoFemprobien(registro);
        this.validado = true;
        this.vista = 'estadoCuenta';
        this.errorMessage = '';
        this.cargarAportes(this.datosEmpleado.codAso);
      }, error => {
        this.loading = false;
        this.limpiarDatosAsociado();
        this.modalSinAportesVisible = false;
        this.asociadoSinAportes = null;
        if (error && error.status === 404) {
          this.errorMessage = 'No se encontró un asociado con los datos ingresados.';
        } else {
          this.errorMessage = 'Ocurrió un error al validar los datos. Intente nuevamente.';
        }
      });
  }

  private mapearAsociadoFemprobien(registro: any) {
    if (!registro) {
      return null;
    }
    return {
      id: registro.id_aso, codAso: registro.cod_asp, nomAso: registro.nom_aso || '', ap1Aso: '', ap2Aso: '', fecNac: registro.fec_nac || '',
      fecIng: registro.fec_ing || '', fecRet: registro.fecha_retiro || null, activo: registro.activo, estCivil: registro.est_civil || '',
      dirRes: registro.dir_res || '', nomBar: registro.nom_bar || '', tel: registro.tel || '', telCel: registro.cel || '',
      cel: registro.cel || '', email: registro.email_per || '', eMail: registro.email_per || '', nomEmp: registro.nom_emp || '',
      nomCar: registro.cargo || '', cargo: registro.cargo || '', profesion: registro.profesion || '', salBas: registro.sal_bas,
      ctaTipo: registro.tipo_cuenta || '', tipoCuenta: registro.tipo_cuenta || '', fdoBan: registro.banco || '', banco: registro.banco || '',
      ctaBan: registro.n_cuenta || '', nCuenta: registro.n_cuenta || '', tipoDoc: registro.tipo_documento || 'CC',
      formaDesc: registro.forma_desc || '', apMes: registro.cant_porcen, cantPorcen: registro.cant_porcen,
      porcenAhorro: registro.porcen_ahorro, ingPre: registro.prom_pres, ingNoPre: registro.prom_boni, nomBen1: registro.ben_nom1 || '',
      codBen1: registro.ben_doc1 || '', parBen1: registro.parentesco1 || '', nomBen2: registro.ben_nom2 || '',
      codBen2: registro.ben_doc2 || '', parBen2: registro.parentesco2 || ''
    };
  }

  public cargarAportes(codAsp: string) {
    if (!codAsp) {
      this.datosAportes = null;
      this.loadingAportes = false;
      this.asociadoSinAportes = null;
      this.modalSinAportesVisible = false;
      return;
    }
    this.loadingAportes = true;
    this.datosAportes = null;
    this.asociadoSinAportes = null;
    this.modalSinAportesVisible = false;
    this._employeeService.consultarAportesFemprobien(codAsp).subscribe(
      response => {
        this.loadingAportes = false;
        try {
          this.datosAportes = response.json();
        } catch (e) {
          this.datosAportes = null;
          this.errorMessage = 'No fue posible interpretar la información de aportes.';
          return;
        }
        this.asociadoSinAportes = null;
        this.modalSinAportesVisible = false;
      }, error => {
        this.loadingAportes = false;
        this.datosAportes = null;

        if (error && error.status === 404) {
          this.asociadoSinAportes = this.datosEmpleado;
          this.modalSinAportesVisible = true;
          return;
        }
        this.asociadoSinAportes = null;
        this.modalSinAportesVisible = false;
        this.errorMessage = 'No fue posible consultar la información de aportes. Intente nuevamente.';
      });
  }

  public cerrarModalSinAportes() {
    this.modalSinAportesVisible = false;
  }

  public generateAccountStatement() {
    if (!this.datosEmpleado || !this.datosEmpleado.codAso) {
      this.errorMessage = 'No se encontró el código del asociado.';
      return;
    }
    if (this.loadingEstadoCuenta) {
      return;
    }
    this.loadingEstadoCuenta = true;
    this.errorMessage = '';
    this.successMessage = '';
    const codAsp = this.datosEmpleado.codAso.toString();
    const urlGenerar = this.bridgeApiUrl + '/femprobien/asociados/' + encodeURIComponent(codAsp) + '/estado-cuenta';
    const urlPdf = this.bridgeApiUrl + '/femprobien/asociados/' + encodeURIComponent(codAsp) + '/estado-cuenta/pdf';
    const pdfWindow = window.open('', '_blank');

    this._http.post(urlGenerar, {}).subscribe(
      response => {
        this.loadingEstadoCuenta = false;
        const data = response.json();
        if (data && data.status === 200) {
          const pdfUrl = urlPdf + '?t=' + new Date().getTime();
          if (pdfWindow) {
            pdfWindow.location.href = pdfUrl;
          } else {
            window.open(pdfUrl, '_blank');
          }
          this.errorMessage = '';
          this.successMessage = 'Estado de cuenta generado correctamente.';
        } else {
          if (pdfWindow) {
            pdfWindow.close();
          }
          this.errorMessage = data && data.message ? data.message : 'No fue posible generar el estado de cuenta.';
        }
      }, error => {
        this.loadingEstadoCuenta = false;
        if (pdfWindow) {
          pdfWindow.close();
        }

        this.errorMessage = this.obtenerMensajeErrorCredito(error, 'Error al generar el estado de cuenta.');
      });
  }

  public volverInicio() {
    this.simulacionPendiente = null;
    this.intentoEnviarAfiliacion = false;
    this.intentoEnviarCredito = false;
    this.documento = null;
    this.fechaNacimiento = '';
    this.datosEmpleado = null;
    this.datosAportes = null;
    this.loadingAportes = false;
    this.modalSinAportesVisible = false;
    this.asociadoSinAportes = null;
    this.loadingEstadoCuenta = false;
    this.validado = false;
    this.vista = null;
    this.modoCredito = false;
    this.mostrarFormularioCredito = false;
    this.enviandoCredito = false;
    this.formularioCredito = this.crearFormularioCredito();
    this.mostrarFormularioAfiliado = false;
    this.nuevoAfiliado = this.crearFormularioAfiliacion();
    this.clearError();
  }

  public toggleSeccionCredito(seccion: string) {
    this.seccionCreditoActiva = seccion;
    this.seccionesCreditoAbiertas[seccion] = !this.seccionesCreditoAbiertas[seccion];
  }

  public expandirTodasSeccionesCredito() {
    this.cambiarEstadoSecciones(this.seccionesCreditoConfig, this.seccionesCreditoAbiertas, true);
    if (!this.deudoresSolidariosObligatorios()) {
      this.seccionesCreditoAbiertas.deudor1 = false;
    }
  }

  public contraerTodasSeccionesCredito() {
    this.cambiarEstadoSecciones(this.seccionesCreditoConfig, this.seccionesCreditoAbiertas, false);
  }

  public irASeccionCredito(seccion: string) {
    if (seccion === 'deudor1' && !this.deudoresSolidariosObligatorios()) {
      return;
    }
    this.seccionCreditoActiva = seccion;
    this.seccionesCreditoAbiertas[seccion] = true;
    this.irASeccion('credito-seccion-', seccion);
  }

  private estadoSegunCampos(campos: any[]) {
    if (!campos || campos.length === 0) {
      return 'sin-diligenciar';
    }
    const diligenciados = campos.filter(campo => !this.estaVacio(campo)).length;
    return diligenciados === 0 ? 'sin-diligenciar' :
      diligenciados === campos.length ? 'completa' : 'pendiente';
  }

  private estadoCamposObjeto(objeto: any, campos: string[]) {
    return this.estadoSegunCampos(campos.map(campo => objeto[campo]));
  }

  public estadoSeccionCredito(seccion: string) {
    const f = this.formularioCredito || {};
    if (seccion === 'fondo') {
      return 'fondo';
    }
    if (seccion === 'deudor1' && !this.deudoresSolidariosObligatorios()) {
      return 'no-requerida';
    }
    if (seccion === 'patrimonio' || seccion === 'conyuge') {
      return 'si-aplica';
    }
    if (seccion === 'autorizaciones') {
      const autorizaciones = [
        f.autorizacionCentralRiesgo, f.autorizacionTratamientoDatos,
        f.autorizacionDescuentoNomina, f.certificacionDestinoFondos
      ];
      const marcadas = autorizaciones.filter(valor => valor === true).length;
      return marcadas === 0 ? 'sin-diligenciar' : marcadas === autorizaciones.length ? 'completa' : 'pendiente';
    }
    if (seccion === 'firmas') {
      const requiereDeudores = this.deudoresSolidariosObligatorios();
      const firmas: boolean[] = [
        !!this.firmaSolicitanteFile, !!this.huellaSolicitanteFile, f.aceptaFirmaHuella === true
      ];
      if (requiereDeudores) {
        firmas.push(!!this.firmaDeudor1File, !!this.huellaDeudor1File);
      }
      const diligenciados = firmas.filter(valor => valor).length;
      return diligenciados === 0 ? 'sin-diligenciar' : diligenciados === firmas.length ? 'completa' : 'pendiente';
    }
    const campos = this.camposObligatoriosCredito.filter(campo => campo.seccion === seccion).map(campo => campo.campo);
    if (seccion === 'solicitud' && f.abonosExtraordinarios) {
      campos.push('detalleAbonosExtraordinarios');
    }
    if (seccion === 'referencias' && f.autorizaDesembolsoBancario) {
      campos.push('tipoCuentaBancaria', 'bancoSolicitante', 'numeroCuentaSolicitante');
    }
    if (seccion === 'deudor1') {
      campos.push('nombreCompletoDeudor1', 'numeroDocumentoDeudor1');
    }
    return this.estadoCamposObjeto(f, campos);
  }

  public cantidadSeccionesCreditoRequeridas() {
    return this.deudoresSolidariosObligatorios() ? 7 : 6;
  }

  public cantidadSeccionesCreditoCompletas() {
    const secciones = ['solicitud', 'solicitante', 'financiera', 'referencias', 'autorizaciones', 'firmas'];
    if (this.deudoresSolidariosObligatorios()) {
      secciones.push('deudor1');
    }
    return this.contarSeccionesCompletas(secciones, true);
  }

  public porcentajeProgresoCredito() {
    const requeridas = this.cantidadSeccionesCreditoRequeridas();
    if (requeridas <= 0) {
      return 0;
    }
    return Math.round((this.cantidadSeccionesCreditoCompletas() * 100) / requeridas);
  }

  private numeroCredito(valor: any) {
    if (this.estaVacio(valor)) {
      return 0;
    }
    const numero = Number(valor);
    return isNaN(numero) ? 0 : numero;
  }

  private textoCredito(valor: any) {
    if (valor === null || valor === undefined) {
      return '';
    }
    return String(valor).trim().toUpperCase();
  }

  public actualizarPatrimonioSolicitante() {
    this.formularioCredito.patrimonioSolicitante = this.calcularPatrimonio(this.formularioCredito.activosSolicitante, this.formularioCredito.pasivosSolicitante);
  }

  public actualizarPatrimonioDeudor1() {
    this.formularioCredito.patrimonioDeudor1 = this.calcularPatrimonio(this.formularioCredito.activosDeudor1, this.formularioCredito.pasivosDeudor1);
  }

  public abrirActualizacionDatosDesdeInicio() {
    this.clearError();
    this.intentoEnviarAfiliacion = false;
    this.modoCredito = false;
    this.mostrarFormularioCredito = false;
    this.validado = false;
    this.vista = null;
    const formulario = this.crearFormularioAfiliacion();
    formulario.tipoSolicitud = 'ACTUALIZACION_DATOS';

    if (this.documento) {
      formulario.codAfi = this.documento.toString().trim() as any;
    }
    if (this.fechaNacimiento) {
      formulario.fecNac = this.fechaParaInput(this.fechaNacimiento);
    }
    this.nuevoAfiliado = formulario;
    this.datosActualizacionCargados = false;
    this.cargandoDatosActualizacion = false;
    this.reiniciarSeccionesAfiliacion();
    this.seccionAfiliacionActiva = 'solicitud';
    this.mostrarFormularioAfiliado = true;
    this.irASeccionAfiliacion('solicitud');
  }

  public abrirSimuladorCredito() {
    this.invalidarSimulacion();
    this.configuracionSimulador = null;
    this.adminTab = 'simuladorCredito';
    this.clearError();
    this.errorSimulador = '';
    this._http.get(this.bridgeApiUrl + '/femprobien/simulador-credito/configuracion').subscribe(
      response => {
        this.configuracionSimulador = response.json();
        this.tasaSimuladorAdmin = this.configuracionSimulador.tasaMensual;
      }, error => {
        this.configuracionSimulador = null;
        this.errorSimulador = this.mensajeErrorSimulador(error);
      });
  }

  private mensajeErrorSimulador(error: any) {
    try {
      return error.json().message || 'No fue posible completar la operación del simulador.';
    } catch (e) {
      return 'No fue posible conectar con el simulador de FEMPROBIEN.';
    }
  }

  public invalidarSimulacion() {
    this.versionSolicitudSimulador++;
    this.resultadoSimulador = null;
    this.cargandoSimulador = false;
    this.errorSimulador = '';
  }

  public simularCredito() {
    if (this.cargandoSimulador || !this.configuracionSimulador) { return; }
    const monto = Number(this.simuladorCredito.monto);
    const plazo = Number(this.simuladorCredito.plazoMeses);
    if (!isFinite(monto) || monto <= 0 || !isFinite(plazo) || plazo <= 0 || plazo % 1 !== 0) {
      this.errorSimulador = 'Ingresa un monto positivo y un plazo entero en meses.';
      return;
    }
    this.errorSimulador = '';
    this.resultadoSimulador = null;
    this.cargandoSimulador = true;
    const version = ++this.versionSolicitudSimulador;

    this._http.post(this.bridgeApiUrl + '/femprobien/simulador-credito', { monto: monto, plazoMeses: plazo, frecuencia: this.simuladorCredito.frecuencia }).subscribe(
      response => {
        if (version !== this.versionSolicitudSimulador) { return; }
        this.resultadoSimulador = response.json();
        this.cargandoSimulador = false;
      }, error => {
        if (version !== this.versionSolicitudSimulador) { return; }
        this.cargandoSimulador = false;
        this.errorSimulador = this.mensajeErrorSimulador(error);
      });
  }

  public guardarTasaSimulador(confirmado?: boolean) {
    if (!this.isAdmin || this.guardandoTasaSimulador) { return; }
    const tasa = Number(this.tasaSimuladorAdmin);
    if (this.tasaSimuladorAdmin === null || this.tasaSimuladorAdmin === '' || !isFinite(tasa) || tasa < 0 || tasa > 100) {
      this.errorSimulador = 'Ingresa una tasa mensual entre 0 y 100 %.'; return;
    }
    if (!confirmado) {
      this.confirmarFemprobien('Confirmar cambio de tasa', '¿Deseas establecer la tasa en ' + tasa + ' % mensual?', 'Se guardará el cambio en la auditoría. Las solicitudes anteriores conservarán su tasa.', 'Guardar tasa', () => this.guardarTasaSimulador(true));
      return;
    }
    this.guardandoTasaSimulador = true;
    this.errorSimulador = '';
    this.mensajeTasaSimulador = '';

    this._http.put(this.bridgeApiUrl + '/femprobien/simulador-credito/configuracion', JSON.stringify({ tasaMensual: tasa }), this.opcionesAdministracionRoles()).subscribe(
      response => {
        this.guardandoTasaSimulador = false;
        this.configuracionSimulador = response.json();
        this.invalidarSimulacion();
        this.mensajeTasaSimulador = 'Tasa guardada. Las solicitudes anteriores conservan su tasa.';
        this.mostrarMensajeFemprobien('success', 'Tasa actualizada', this.mensajeTasaSimulador);
      }, error => {
        this.guardandoTasaSimulador = false;
        this.errorSimulador = this.mensajeErrorSimulador(error);
        this.mostrarMensajeFemprobien('error', 'No fue posible guardar la tasa', this.errorSimulador);
      });
  }

  public solicitarCreditoConSimulacion() {
    if (!this.resultadoSimulador || this.cargandoSimulador) { return; }
    this.simulacionPendiente = {
      monto: this.resultadoSimulador.monto, plazoMeses: this.resultadoSimulador.plazoMeses, frecuencia: this.resultadoSimulador.frecuencia,
      cuota: this.resultadoSimulador.cuota, tasaMensual: this.resultadoSimulador.tasaMensual,
      cantidadCuotas: this.resultadoSimulador.cantidadCuotas
    };
    this.adminTab = 'datosIngreso';
    this.mostrarFormularioAfiliado = false;
    this.clearError();
    if (this.validado && this.datosEmpleado && this.datosEmpleado.codAso) {
      this.abrirSolicitudCredito();
      this.aplicarSimulacionPendiente();
    }
  }

  private aplicarSimulacionPendiente() {
    if (!this.simulacionPendiente || !this.formularioCredito) { return; }
    const s = this.simulacionPendiente;
    this.formularioCredito.montoSolicitado = s.monto;
    this.formularioCredito.plazoMeses = s.plazoMeses;
    this.formularioCredito.formaDescuento = s.frecuencia === 'QUINCENAL' ? 'AMBAS' : 'Q2';
    this.formularioCredito.cantidadCuotas = s.cantidadCuotas;
    this.formularioCredito.valorCuota = s.cuota;
    this.formularioCredito.valorCreditoAutorizacion = s.monto;
    this.onChangeMontoSolicitado(s.monto);
    this.formularioCredito.condicionesCalculadas = s;
    this.simulacionPendiente = null;
  }

  public invalidarCondicionesCredito() {
    if (!this.formularioCredito) { return; }
    this.formularioCredito.condicionesCalculadas = null;
    this.formularioCredito.valorCuota = null;
    this.formularioCredito.cantidadCuotas = null;
    this.formularioCredito.valorCreditoAutorizacion = this.formularioCredito.montoSolicitado;
  }

  public actualizarCondicionesCredito() {
    if (this.cargandoCondicionesCredito || !this.formularioCredito) { return; }
    const f = this.formularioCredito;
    const monto = Number(f.montoSolicitado), meses = Number(f.plazoMeses);
    const forma = f.formaDescuento;
    if (!isFinite(monto) || monto <= 0 || !isFinite(meses) || meses <= 0 || meses % 1 !== 0 || !forma) {
      this.errorMessage = 'Completa monto, plazo y forma de descuento para calcular la cuota.'; return;
    }
    this.cargandoCondicionesCredito = true;

    this._http.post(this.bridgeApiUrl + '/femprobien/simulador-credito', { monto: monto, plazoMeses: meses, frecuencia: forma === 'AMBAS' ? 'QUINCENAL' : 'MENSUAL' }).subscribe(
      response => {
        this.cargandoCondicionesCredito = false;
        if (this.formularioCredito !== f || Number(f.montoSolicitado) !== monto || Number(f.plazoMeses) !== meses || f.formaDescuento !== forma) { return; }
        const r = response.json();
        f.condicionesCalculadas = r;
        f.valorCuota = r.cuota; f.cantidadCuotas = r.cantidadCuotas; f.valorCreditoAutorizacion = r.monto;
        this.successMessage = 'Cuota actualizada. Revisa el valor, número de cuotas y tasa antes de enviar la solicitud.';
      }, error => {
        this.cargandoCondicionesCredito = false;
        this.errorMessage = this.mensajeErrorSimulador(error);
      });
  }

  public solicitarCreditoDesdeInicio() {
    this.clearError();
    if (!this.documento || !this.fechaNacimiento) {
      this.errorMessage = 'Para solicitar un crédito debes ingresar el número de documento y la fecha de nacimiento.';
      return;
    }
    this.validarEmpleadoCredito();
  }

  private validarEmpleadoCredito() {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    const documento = this.documento ? this.documento.toString().trim() : '';
    const fechaNacimiento = this.fechaNacimiento ? this.fechaNacimiento.toString().trim() : '';

    this._employeeService.consultarAsociadoFemprobien(documento).subscribe(
      response => {
        this.loading = false;
        let registro: any = null;
        try {
          registro = response.json();
        } catch (e) {
          this.errorMessage = 'No fue posible interpretar la respuesta del servidor.';
          return;
        }
        const fechaBackend = registro && registro.fec_nac ? registro.fec_nac.toString().substring(0, 10) : '';
        const fechaIngresada = fechaNacimiento.substring(0, 10);
        if (!registro || registro.id_aso === null || registro.id_aso === undefined || !registro.cod_asp || !registro.nom_aso || fechaBackend !== fechaIngresada) {
          this.limpiarDatosAsociado();
          this.modoCredito = false;
          this.mostrarFormularioCredito = false;
          this.errorMessage = 'No se encontró un asociado con los datos ingresados. Si aún no perteneces al fondo puedes utilizar Nuevo Asociado.';
          return;
        }
        if (registro.activo === false || registro.activo === 0) {
          this.limpiarDatosAsociado();
          this.modoCredito = false;
          this.mostrarFormularioCredito = false;
          this.errorMessage = 'El asociado se encuentra inactivo y no puede solicitar un crédito.';
          return;
        }
        this.datosEmpleado = this.mapearAsociadoFemprobien(registro);
        this.validado = true;
        this.vista = null;
        this.datosAportes = null;
        this.loadingAportes = false;
        this.modoCredito = true;
        this.mostrarFormularioCredito = true;
        this.prepararFormularioCredito();
        this.aplicarSimulacionPendiente();
      }, error => {
        this.loading = false;
        this.limpiarDatosAsociado();
        this.modoCredito = false;
        this.mostrarFormularioCredito = false;
        if (error &&
          error.status === 404) {
          this.errorMessage = 'No se encontró un asociado con los datos ingresados. Si aún no perteneces al fondo puedes utilizar Nuevo Asociado.';
        } else {
          this.errorMessage = 'Ocurrió un error al validar los datos para la solicitud de crédito.';
        }
      });
  }

  public abrirSolicitudCredito() {
    this.clearError();
    this.intentoEnviarCredito = false;
    if (!this.validado || !this.datosEmpleado || !this.datosEmpleado.codAso) {
      this.errorMessage = 'Primero debes validar tus datos como asociado.';
      return;
    }
    this.modoCredito = true;
    this.mostrarFormularioCredito = true;
    this.datosAportes = null;
    this.loadingAportes = false;
    this.prepararFormularioCredito();
  }

  private prepararFormularioCredito() {
    this.formularioCredito = this.crearFormularioCredito();
    this.limpiarArchivosCredito();
    this.numeroSolicitudPendienteArchivos = null;
    this.cargarDatosAsociadoEnCredito();
  }

  private cargarDatosAsociadoEnCredito() {
    if (!this.datosEmpleado) {
      return;
    }
    const emp = this.datosEmpleado;
    this.formularioCredito.nombreCompletoSolicitante = (emp.nomAso || '').toString().replace(/\s+/g, ' ').trim();
    this.formularioCredito.numeroDocumentoSolicitante = emp.codAso ? emp.codAso.toString() : (this.documento ? this.documento.toString() : '');
    this.formularioCredito.tipoDocumentoSolicitante = emp.tipoDoc || emp.tipDoc || 'CC';
    this.formularioCredito.empresaGrupo = emp.nomEmp || emp.empresa || '';
    this.formularioCredito.profesionSolicitante = emp.profesion || '';
    this.formularioCredito.cargoSolicitante = emp.nomCar || emp.cargo || '';
    this.formularioCredito.telefonoOficinaSolicitante = emp.tel || emp.telefono || '';
    this.formularioCredito.antiguedadSolicitante = emp.antiguedad || '';
    this.formularioCredito.celularSolicitante = emp.telCel || emp.cel || '';
    this.formularioCredito.ciudadSolicitante = emp.nomBar || emp.ciudad || '';
    this.formularioCredito.emailPersonalSolicitante = emp.email || emp.eMail || '';
    this.formularioCredito.fechaNacimientoSolicitante = emp.fecNac || this.fechaNacimiento || '';
    this.formularioCredito.estadoCivilSolicitante = emp.estCiv || emp.est_civil || '';
    this.formularioCredito.direccionResidenciaSolicitante = emp.dirRes || emp.dir_res || '';
    this.formularioCredito.telefonoResidenciaSolicitante = emp.tel || emp.telefono || '';
    if (emp.salBas !== null && emp.salBas !== undefined) {
      this.formularioCredito.salarioSolicitante = emp.salBas;
    }
    this.formularioCredito.tipoCuentaBancaria = emp.ctaTipo || emp.tipoCuenta || '';
    this.formularioCredito.bancoSolicitante = emp.fdoBan || emp.banco || '';
    this.formularioCredito.numeroCuentaSolicitante = emp.ctaBan || emp.nCuenta || '';
    this.formularioCredito.empresaAutorizadaDescuento = this.formularioCredito.empresaGrupo;
  }

  public cancelarSolicitudCredito() {
    if (this.enviandoCredito) {
      return;
    }
    this.intentoEnviarCredito = false;
    this.modoCredito = false;
    this.mostrarFormularioCredito = false;
    this.enviandoCredito = false;
    this.formularioCredito = this.crearFormularioCredito();
    this.limpiarArchivosCredito();
    this.numeroSolicitudPendienteArchivos = null;
    this.limpiarDatosAsociado();
    this.documento = null;
    this.fechaNacimiento = '';
    this.mostrarFormularioAfiliado = false;
    this.nuevoAfiliado = this.crearFormularioAfiliacion();
    this.errorMessage = '';
    this.successMessage = '';
  }

  public limpiarFormularioCredito() {
    if (this.enviandoCredito) {
      return;
    }
    this.intentoEnviarCredito = false;
    this.prepararFormularioCredito();
    this.clearError();
  }

  public seleccionarArchivoCredito(event: any, tipo: string) {
    this.clearError();
    if (!event || !event.target || !event.target.files || event.target.files.length === 0) {
      return;
    }
    const archivo = event.target.files[0];
    const permitidos: string[] = [
      'image/png',
      'image/jpeg'
    ];
    if (permitidos.indexOf(archivo.type) === -1) {
      this.errorMessage = 'Solo se permiten imágenes PNG, JPG o JPEG.';
      event.target.value = '';
      return;
    }
    if (archivo.size > 3 * 1024 * 1024) {
      this.errorMessage = 'Cada archivo puede pesar máximo 3 MB.';
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const preview = e && e.target ? e.target.result : '';
      this.abrirRecorteBiometrico(tipo, preview);
    };
    reader.onerror = () => {
      this.errorMessage = 'No fue posible leer la imagen seleccionada.';
      event.target.value = '';
    };
    event.target.value = '';
    reader.readAsDataURL(archivo);
  }

  private abrirRecorteBiometrico(tipo: string, preview: string) {
    this.tipoRecorteBiometrico = tipo;
    this.recorteBiometricoEsHuella = tipo.indexOf('huella') === 0;
    this.tituloRecorteBiometrico = this.recorteBiometricoEsHuella ? 'Ajustar huella' : 'Ajustar firma';
    this.mensajeRecorteBiometrico = this.recorteBiometricoEsHuella ? 'Ubica únicamente la huella dentro del recuadro. Evita incluir demasiado papel o elementos alrededor.' : 'Ubica únicamente la firma dentro del recuadro horizontal. Evita incluir toda la hoja, líneas o márgenes innecesarios.';
    this.tamanoRecorteBiometrico = this.recorteBiometricoEsHuella ? 55 : 70;
    this.mostrarModalRecorteBiometrico = true;
    const imagen = new Image();
    imagen.onload = () => {
      this.imagenRecorteObjeto = imagen;
      setTimeout(() => {
        this.inicializarCanvasRecorteBiometrico();
      }, 0);
    };
    imagen.onerror = () => {
      this.cancelarRecorteBiometrico();
      this.errorMessage = 'No fue posible abrir la imagen seleccionada.';
    };
    imagen.src = preview;
  }

  public ajustarArchivoCredito(tipo: string) {
    if (this.tiposArchivoCredito.indexOf(tipo) === -1) {
      return;
    }
    const archivo = (this as any)[tipo + 'File'];
    const preview = (this as any)[tipo + 'Preview'];
    if (!archivo || !preview) {
      return;
    }
    this.abrirRecorteBiometrico(tipo, preview);
  }

  private inicializarCanvasRecorteBiometrico() {
    const canvas: any = document.getElementById('canvasRecorteBiometrico');
    if (!canvas || !this.imagenRecorteObjeto) {
      return;
    }
    this.canvasRecorteBiometrico = canvas;
    this.contextoRecorteBiometrico = canvas.getContext('2d');
    const anchoCanvas = canvas.width;
    const altoCanvas = canvas.height;
    const anchoImagen = this.imagenRecorteObjeto.naturalWidth || this.imagenRecorteObjeto.width;
    const altoImagen = this.imagenRecorteObjeto.naturalHeight || this.imagenRecorteObjeto.height;
    if (!anchoImagen || !altoImagen) {
      this.errorMessage = 'La imagen seleccionada tiene dimensiones inválidas.';
      this.cancelarRecorteBiometrico();
      return;
    }
    const escala = Math.min(anchoCanvas / anchoImagen, altoCanvas / altoImagen);
    this.imagenRecorteWidth = anchoImagen * escala;
    this.imagenRecorteHeight = altoImagen * escala;
    this.imagenRecorteX = (anchoCanvas - this.imagenRecorteWidth) / 2;
    this.imagenRecorteY = (altoCanvas - this.imagenRecorteHeight) / 2;
    this.actualizarDimensionesRecorteBiometrico(true);
  }

  public cambiarTamanoRecorteBiometrico() {
    this.actualizarDimensionesRecorteBiometrico(false);
  }

  private actualizarDimensionesRecorteBiometrico(centrar: boolean) {
    if (!this.canvasRecorteBiometrico) {
      return;
    }
    const porcentaje = Math.max(25, Math.min(95, Number(this.tamanoRecorteBiometrico) || 70)) / 100;
    let ancho = this.imagenRecorteWidth * porcentaje;
    let alto;
    if (this.recorteBiometricoEsHuella) {
      ancho = Math.min(ancho, this.imagenRecorteHeight * porcentaje);
      alto = ancho;
    } else {
      alto = ancho / 3;
      if (alto > this.imagenRecorteHeight * 0.90) {
        alto = this.imagenRecorteHeight * 0.90;
        ancho = alto * 3;
      }
    }
    const centroXAnterior = this.recorteX + this.recorteWidth / 2;
    const centroYAnterior = this.recorteY + this.recorteHeight / 2;
    this.recorteWidth = ancho;
    this.recorteHeight = alto;
    if (centrar) {
      this.recorteX = this.imagenRecorteX +
        (this.imagenRecorteWidth - this.recorteWidth) / 2;
      this.recorteY = this.imagenRecorteY +
        (this.imagenRecorteHeight - this.recorteHeight) / 2;
    } else {
      this.recorteX = centroXAnterior - this.recorteWidth / 2;
      this.recorteY = centroYAnterior - this.recorteHeight / 2;
    }
    this.limitarRecorteBiometrico();
    this.dibujarRecorteBiometrico();
  }

  private limitarRecorteBiometrico() {
    const minX = this.imagenRecorteX;
    const minY = this.imagenRecorteY;
    const maxX = this.imagenRecorteX + this.imagenRecorteWidth - this.recorteWidth;
    const maxY = this.imagenRecorteY + this.imagenRecorteHeight - this.recorteHeight;
    this.recorteX = Math.max(minX, Math.min(maxX, this.recorteX));
    this.recorteY = Math.max(minY, Math.min(maxY, this.recorteY));
  }

  private dibujarRecorteBiometrico() {
    if (!this.canvasRecorteBiometrico || !this.contextoRecorteBiometrico || !this.imagenRecorteObjeto) {
      return;
    }
    const canvas = this.canvasRecorteBiometrico;
    const ctx = this.contextoRecorteBiometrico;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1f2328';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.imagenRecorteObjeto, this.imagenRecorteX, this.imagenRecorteY, this.imagenRecorteWidth, this.imagenRecorteHeight);
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.clearRect(this.recorteX, this.recorteY, this.recorteWidth, this.recorteHeight);
    ctx.drawImage(this.imagenRecorteObjeto, (this.recorteX - this.imagenRecorteX) / this.imagenRecorteWidth * (this.imagenRecorteObjeto.naturalWidth || this.imagenRecorteObjeto.width), (this.recorteY - this.imagenRecorteY) / this.imagenRecorteHeight *
      (this.imagenRecorteObjeto.naturalHeight || this.imagenRecorteObjeto.height), this.recorteWidth / this.imagenRecorteWidth *
    (this.imagenRecorteObjeto.naturalWidth || this.imagenRecorteObjeto.width), this.recorteHeight / this.imagenRecorteHeight *
    (this.imagenRecorteObjeto.naturalHeight || this.imagenRecorteObjeto.height), this.recorteX, this.recorteY, this.recorteWidth, this.recorteHeight);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.recorteX, this.recorteY, this.recorteWidth, this.recorteHeight);
    ctx.strokeStyle = '#2a78b8';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.recorteX + 4, this.recorteY + 4, this.recorteWidth - 8, this.recorteHeight - 8);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 2; i++) {
      const gx = this.recorteX + this.recorteWidth * i / 3;
      const gy = this.recorteY + this.recorteHeight * i / 3;
      ctx.beginPath();
      ctx.moveTo(gx, this.recorteY);
      ctx.lineTo(gx, this.recorteY + this.recorteHeight);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.recorteX, gy);
      ctx.lineTo(this.recorteX + this.recorteWidth, gy);
      ctx.stroke();
    }
    ctx.restore();
  }

  public iniciarMovimientoRecorteBiometrico(event: any) {
    const punto = this.obtenerPuntoCanvasRecorte(event);
    if (!punto) {
      return;
    }
    const dentro = punto.x >= this.recorteX &&
      punto.x <= this.recorteX +
      this.recorteWidth &&
      punto.y >= this.recorteY &&
      punto.y <= this.recorteY +
      this.recorteHeight;
    if (!dentro) {
      return;
    }
    this.arrastrandoRecorteBiometrico = true;
    this.offsetRecorteX = punto.x -
      this.recorteX;
    this.offsetRecorteY = punto.y -
      this.recorteY;
    if (event &&
      event.preventDefault) {
      event.preventDefault();
    }
  }

  public moverRecorteBiometrico(event: any) {
    if (!this.arrastrandoRecorteBiometrico) {
      return;
    }
    const punto = this.obtenerPuntoCanvasRecorte(event);
    if (!punto) {
      return;
    }
    this.recorteX = punto.x -
      this.offsetRecorteX;
    this.recorteY = punto.y -
      this.offsetRecorteY;
    this.limitarRecorteBiometrico();
    this.dibujarRecorteBiometrico();
    if (event &&
      event.preventDefault) {
      event.preventDefault();
    }
  }

  public finalizarMovimientoRecorteBiometrico() {
    this.arrastrandoRecorteBiometrico = false;
  }

  private obtenerPuntoCanvasRecorte(event: any) {
    if (!this.canvasRecorteBiometrico) {
      return null;
    }
    const rect = this.canvasRecorteBiometrico.getBoundingClientRect();
    let clientX;
    let clientY;
    if (event &&
      event.touches &&
      event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    }
    else if (event &&
      event.changedTouches &&
      event.changedTouches.length > 0) {
      clientX = event.changedTouches[0].clientX;
      clientY = event.changedTouches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    return {
      x: (clientX -
        rect.left) *
        this.canvasRecorteBiometrico.width /
        rect.width,
      y: (clientY -
        rect.top) *
        this.canvasRecorteBiometrico.height /
        rect.height
    };
  }

  public confirmarRecorteBiometrico() {
    if (!this.imagenRecorteObjeto || !this.canvasRecorteBiometrico || !this.tipoRecorteBiometrico) {
      this.errorMessage = 'No fue posible preparar el recorte biométrico.';
      return;
    }
    this.procesandoRecorteBiometrico = true;
    try {
      const anchoOriginal = this.imagenRecorteObjeto.naturalWidth || this.imagenRecorteObjeto.width;
      const altoOriginal = this.imagenRecorteObjeto.naturalHeight || this.imagenRecorteObjeto.height;
      const sx = (this.recorteX -
        this.imagenRecorteX) /
        this.imagenRecorteWidth *
        anchoOriginal;
      const sy = (this.recorteY -
        this.imagenRecorteY) /
        this.imagenRecorteHeight *
        altoOriginal;
      const sw = this.recorteWidth /
        this.imagenRecorteWidth *
        anchoOriginal;
      const sh = this.recorteHeight /
        this.imagenRecorteHeight *
        altoOriginal;
      const anchoSalida = this.recorteBiometricoEsHuella ? 600 : 900;
      const altoSalida = this.recorteBiometricoEsHuella ? 600 : 300;
      const canvasSalida: any = document.createElement('canvas');
      canvasSalida.width = anchoSalida;
      canvasSalida.height = altoSalida;
      const ctx = canvasSalida.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, anchoSalida, altoSalida);
      ctx.imageSmoothingEnabled = true;
      try {
        ctx.imageSmoothingQuality = 'high';
      } catch (e) { }
      ctx.drawImage(this.imagenRecorteObjeto, sx, sy, sw, sh, 0, 0, anchoSalida, altoSalida);
      const dataUrl = canvasSalida.toDataURL('image/png', 1.0);
      const nombre = this.crearNombreArchivoRecortado(this.tipoRecorteBiometrico);
      const archivoRecortado = this.dataUrlAArchivo(dataUrl, nombre);
      this.asignarArchivoCredito(this.tipoRecorteBiometrico, archivoRecortado, dataUrl);
      this.cancelarRecorteBiometrico();
    } catch (e) {
      this.errorMessage = 'No fue posible procesar el recorte. Intenta nuevamente.';
      this.procesandoRecorteBiometrico = false;
    }
  }

  private crearNombreArchivoRecortado(tipo: string) {
    return tipo + '_recortado_' + new Date().getTime() + '.png';
  }

  private dataUrlAArchivo(dataUrl: string, nombre: string) {
    const partes = dataUrl.split(',');
    const mimeMatch = partes[0].match(/:(.*?);/);
    const mime = mimeMatch && mimeMatch.length > 1 ? mimeMatch[1] : 'image/png';
    const binario = atob(partes[1]);
    const longitud = binario.length;
    const bytes = new Uint8Array(longitud);
    for (let i = 0; i < longitud; i++) {
      bytes[i] = binario.charCodeAt(i);
    }
    return new File([bytes], nombre, {
      type: mime
    });
  }

  public cancelarRecorteBiometrico() {
    this.mostrarModalRecorteBiometrico = false;
    this.tipoRecorteBiometrico = '';
    this.tituloRecorteBiometrico = '';
    this.mensajeRecorteBiometrico = '';
    this.recorteBiometricoEsHuella = false;
    this.procesandoRecorteBiometrico = false;
    this.imagenRecorteObjeto = null;
    this.canvasRecorteBiometrico = null;
    this.contextoRecorteBiometrico = null;
    this.arrastrandoRecorteBiometrico = false;
  }

  private asignarArchivoCredito(tipo: string, archivo: any, preview: string) {
    if (this.tiposArchivoCredito.indexOf(tipo) === -1) {
      return;
    }
    (this as any)[tipo + 'File'] = archivo;
    (this as any)[tipo + 'Preview'] = preview;
  }

  public deudoresSolidariosObligatorios() {
    if (!this.formularioCredito) {
      return false;
    }
    return this.numeroCredito(this.formularioCredito.montoSolicitado) >= this.MONTO_MINIMO_DEUDOR_SOLIDARIO;
  }

  public onChangeMontoSolicitado(valor: any) {
    if (!this.formularioCredito) {
      return;
    }
    const monto = this.numeroCredito(valor);
    if (monto >= this.MONTO_MINIMO_DEUDOR_SOLIDARIO) {
      this.formularioCredito.requiereDeudor1 = true;
      if (this.estaVacio(this.formularioCredito.tipoDocumentoDeudor1)) {
        this.formularioCredito.tipoDocumentoDeudor1 = 'CC';
      }
      this.seccionesCreditoAbiertas.deudor1 = true;
      return;
    }
    this.formularioCredito.requiereDeudor1 = false;
    this.seccionesCreditoAbiertas.deudor1 = false;
    this.limpiarDatosDeudoresSolidarios();
  }

  private limpiarDatosDeudoresSolidarios() {
    if (!this.formularioCredito) {
      return;
    }
    const f = this.formularioCredito;
    f.requiereDeudor1 = false;
    const valores = this.crearDatosDeudorCredito('');
    Object.keys(valores).forEach(campo => f[campo] = valores[campo]);
    this.eliminarArchivoCredito('firmaDeudor1');
    this.eliminarArchivoCredito('huellaDeudor1');
  }

  private validarDatosDeudoresSolidarios() {
    if (!this.deudoresSolidariosObligatorios()) {
      return true;
    }
    const f = this.formularioCredito;
    const documentoSolicitante = this.textoCredito(f.numeroDocumentoSolicitante);
    const documentoDeudor = this.textoCredito(f.numeroDocumentoDeudor1);
    if (this.estaVacio(f.nombreCompletoDeudor1) || this.estaVacio(documentoDeudor)) {
      this.errorMessage = 'Para créditos iguales o superiores a $10.000.000 debes diligenciar el nombre y documento del deudor solidario.';
      this.seccionesCreditoAbiertas.deudor1 = true;
      return false;
    }
    if (documentoSolicitante === documentoDeudor) {
      this.errorMessage = 'El deudor solidario no puede ser el mismo solicitante.';
      this.seccionesCreditoAbiertas.deudor1 = true;
      return false;
    }
    return true;
  }

  public eliminarArchivoCredito(tipo: string) {
    this.asignarArchivoCredito(tipo, null, '');
  }

  private limpiarArchivosCredito() {
    this.cancelarRecorteBiometrico();
    for (let i = 0; i < this.tiposArchivoCredito.length; i++) {
      this.eliminarArchivoCredito(this.tiposArchivoCredito[i]);
    }
  }

  private validarArchivosFirmaHuella() {
    const f = this.formularioCredito;
    if (!this.firmaSolicitanteFile || !this.huellaSolicitanteFile) {
      this.errorMessage = 'Debes adjuntar firma y huella del solicitante.';
      this.seccionesCreditoAbiertas.firmas = true;
      return false;
    }
    if (this.deudoresSolidariosObligatorios() && (!this.firmaDeudor1File || !this.huellaDeudor1File)) {
      this.errorMessage = 'Debes adjuntar firma y huella del deudor solidario.';
      this.seccionesCreditoAbiertas.firmas = true;
      return false;
    }
    if (!f.aceptaFirmaHuella) {
      this.errorMessage = 'Debes confirmar la autorización de firma y huella.';
      this.seccionesCreditoAbiertas.firmas = true;
      return false;
    }
    return true;
  }

  public reintentarSubidaArchivosCredito() {
    if (!this.numeroSolicitudPendienteArchivos) {
      return;
    }
    if (!this.validarArchivosFirmaHuella()) {
      return;
    }
    this.subirArchivosCredito(this.numeroSolicitudPendienteArchivos);
  }

  private subirArchivosCredito(numeroSolicitud: number) {
    const formData = new FormData();
    formData.append('firmaSolicitante', this.firmaSolicitanteFile, this.firmaSolicitanteFile.name);
    formData.append('huellaSolicitante', this.huellaSolicitanteFile, this.huellaSolicitanteFile.name);
    if (this.deudoresSolidariosObligatorios()) {
      formData.append('firmaDeudor1', this.firmaDeudor1File, this.firmaDeudor1File.name);
      formData.append('huellaDeudor1', this.huellaDeudor1File, this.huellaDeudor1File.name);
    }
    const usuario = this.identity && this.identity.username ? this.identity.username : '';
    formData.append('usuario', usuario);
    const url = this.bridgeApiUrl +
      '/femprobien/creditos/solicitudes/' +
      encodeURIComponent(numeroSolicitud.toString()) +
      '/archivos';
    this.subiendoArchivosCredito = true;
    this.enviandoCredito = true;

    this._http.post(url, formData).subscribe(
      response => {
        this.subiendoArchivosCredito = false;
        this.enviandoCredito = false;
        const data = response.json();
        if (data && data.status === 200) {
          this.finalizarSolicitudCreditoExitosa(numeroSolicitud);
        }
        else {
          this.numeroSolicitudPendienteArchivos = numeroSolicitud;
          this.errorMessage = data && data.message ? data.message : 'La solicitud fue creada, pero no se pudieron cargar firma y huella.';
        }
      }, error => {
        this.subiendoArchivosCredito = false;
        this.enviandoCredito = false;
        this.numeroSolicitudPendienteArchivos = numeroSolicitud;
        this.seccionesCreditoAbiertas.firmas = true;
        let mensaje = 'No fue posible cargar firma y huella.';
        if (error &&
          error._body) {
          try {
            const body = JSON.parse(error._body);
            if (body && body.message) {
              mensaje = body.message;
            }
            if (body && body.numero_solicitud) { }
            if (body && body.tipo) { }
          } catch (e) {
            mensaje = error._body;
          }
        }
        this.errorMessage = 'La solicitud #' + numeroSolicitud + ' ya fue creada, pero la carga de firma y huella falló. ' + mensaje;
      });
  }

  private finalizarSolicitudCreditoExitosa(numeroSolicitud: number) {
    this.intentoEnviarCredito = false;
    this.successMessage = 'Su solicitud de crédito fue enviada con éxito.';
    this.numeroSolicitudPendienteArchivos = null;
    this.limpiarArchivosCredito();
    this.modoCredito = false;
    this.mostrarFormularioCredito = false;
    this.formularioCredito = this.crearFormularioCredito();
    this.limpiarDatosAsociado();
    this.documento = null;
    this.fechaNacimiento = '';
  }

  private mapearDatosPersonaCredito(formulario: any, persona: 'Solicitante' | 'Deudor1') {
    const numericos = [
      'salario', 'otrosIngresos', 'egresos', 'activos', 'pasivos', 'patrimonio',
      'numeroHijos', 'estrato', 'valorArriendo', 'valorComercialBien', 'valorHipoteca', 'valorComercialVehiculo'
    ];
    const textos = [
      'nombreCompleto', 'tipoDocumento', 'numeroDocumento',
      'profesion', 'cargo', 'antiguedad',
      'estadoCivil', 'direccionResidencia', 'telefonoResidencia',
      'tipoVivienda', 'otraVivienda', 'tiempoResidencia',
      'nombreReferenciaFamiliar', 'parentescoReferenciaFamiliar', 'direccionReferenciaFamiliar',
      'telefonoReferenciaFamiliar', 'nombreReferenciaPersonal', 'parentescoReferenciaPersonal',
      'direccionReferenciaPersonal', 'telefonoReferenciaPersonal', 'tipoBien',
      'direccionBien', 'matriculaInmobiliaria', 'ciudadBien',
      'hipotecaAFavorDe', 'modeloVehiculo', 'placaVehiculo',
      'marcaVehiculo', 'tipoServicioVehiculo'
    ];
    const sufijo = persona === 'Solicitante' ? 'solicitante' : 'deudor1';
    const datos: any = {};
    numericos.concat(textos).forEach(campo => {
      const nombre = campo.replace(/[A-Z]/g, letra => '_' + letra.toLowerCase());
      const valor = formulario[campo + persona];
      datos[nombre + '_' + sufijo] = numericos.indexOf(campo) >= 0 ? this.numeroCredito(valor) : this.textoCredito(valor);
    });
    datos['fecha_nacimiento_' + sufijo] = formulario['fechaNacimiento' + persona] || null;
    datos['patrimonio_familia_' + sufijo] = !!formulario['patrimonioFamilia' + persona];
    datos['vehiculo_pignorado_' + sufijo] = !!formulario['vehiculoPignorado' + persona];
    return datos;
  }

  private crearCamposCompatibilidadDeudor(datos: any) {
    const vacios: any = {};
    Object.keys(datos).forEach(campo => {
      if (!/_deudor1$/.test(campo)) { return; }
      const valor = datos[campo];
      vacios[campo.replace(/1$/, '2')] = campo === 'fecha_nacimiento_deudor1' ? null :
        typeof valor === 'number' ? 0 : typeof valor === 'boolean' ? false : '';
    });
    return vacios;
  }

  public guardarSolicitudCredito(confirmado?: boolean) {
    if (this.enviandoCredito) { return; }
    this.clearError();
    this.intentoEnviarCredito = true;
    if (!this.datosEmpleado || !this.datosEmpleado.codAso) {
      this.errorMessage = 'No se encontró el asociado.';
      return;
    }
    if (this.numeroSolicitudPendienteArchivos) {
      this.errorMessage = 'La solicitud #' + this.numeroSolicitudPendienteArchivos +
        ' ya fue creada. Usa Reintentar carga en la sección Firma y Huella.';
      this.seccionesCreditoAbiertas.firmas = true;
      return;
    }
    const f = this.formularioCredito;
    this.onChangeMontoSolicitado(f.montoSolicitado);
    const faltantes = this.camposObligatoriosCredito
      .filter(campo => this.estaVacio(f[campo.campo]))
      .map(campo => campo.nombre);
    if (faltantes.length > 0) {
      this.errorMessage = 'Faltan por diligenciar: ' + faltantes.join(', ') + '.';
      return;
    }
    if (this.numeroCredito(f.montoSolicitado) <= 0) {
      this.errorMessage = 'El monto solicitado debe ser mayor que cero.';
      return;
    }
    if (this.numeroCredito(f.plazoMeses) <= 0) {
      this.errorMessage = 'El plazo debe ser mayor que cero.';
      return;
    }
    if (f.abonosExtraordinarios &&
      this.estaVacio(f.detalleAbonosExtraordinarios)) {
      this.errorMessage = 'Debes indicar cómo realizarás los abonos extraordinarios.';
      return;
    }
    if (f.tipoViviendaSolicitante === 'OTRA' &&
      this.estaVacio(f.otraViviendaSolicitante)) {
      this.errorMessage = 'Debes indicar cuál es el otro tipo de vivienda.';
      return;
    }
    if (f.autorizaDesembolsoBancario &&
      (this.estaVacio(f.tipoCuentaBancaria) || this.estaVacio(f.bancoSolicitante) || this.estaVacio(f.numeroCuentaSolicitante))) {
      this.errorMessage = 'Para autorizar el desembolso debes completar tipo de cuenta, banco y número de cuenta.';
      return;
    }
    if (!f.autorizacionCentralRiesgo || !f.autorizacionTratamientoDatos || !f.autorizacionDescuentoNomina || !f.certificacionDestinoFondos) {
      this.errorMessage = 'Debes aceptar las cuatro autorizaciones del formato.';
      return;
    }
    if (!this.validarDatosDeudoresSolidarios()) {
      return;
    }
    if (this.cargandoCondicionesCredito) { return; }
    const condiciones = f.condicionesCalculadas;
    if (!condiciones || Number(condiciones.monto) !== Number(f.montoSolicitado) || Number(condiciones.plazoMeses) !== Number(f.plazoMeses) || condiciones.frecuencia !== (f.formaDescuento === 'AMBAS' ? 'QUINCENAL' : 'MENSUAL')) {
      this.actualizarCondicionesCredito();
      return;
    }
    if (!this.validarArchivosFirmaHuella()) {
      return;
    }
    this.actualizarPatrimonioSolicitante();
    this.actualizarPatrimonioDeudor1();
    if (this.estaVacio(f.valorCreditoAutorizacion)) {
      f.valorCreditoAutorizacion = f.montoSolicitado;
    }
    if (this.estaVacio(f.cantidadCuotas)) {
      f.cantidadCuotas = f.plazoMeses * (f.formaDescuento === 'AMBAS' ? 2 : 1);
    }
    if (this.estaVacio(f.empresaAutorizadaDescuento)) {
      f.empresaAutorizadaDescuento = f.empresaGrupo;
    }
    const body: any = {
      tasa_confirmada: f.condicionesCalculadas.tasaMensual, empresa_grupo: this.textoCredito(f.empresaGrupo),
      monto_solicitado: this.numeroCredito(f.montoSolicitado), monto_solicitado_letras: this.textoCredito(f.montoSolicitadoLetras),
      plazo_meses: this.numeroCredito(f.plazoMeses), abonos_extraordinarios: !!f.abonosExtraordinarios,
      detalle_abonos_extraordinarios: this.textoCredito(f.detalleAbonosExtraordinarios),
      destino_credito: this.textoCredito(f.destinoCredito), descuento_primera_quincena: f.formaDescuento === 'Q1',
      descuento_segunda_quincena: f.formaDescuento === 'Q2', descuento_ambas_quincenas: f.formaDescuento === 'AMBAS',
      telefono_oficina_solicitante: this.textoCredito(f.telefonoOficinaSolicitante),
      celular_solicitante: this.textoCredito(f.celularSolicitante), ciudad_solicitante: this.textoCredito(f.ciudadSolicitante),
      email_personal_solicitante: f.emailPersonalSolicitante ? String(f.emailPersonalSolicitante).trim() : '',
      descripcion_otros_ingresos_solicitante: this.textoCredito(f.descripcionOtrosIngresosSolicitante),
      autoriza_desembolso_bancario_solicitante: !!f.autorizaDesembolsoBancario,
      tipo_cuenta_bancaria_solicitante: this.textoCredito(f.tipoCuentaBancaria), banco_solicitante: this.textoCredito(f.bancoSolicitante),
      numero_cuenta_solicitante: this.textoCredito(f.numeroCuentaSolicitante),
      nombre_completo_conyuge: this.textoCredito(f.nombreCompletoConyuge), tipo_documento_conyuge: this.textoCredito(f.tipoDocumentoConyuge),
      numero_documento_conyuge: this.textoCredito(f.numeroDocumentoConyuge), fecha_nacimiento_conyuge: f.fechaNacimientoConyuge || null,
      actividad_conyuge: this.textoCredito(f.actividadConyuge), empresa_conyuge: this.textoCredito(f.empresaConyuge),
      telefono_conyuge: this.textoCredito(f.telefonoConyuge), antiguedad_conyuge: this.textoCredito(f.antiguedadConyuge),
      ingresos_conyuge: this.numeroCredito(f.ingresosConyuge), autorizacion_central_riesgo: !!f.autorizacionCentralRiesgo,
      autorizacion_tratamiento_datos: !!f.autorizacionTratamientoDatos, certificacion_destino_fondos: !!f.certificacionDestinoFondos,
      autorizacion_descuento_nomina: !!f.autorizacionDescuentoNomina,
      valor_credito_autorizacion: this.numeroCredito(f.valorCreditoAutorizacion), cantidad_cuotas: this.numeroCredito(f.cantidadCuotas),
      valor_cuota: this.numeroCredito(f.valorCuota), empresa_autorizada_descuento: this.textoCredito(f.empresaAutorizadaDescuento),
      tipo_cuenta_descuento: this.textoCredito(f.tipoCuentaDescuento), numero_cuenta_descuento: this.textoCredito(f.numeroCuentaDescuento),
      banco_descuento: this.textoCredito(f.bancoDescuento), empresa_deudor1: this.textoCredito(f.empresaDeudor1),
      direccion_oficina_deudor1: this.textoCredito(f.direccionOficinaDeudor1), telefono_deudor1: this.textoCredito(f.telefonoDeudor1),
    };
    Object.assign(body, this.mapearDatosPersonaCredito(f, 'Solicitante'), this.mapearDatosPersonaCredito(f, 'Deudor1'));
    Object.assign(body, this.crearCamposCompatibilidadDeudor(body), {
      usuario: this.identity && this.identity.username ? this.identity.username : ''
    });
    const codAsp = this.datosEmpleado.codAso.toString();
    const url = this.bridgeApiUrl + '/femprobien/creditos/asociados/' + encodeURIComponent(codAsp) + '/solicitudes';
    if (!confirmado) {
      this.confirmarFemprobien('Enviar solicitud de crédito', '¿Deseas enviar esta solicitud de crédito?', 'Revisa que el monto, plazo, cuotas y documentos sean correctos.', 'Enviar solicitud', () => this.guardarSolicitudCredito(true));
      return;
    }
    this.enviandoCredito = true;

    const formData = new FormData();
    formData.append('datos', new Blob([JSON.stringify(body)], { type: 'application/json' }), 'datos.json');
    formData.append('firmaSolicitante', this.firmaSolicitanteFile, this.firmaSolicitanteFile.name);
    formData.append('huellaSolicitante', this.huellaSolicitanteFile, this.huellaSolicitanteFile.name);
    if (this.deudoresSolidariosObligatorios()) {
      formData.append('firmaDeudor1', this.firmaDeudor1File, this.firmaDeudor1File.name);
      formData.append('huellaDeudor1', this.huellaDeudor1File, this.huellaDeudor1File.name);
    }
    this._http.post(url, formData).subscribe(
      response => {
        this.enviandoCredito = false;
        const data = response.json();
        if (data && data.status === 201) {
          this.finalizarSolicitudCreditoExitosa(data.numero_solicitud);
        }
        else {
          this.errorMessage = data && data.message ? data.message : 'No fue posible crear la solicitud de crédito.';
        }
      }, error => {
        this.enviandoCredito = false;

        this.errorMessage = this.obtenerMensajeErrorCredito(error, 'Error creando la solicitud de crédito.');
      });
  }

  private cargarEmpleadosAfiliados() {
    this._employeeService.loadAffiliatedEmployees().subscribe(
      response => {
        if (response && response.code === 0 && Array.isArray(response.content)) {
          this.empleados = response.content;
          this.empleadosFiltrados = [];
        }
        else {
          this.empleados = [];
          this.empleadosFiltrados = [];
        }
      }, error => {
        this.empleados = [];
        this.empleadosFiltrados = [];
      });
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
      return (emp.nomAso ? String(emp.nomAso).toLowerCase().indexOf(q) !== -1 : false) || (emp.codAso ? String(emp.codAso).indexOf(q) !== -1 : false);
    });
  }

  public editarEmpleado(emp: any) {
    this.nuevoAfiliado = emp;
    this.mostrarFormularioAfiliado = true;
    this.filtroBusqueda = emp.nomAso || '';
    this.empleadosFiltrados = [];
    this.buscadorInhabilitado = true;
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

  public loadSolicitudesAfiliacion() {
    if (!this.puedeAprobarSolicitudes) {
      this.solicitudesAfiliacion = [];
      this.accionesEnProgreso = [];
      this.loadingSolicitudes = false;
      return;
    }
    this.loadingSolicitudes = true;
    this.errorMessage = '';
    this._employeeService.consultarSolicitudesAfiliacion().subscribe(
      response => {
        this.loadingSolicitudes = false;
        let solicitudes: any[] = [];
        try {
          const data = response.json();
          solicitudes = Array.isArray(data) ? data : [];
        } catch (e) {
          this.solicitudesAfiliacion = [];
          this.accionesEnProgreso = [];
          this.errorMessage = 'La respuesta del servidor no tiene el formato esperado.';
          return;
        }
        this.solicitudesAfiliacion = solicitudes.map((s: any, indiceOriginal: number) => Object.assign(this._employeeService.mapearCamposAfiliacion(s), {
          indiceOriginal: indiceOriginal, ocuConyuge: s.ocu_conyuge, tipoDocConyuge: s.tipo_doc_conyuge, docConyuge: s.doc_conyuge,
          bienRaices: s.bien_raices ? 'SI' : 'NO', bienesDir: s.bienes_dir, marcaVeh: s.marca_veh, modeloVeh: s.modelo_veh,
          codBen1: s.ben_doc1, nomBen1: s.ben_nom1, parBen1: s.parentesco1, codBen2: s.ben_doc2, nomBen2: s.ben_nom2, parBen2: s.parentesco2,
          codBen3: s.ben_doc3, nomBen3: s.ben_nom3, parBen3: s.parentesco3, creadoPor: s.creado_por, fecha: s.fecha_solicitud,
          status: s.estado, cambios: this.mapearCambiosSolicitud(Array.isArray(s.cambios) ? s.cambios : []), mostrarCambios: false,
          mostrarDetalle: false
        }));
        this.accionesEnProgreso = this.solicitudesAfiliacion.map(() => false);
        this.cantidadSolicitudesAfiliacionPendientes = this.solicitudesAfiliacion.filter((solicitud: any) => solicitud.status === 'PENDIENTE').length;
      }, error => {
        this.loadingSolicitudes = false;
        this.solicitudesAfiliacion = [];
        this.accionesEnProgreso = [];

        this.errorMessage = this.obtenerMensajeErrorCredito(error, 'Ocurrió un error al cargar las solicitudes de afiliación.');
      });
  }

  private mapearCambiosSolicitud(cambios: any[]) {
    if (!Array.isArray(cambios)) {
      return [];
    }
    return cambios.map((cambio: any) => ({
      id: cambio.id,
      campo: cambio.campo || '',
      etiqueta: this.obtenerEtiquetaCampoCambio(cambio.campo),
      valorAnterior: this.formatearValorCambio(cambio.campo, cambio.valor_anterior),
      valorNuevo: this.formatearValorCambio(cambio.campo, cambio.valor_nuevo)
    }));
  }

  private obtenerEtiquetaCampoCambio(campo: string) {
    const etiquetas: any = {
      nom_aso: 'Nombre completo', forma_desc: 'Forma de descuento', cant_porcen: 'Ahorro mensual', porcen_ahorro: 'Porcentaje de ahorro',
      tipo_documento: 'Tipo de documento', est_civil: 'Estado civil', fec_nac: 'Fecha de nacimiento', fec_exp: 'Fecha de expedición',
      lugar_exp: 'Lugar de expedición', email_per: 'Correo electrónico', dir_res: 'Dirección de residencia', nom_bar: 'Ciudad de residencia',
      tel: 'Teléfono', cel: 'Celular', otro_tel: 'Otro teléfono', nivel_estudios: 'Nivel de estudios', nom_emp: 'Empresa',
      fec_ing: 'Fecha de ingreso', sal_bas: 'Salario básico', prom_pres: 'Promedio prestaciones', prom_boni: 'Promedio bonificaciones',
      cargo: 'Cargo', profesion: 'Profesión', tipo_cuenta: 'Tipo de cuenta', banco: 'Banco', n_cuenta: 'Número de cuenta',
      maneja_recursos_publicos: 'Maneja recursos públicos', reconocimiento_publico: 'Reconocimiento público',
      nom_conyuge: 'Nombre del cónyuge', ocu_conyuge: 'Ocupación del cónyuge', tel_conyuge: 'Teléfono del cónyuge',
      tip_doc: 'Tipo documento del cónyuge', doc_conyuge: 'Documento del cónyuge', bien_raices: 'Bienes raíces',
      bienes_dic: 'Descripción de bienes', vehiculo: 'Vehículo', marca_veh: 'Marca del vehículo', modelo_veh: 'Modelo del vehículo',
      tipo_doc_ben1: 'Tipo documento beneficiario 1', ben_doc1: 'Documento beneficiario 1', ben_nom1: 'Nombre beneficiario 1',
      parentesco1: 'Parentesco beneficiario 1', tipo_doc_ben2: 'Tipo documento beneficiario 2', ben_doc2: 'Documento beneficiario 2',
      ben_nom2: 'Nombre beneficiario 2', parentesco2: 'Parentesco beneficiario 2', tipo_doc_ben3: 'Tipo documento beneficiario 3',
      ben_doc3: 'Documento beneficiario 3', ben_nom3: 'Nombre beneficiario 3', parentesco3: 'Parentesco beneficiario 3'
    };
    if (campo &&
      etiquetas[campo]) {
      return etiquetas[campo];
    }
    return campo ? campo : 'Campo actualizado';
  }

  private formatearValorCambio(campo: string, valor: any) {
    if (valor === null || valor === undefined || valor.toString().trim() === '') {
      return '(vacío)';
    }
    const textoValor = valor.toString().trim();
    if (campo === 'fec_nac' || campo === 'fec_exp' || campo === 'fec_ing') {
      const partes = textoValor.split('-');
      if (partes.length === 3 &&
        partes[0].length === 4) {
        return partes[2] + '/' + partes[1] + '/' + partes[0];
      }
    }
    if (campo === 'porcen_ahorro') {
      return textoValor + '%';
    }
    return textoValor;
  }

  public toggleDetalleSolicitud(solicitud: any) {
    if (!solicitud) {
      return;
    }
    solicitud.mostrarDetalle = !solicitud.mostrarDetalle;
    if (!solicitud.mostrarDetalle) {
      solicitud.mostrarCambios = false;
    }
  }

  public toggleCambiosSolicitud(solicitud: any) {
    if (!solicitud) {
      return;
    }
    solicitud.mostrarCambios = !solicitud.mostrarCambios;
  }

  public obtenerResumenCambiosSolicitud(solicitud: any) {
    if (!solicitud || !Array.isArray(solicitud.cambios) || solicitud.cambios.length <= 0) {
      return '';
    }
    return solicitud.cambios.slice(0, 3).map((cambio: any) => cambio.etiqueta)
      .join(', ');
  }

  public tieneMasCambiosResumen(solicitud: any) {
    if (!solicitud || !Array.isArray(solicitud.cambios)) {
      return false;
    }
    return solicitud.cambios.length > 3;
  }

  public obtenerSolicitudesAfiliacionFiltradas() {
    return this.filtrarSolicitudes((this.solicitudesAfiliacion || []).slice(), this.filtroBusquedaSolicitudesAfiliacion, solicitud => {
      const nombreCompleto = ((solicitud.nomAfi || '') +
        ' ' +
        (solicitud.ap1Afi || '') +
        ' ' +
        (solicitud.ap2Afi || '')).replace(/\s+/g, ' ').trim();
      const tipoSolicitud = solicitud.tipoSolicitud === 'ACTUALIZACION_DATOS' ? 'ACTUALIZACION ACTUALIZACIÓN ACTUALIZACION DE DATOS ACTUALIZACIÓN DE DATOS' : 'AFILIACION AFILIACIÓN';
      let estado = 'SIN APROBAR PENDIENTE PENDIENTES';
      if (solicitud.status === 'AFILIADO(A)') {
        estado = 'APROBADA APROBADO APROBADAS AFILIADO';
      }
      if (solicitud.status === 'RECHAZADO(A)') {
        estado = 'RECHAZADA RECHAZADO RECHAZADAS';
      }
      return [nombreCompleto, solicitud.codAfi || '', solicitud.eMail || '', solicitud.telCel || '', solicitud.nomEmp || '', tipoSolicitud, estado];
    }, [['tipoSolicitud', this.filtroTipoSolicitudAfiliacion], ['status', this.filtroEstadoAfiliacion]]);
  }

  public obtenerSolicitudesAfiliacionColumna(columna: number) {
    const solicitudes = this.obtenerSolicitudesAfiliacionFiltradas();
    return solicitudes.filter((solicitud: any, indice: number) => indice % 2 === columna);
  }

  public limpiarBusquedaSolicitudesAfiliacion() {
    this.filtroBusquedaSolicitudesAfiliacion = '';
  }

  public cambiarFiltroTipoSolicitudAfiliacion(tipoSolicitud: string) {
    this.filtroTipoSolicitudAfiliacion = tipoSolicitud;
    this.clearError();
  }

  public cambiarFiltroEstadoAfiliacion(estado: string) {
    this.filtroEstadoAfiliacion = estado;
    this.clearError();
  }

  public refrescarSolicitudesAfiliacion() {
    this.clearError();
    this.loadSolicitudesAfiliacion();
    if (this.filtroEstadoAfiliacion !== 'PENDIENTE') {
      this.cargarCantidadSolicitudesAfiliacionPendientes();
    }
  }

  private cargarCantidadSolicitudesAfiliacionPendientes() {
    if (!this.puedeAprobarSolicitudes) {
      this.cantidadSolicitudesAfiliacionPendientes = 0;
      return;
    }
    this._employeeService.loadAssociatedRequests().subscribe(
      data => {
        this.cantidadSolicitudesAfiliacionPendientes = data.content.length;
      }, error => {
        this.cantidadSolicitudesAfiliacionPendientes = 0;
      });
  }

  public obtenerTextoEstadoAfiliacion(estado: any) {
    if (estado === 'AFILIADO(A)') {
      return 'APROBADA';
    }
    if (estado === 'RECHAZADO(A)') {
      return 'RECHAZADA';
    }
    return 'SIN APROBAR';
  }

  public mostrarConfirmacionInline(index: number, accion: EstadoSolicitud) {
    const solicitud = this.solicitudesAfiliacion[index];
    if (!solicitud) {
      this.errorMessage = 'No se encontró la solicitud de afiliación.';
      return;
    }
    const esAprobacion = accion === 'AFILIADO(A)';
    const nombre = ((solicitud.nomAfi || '') +
      ' ' +
      (solicitud.ap1Afi || '') +
      ' ' +
      (solicitud.ap2Afi || '')).trim();
    const esActualizacion = solicitud.tipoSolicitud === 'ACTUALIZACION_DATOS';
    const tipoTexto = esActualizacion ? 'actualización de datos' : 'afiliación';
    this.confirmarFemprobien(esAprobacion ? 'Confirmar aprobación' : 'Confirmar rechazo', esAprobacion ? '¿Deseas aprobar la solicitud de ' + tipoTexto + '?' : '¿Deseas rechazar la solicitud de ' + tipoTexto + '?', nombre ? 'Asociado: ' + nombre + '.' : 'Confirma la operación antes de continuar.', esAprobacion ? 'Aprobar solicitud' : 'Rechazar solicitud', () => this.cambiarEstadoSolicitud(index, accion), esAprobacion ? 'success' : 'error', esAprobacion ? 'btn-success' : 'btn-danger');
  }

  public cambiarEstadoSolicitud(index: number, status: EstadoSolicitud) {
    if (!this.puedeAprobarSolicitudes) {
      this.errorMessage = 'No tienes permisos para aprobar o rechazar solicitudes.';
      return;
    }
    const solicitud = this.solicitudesAfiliacion[index];
    if (!solicitud || !solicitud.id) {
      this.errorMessage = 'No se encontró el identificador de la solicitud.';
      return;
    }
    this.accionesEnProgreso[index] = true;
    const url = this.bridgeApiUrl + '/femprobien/solicitudes-afiliacion/' + encodeURIComponent(solicitud.id.toString()) + '/estado';
    const body = { estado: status, usuario: this.identity && this.identity.username ? this.identity.username : '', observacion: '' };

    this._http.patch(url, body).subscribe(
      response => {
        this.accionesEnProgreso[index] = false;
        const data = response.json();
        if (data &&
          data.status === 200) {
          this.successMessage = 'Solicitud actualizada a ' +
            status +
            ' correctamente.';
          this.loadSolicitudesAfiliacion();
          this.cargarCantidadSolicitudesAfiliacionPendientes();
        } else {
          this.errorMessage = data && data.message ? data.message : 'No se pudo actualizar la solicitud.';
        }
      }, error => {
        this.accionesEnProgreso[index] = false;
        this.errorMessage = this.obtenerMensajeErrorCredito(error, 'Ocurrió un error al actualizar la solicitud.');
      });
  }

  public guardarNuevoAfiliado(confirmado?: boolean) {
    if (this.isSubmitting) { return; }
    this.errorMessage = '';
    this.successMessage = '';
    this.intentoEnviarAfiliacion = true;
    this.isSubmitting = true;
    const esActualizacion = this.esActualizacionDatos();
    if (esActualizacion &&
      !this.datosActualizacionCargados) {
      this.isSubmitting = false;
      this.irASeccionAfiliacion('solicitud');
      this.errorMessage = 'Antes de enviar una actualización debes validar el documento y la fecha de nacimiento para cargar tus datos actuales.';
      return;
    }
    const faltantes = this.obtenerCamposObligatoriosAfiliacion()
      .filter(campo => this.estaVacio(this.nuevoAfiliado[campo.campo]))
      .map(campo => esActualizacion && campo.campo === 'nomAfi' ? 'Nombre completo' : campo.nombre);
    if (faltantes.length > 0) {
      this.errorMessage = 'Faltan por completar los siguientes campos: ' +
        faltantes.join(', ') +
        '.';
      this.isSubmitting = false;
      return;
    }
    if (!this.tieneBeneficiarioCompleto()) {
      this.isSubmitting = false;
      this.irASeccionAfiliacion('beneficiarios');
      this.errorMessage = 'Debes diligenciar completamente por lo menos un beneficiario: ' +
        'tipo de documento, número de documento, nombres y apellidos y parentesco.';
      return;
    }
    for (let numeroBeneficiario = 1; numeroBeneficiario <= 3; numeroBeneficiario++) {
      if (this.beneficiarioTieneDatos(numeroBeneficiario) &&
        !this.beneficiarioCompleto(numeroBeneficiario)) {
        this.isSubmitting = false;
        this.irASeccionAfiliacion('beneficiarios');
        this.errorMessage = 'El beneficiario ' +
          numeroBeneficiario +
          ' tiene información incompleta. ' +
          'Debes completar tipo de documento, número de documento, ' +
          'nombres y apellidos y parentesco.';
        return;
      }
    }
    if (!confirmado) {
      this.isSubmitting = false;
      this.confirmarFemprobien(esActualizacion ? 'Enviar actualización de datos' : 'Enviar solicitud de afiliación', esActualizacion ? '¿Deseas enviar tus cambios para revisión?' : '¿Deseas enviar tu solicitud de afiliación?', 'FEMPROBIEN revisará la información antes de aprobarla.', 'Enviar solicitud', () => this.guardarNuevoAfiliado(true));
      return;
    }
    const solicitud = this.transformarAfiliado(this.nuevoAfiliado);
    this._employeeService.addAfiliadoFemprobien(solicitud).subscribe(
      data => {
        this.isSubmitting = false;
        if (data && data.status === 201) {
          this.mostrarFormularioAfiliado = false; this.limpiarFormularioAfiliado(); this.loadSolicitudesAfiliacion();
          this.successMessage = esActualizacion ? 'Solicitud de actualización enviada correctamente. FEMPROBIEN revisará los cambios antes de aplicarlos.' : 'Solicitud de afiliación enviada correctamente. FEMPROBIEN revisará la información antes de aprobarla.';
        } else {
          this.errorMessage = data && data.message ? data.message : 'No fue posible registrar la solicitud.';
        }
      }, error => {
        this.isSubmitting = false;
        this.errorMessage = this.obtenerMensajeErrorCredito(error, 'Error registrando la solicitud.');
      });
  }

  private transformarAfiliado(form: any) {
    return {
      tipo_solicitud: form.tipoSolicitud, tipo_ingreso: form.tipoIngreso, fecha_afiliacion: form.fecAfi, forma_desc: form.periodoAporte,
      cant_porcen: form.cantPorcen, porcen_ahorro: form.porcenAhorro, tipo_documento: form.tipoDoc,
      cod_asp: form.codAfi !== null && form.codAfi !== undefined ? form.codAfi.toString() : null, nombres: form.nomAfi,
      primer_apellido: form.ap1Afi, segundo_apellido: form.ap2Afi, est_civil: form.estCiv, fec_nac: form.fecNac, fec_exp: form.fecExp,
      lugar_exp: form.lugarExp, email_per: form.eMail, dir_res: form.dirRes, ciudad_residencia: form.nomBar, tel: form.tel, cel: form.telCel,
      otro_tel: form.otroTel, nivel_estudios: form.nivelEstudios, nom_emp: form.nomEmp, fec_ing: form.fecIng, sal_bas: form.salBas,
      prom_pres: form.promPres ? form.promPres : 0, prom_boni: form.promBoni ? form.promBoni : 0, cargo: form.cargo,
      profesion: form.profesion, tipo_cuenta: form.ctaTipo, banco: form.fdoBan, n_cuenta: form.ctaBan,
      maneja_recursos_publicos: form.manejaRecursosPublicos === 'SI', reconocimiento_publico: form.reconocimientoPublico === 'SI',
      nom_conyuge: form.nomConyuge, ocu_conyuge: form.ocuConyuge, tel_conyuge: form.telConyuge, tipo_doc_conyuge: form.tipoDocConyuge,
      doc_conyuge: form.docConyuge, bien_raices: form.bienRaices === 'SI', bienes_dir: form.bienesDir, vehiculo: form.vehiculo === 'SI',
      marca_veh: form.marcaVeh, modelo_veh: form.modeloVeh, tipo_doc_ben1: form.tipoDocBen1, ben_doc1: form.codBen1, ben_nom1: form.nomBen1,
      parentesco1: form.parBen1, tipo_doc_ben2: form.tipoDocBen2, ben_doc2: form.codBen2, ben_nom2: form.nomBen2, parentesco2: form.parBen2,
      tipo_doc_ben3: form.tipoDocBen3, ben_doc3: form.codBen3, ben_nom3: form.nomBen3, parentesco3: form.parBen3,
      creado_por: this.identity && this.identity.username ? this.identity.username : ''
    };
  }

  public limpiarFormularioAfiliado() {
    const tipoSolicitud = this.esActualizacionDatos() ? 'ACTUALIZACION_DATOS' : 'AFILIACION';
    this.intentoEnviarAfiliacion = false;
    this.datosActualizacionCargados = false;
    this.cargandoDatosActualizacion = false;
    this.nuevoAfiliado = this.crearFormularioAfiliacion();
    this.nuevoAfiliado.tipoSolicitud = tipoSolicitud;
    this.reiniciarSeccionesAfiliacion();
    this.seccionAfiliacionActiva = 'solicitud';
    this.clearError();
  }

  public toggleFormularioAfiliado() {
    this.intentoEnviarAfiliacion = false;
    this.modoCredito = false;
    this.mostrarFormularioCredito = false;
    this.mostrarFormularioAfiliado = !this.mostrarFormularioAfiliado;
    if (this.mostrarFormularioAfiliado) {
      this.nuevoAfiliado = this.crearFormularioAfiliacion();
      this.datosActualizacionCargados = false;
      this.cargandoDatosActualizacion = false;
      this.seccionesAbiertas.solicitud = true;
    }
  }
}
