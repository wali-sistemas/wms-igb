import { Component, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { Http, Response, Headers, RequestOptions, ResponseContentType } from '@angular/http';
import { UserService } from '../../../services/user.service';
import { GLOBAL } from '../../../services/global';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
interface MensajeAgente {
  rol: 'asistente' | 'usuario';
  contenido: string;
  fecha: Date;
  tipo?: string;
  datos?: any;
}

@Component({
  selector: 'app-aifemprobien',
  templateUrl: './aifemprobien.component.html',
  styleUrls: ['./aifemprobien.component.css']
})

export class EmployeeAiFemprobienComponent implements OnChanges, OnDestroy {
  @Input()
  solicitudId: number | null = null;
  @Input()
  nombreAsociado: string = '';
  @Input()
  montoSolicitado: number | null = null;
  @Input()
  plazoMeses: number | null = null;
  @Input()
  backendBaseUrl: string = GLOBAL.urlBridge;
  @Input()
  solicitudesCredito: any[] = [];
  public abierto: boolean = false;
  public maximizado: boolean = false;
  public texto: string = '';
  public mensajes: MensajeAgente[] = [];
  public cargando: boolean = false;
  public cargandoSimulacion: boolean = false;
  public cargandoComparacion: boolean = false;
  public cargandoInterpretacion: boolean = false;
  public cargandoMultiples: boolean = false;
  public cargandoEvaluacionMultiple: boolean = false;
  public descargandoEstudiosExcel: boolean = false;
  public error: string = '';
  public evaluacion: any = null;
  @ViewChild('historialMensajes')
  historialMensajes: ElementRef;
  public simPanelExpandido: boolean = false;
  public simMensajeActual: number = 0;
  private simMensajeSecuencia: number = 0;
  public simulacionIntegralVisible: boolean = false;
  public cargandoSimulacionIntegral: boolean = false;
  public simFormulario: any = null;
  public simMasiva: any = null;
  public simError: string = '';
  public simSolicitudesTexto: string = '';
  public simConfirmarNegadas: boolean = false;
  public simSeleccionadas: any[] = [];
  public simSolicitudActiva: number | null = null;
  private analisisGeneralFormulario: any = null;
  private contextoActualClave: string = 'general';
  private contextosNavegacion: { [clave: string]: any; } = {};
  private historialIA: {
    [clave: string]: Array<{
      rol: string;
      contenido: string;
    }>;
  } = {};
  private peticionIntegral: Subscription | null = null;
  private peticion: Subscription | null = null;
  private peticionSimulacion: Subscription | null = null;
  private peticionComparacion: Subscription | null = null;
  private peticionInterpretacion: Subscription | null = null;
  private peticionMultiples: Subscription | null = null;
  private peticionEvaluacionMultiple: Subscription | null = null;
  private peticionExcel: Subscription | null = null;
  private peticionIA: Subscription | null = null;
  private accionRapidaEnCurso: boolean = false;
  private versionConsultas: number = 0;
  private secuenciaCreditoMultiple: number = 0;

  constructor(private http: Http, private userService: UserService) {
    this.reiniciar(false);
  }

  ngOnChanges(cambios: SimpleChanges) {
    if (!cambios['solicitudId'])
      return;
    var destino = this.claveContexto(this.solicitudId);
    if (destino === this.contextoActualClave)
      return;
    this.guardarContextoActual();
    this.reiniciar(false);
    this.contextoActualClave = destino;
    if (!this.restaurarContexto(destino) && this.abierto && this.tieneSolicitud()) {
      this.consultarEstudio('resumen');
    }
  }

  private claveContexto(id: any): string {
    var n = Number(id);
    return isFinite(n) && n > 0 && Math.floor(n) === n
      ? 'solicitud:' + n : 'general';
  }

  private guardarContextoActual() {
    this.contextosNavegacion[this.contextoActualClave] = {
      mensajes: this.mensajes,
      evaluacion: this.evaluacion,
      texto: this.texto,
      error: this.error,
      secuenciaCreditoMultiple: this.secuenciaCreditoMultiple,
      analisisGeneralFormulario: this.analisisGeneralFormulario,
      simPanelExpandido: this.simPanelExpandido,
      simMensajeActual: this.simMensajeActual,
      simMensajeSecuencia: this.simMensajeSecuencia,
      simulacionIntegralVisible: this.simulacionIntegralVisible,
      simFormulario: this.simFormulario,
      simMasiva: this.simMasiva,
      simError: this.simError,
      simSolicitudesTexto: this.simSolicitudesTexto,
      simConfirmarNegadas: this.simConfirmarNegadas,
      simSeleccionadas: this.simSeleccionadas,
      simSolicitudActiva: this.simSolicitudActiva
    };
  }

  private restaurarContexto(clave: string): boolean {
    var estado: any = this.contextosNavegacion[clave];
    if (!estado)
      return false;
    this.mensajes = estado.mensajes || [];
    this.evaluacion = estado.evaluacion || null;
    this.texto = estado.texto || '';
    this.error = estado.error || '';
    this.secuenciaCreditoMultiple = estado.secuenciaCreditoMultiple || 0;
    this.analisisGeneralFormulario = estado.analisisGeneralFormulario || null;
    this.simPanelExpandido = !!estado.simPanelExpandido;
    this.simMensajeActual = estado.simMensajeActual || 0;
    this.simMensajeSecuencia = estado.simMensajeSecuencia || 0;
    this.simulacionIntegralVisible = !!estado.simulacionIntegralVisible;
    this.simFormulario = estado.simFormulario || null;
    this.simMasiva = estado.simMasiva || null;
    this.simError = estado.simError || '';
    this.simSolicitudesTexto = estado.simSolicitudesTexto || '';
    this.simConfirmarNegadas = !!estado.simConfirmarNegadas;
    this.simSeleccionadas = estado.simSeleccionadas || [];
    this.simSolicitudActiva = estado.simSolicitudActiva == null
      ? null : estado.simSolicitudActiva;
    this.irAlUltimoMensaje();
    return true;
  }

  ngOnDestroy() {
    if (this.peticionExcel) {
      this.peticionExcel.unsubscribe();
      this.peticionExcel = null;
    }
    this.cancelarSimulacionIntegral();
    this.cancelarConsulta();
  }

  public tieneSolicitud(): boolean {
    var id = Number(this.solicitudId);
    return isFinite(id) && id > 0 && Math.floor(id) === id;
  }

  public estaProcesando(): boolean {
    return this.cargando ||
      this.cargandoSimulacion ||
      this.cargandoComparacion ||
      this.cargandoMultiples ||
      this.cargandoEvaluacionMultiple ||
      this.cargandoInterpretacion ||
      this.cargandoSimulacionIntegral;
  }

  public abrir() {
    this.abierto = true;
    if (this.tieneSolicitud() &&
      !this.evaluacion &&
      !this.cargando) {
      this.consultarEstudio('resumen');
    }
  }

  public cerrar() {
    this.abierto = false;
    this.maximizado = false;
  }

  public cambiarTamano() {
    this.maximizado = !this.maximizado;
  }

  public reiniciar(consultarInicial: boolean = true) {
    if (consultarInicial) {
      this.historialIA = {};
      this.contextosNavegacion = {};
      this.contextoActualClave = this.claveContexto(this.solicitudId);
    }
    this.cancelarSimulacionIntegral();
    this.simulacionIntegralVisible = false;
    this.simPanelExpandido = false;
    this.simMensajeActual = 0;
    this.simMensajeSecuencia = 0;
    this.simFormulario = null;
    this.simMasiva = null;
    this.simError = '';
    this.simSolicitudesTexto = '';
    this.simConfirmarNegadas = false;
    this.simSeleccionadas = [];
    this.simSolicitudActiva = 0;
    this.analisisGeneralFormulario = null;
    this.cancelarConsulta();
    this.evaluacion = null;
    this.error = '';
    this.texto = '';
    this.secuenciaCreditoMultiple = 0;
    this.mensajes = [{
      rol: 'asistente',
      contenido: 'Bienvenido al agente financiero FEMPROBIEN. ' +
        'Puedo consultar el estudio preliminar, ' +
        'las deducciones, simular un crédito, comparar ' +
        'plazos y simular créditos. En la vista general también ' +
        'puedo evaluar o simular varias solicitudes de diferentes asociados.',
      fecha: new Date(),
      tipo: 'texto'
    }];
    if (consultarInicial && this.abierto && this.tieneSolicitud()) {
      this.consultarEstudio('resumen');
    }
  }

  public actualizar() {
    if (!this.tieneSolicitud() || this.estaProcesando()) {
      return;
    }
    this.evaluacion = null;
    delete this.historialIA[this.claveMemoriaIAIndividual(Number(this.solicitudId))];
    this.mensajes = this.mensajes.filter((m: MensajeAgente) => ['resumen', 'capacidad', 'deducciones', 'formulario_simulacion',
      'multiples'].indexOf(String(m.tipo || '')) < 0);
    this.consultarEstudio('resumen');
  }

  public accionRapida(pregunta: string) {
    if (this.estaProcesando()) {
      return;
    }
    this.texto = pregunta;
    this.accionRapidaEnCurso = true;
    try {
      this.enviar();
    }
    finally {
      this.accionRapidaEnCurso = false;
    }
  }

  public enviar() {
    var pregunta = (this.texto || '').trim();
    if (!pregunta || this.estaProcesando()) {
      return;
    }
    var tipo = this.identificarAccion(pregunta);
    this.simPanelExpandido = false;
    this.agregarMensaje('usuario', pregunta);
    this.texto = '';
    if (this.esComandoAnalisisGeneral(pregunta)) {
      var comando = pregunta.trim().toLowerCase();
      if (comando === 'análisis general de solicitudes' ||
        comando === 'analisis general de solicitudes') {
        this.abrirAnalisisGeneral();
      }
      else if (comando.indexOf('simul') >= 0) {
        this.abrirSelectorSimulacionMultiple();
      }
      else {
        this.abrirFormularioEvaluacionMultiple();
      }
      return;
    }
    if (!this.accionRapidaEnCurso &&
      (this.esPreguntaGenerativa(pregunta, tipo) ||
        (tipo === 'evaluacion_multiple' && !this.esComandoAnalisisGeneral(pregunta)))) {
      if (!this.tieneSolicitud() ||
        (this.simulacionIntegralVisible && this.simSeleccionadas.length > 0)) {
        this.consultarIAGeneral(pregunta);
        return;
      }
      this.consultarIA(pregunta);
      return;
    }
    if (tipo === 'no_disponible') {
      this.agregarMensaje('asistente', 'Puedo evaluar varias solicitudes o consultar ' +
        'resumen, deducciones, capacidad de pago y simulaciones ' +
        'de una solicitud seleccionada.');
      return;
    }
    if (!this.tieneSolicitud()) {
      this.agregarMensaje('asistente', 'Selecciona Ver solicitud para el estudio individual, ' +
        'o utiliza Evaluar varias solicitudes para consultar ' +
        'diferentes asociados.');
      return;
    }
    if (this.evaluacion) {
      this.mostrarResultado(tipo, this.evaluacion);
    }
    else {
      this.consultarEstudio(tipo);
    }
  }

  private esComandoAnalisisGeneral(pregunta: string): boolean {
    var p = String(pregunta || '').trim().toLowerCase();
    return /^(evaluar|evalúa|evalua|simular|quiero evaluar|quiero simular)\s+(varias|múltiples|multiples)\s+solicitudes\.?$/.test(p) ||
      p === 'análisis general de solicitudes' ||
      p === 'analisis general de solicitudes';
  }

  private identificarAccion(pregunta: string): string {
    var p = (pregunta || '').toLowerCase();
    if ((p.indexOf('solicitud') >= 0 &&
      (p.indexOf('varias') >= 0 ||
        p.indexOf('varios') >= 0 ||
        p.indexOf('múltiples') >= 0 ||
        p.indexOf('multiples') >= 0)) ||
      p.indexOf('evaluar varias solicitudes') >= 0) {
      return 'evaluacion_multiple';
    }
    var plural = p.indexOf('varios') >= 0 ||
      p.indexOf('varias') >= 0 ||
      p.indexOf('multiples') >= 0 ||
      p.indexOf('múltiples') >= 0 ||
      p.indexOf('simultaneos') >= 0 ||
      p.indexOf('simultáneos') >= 0;
    var prestamo = p.indexOf('credito') >= 0 ||
      p.indexOf('crédito') >= 0 ||
      p.indexOf('prestamo') >= 0 ||
      p.indexOf('préstamo') >= 0;
    if (plural && prestamo) {
      return 'multiples';
    }
    if (p.indexOf('compar') >= 0 ||
      p.indexOf('plazos') >= 0) {
      return 'comparacion';
    }
    if (p.indexOf('deducc') >= 0 ||
      p.indexOf('nomina') >= 0 ||
      p.indexOf('nómina') >= 0 ||
      p.indexOf('descuento') >= 0) {
      return 'deducciones';
    }
    if (p.indexOf('simul') >= 0 ||
      p.indexOf('cuota') >= 0 ||
      prestamo) {
      return 'simulacion';
    }
    if (p.indexOf('capacidad') >= 0 ||
      p.indexOf('tope') >= 0 ||
      p.indexOf('margen') >= 0 ||
      p.indexOf('saldo disponible') >= 0) {
      return 'capacidad';
    }
    if (p.indexOf('resumen') >= 0 ||
      p.indexOf('estudio') >= 0 ||
      p.indexOf('analiz') >= 0 ||
      p.indexOf('salario') >= 0 ||
      p.indexOf('ingreso') >= 0) {
      return 'resumen';
    }
    return 'no_disponible';
  }

  private esPreguntaGenerativa(pregunta: string, tipo: string): boolean {
    if (tipo === 'evaluacion_multiple') {
      return false;
    }
    var p = (pregunta || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
    var comandos = [
      'resumen',
      'capacidad de pago',
      'simular crédito',
      'simular credito',
      'comparar plazos',
      'varios créditos',
      'varios creditos',
      'deducciones'
    ];
    return comandos.indexOf(p) < 0;
  }

  private obtenerUsuarioWms(): string {
    try {
      var identidad: any = this.userService.getItentity();
      var usuario = identidad && identidad.username != null
        ? String(identidad.username).trim().toLowerCase() : '';
      return /^[a-z0-9._-]{2,60}$/.test(usuario) ? usuario : '';
    }
    catch (e) {
      return '';
    }
  }

  private claveMemoriaIAIndividual(numero: number): string {
    return 'solicitud:' + numero;
  }

  private claveMemoriaIALote(ids: number[]): string {
    var ordenados = (ids || []).slice().sort((a: number, b: number) => a - b);
    return ordenados.length ? 'lote:' + ordenados.join(',') : 'general';
  }

  private obtenerHistorialIA(clave: string): any[] {
    var intercambios = this.historialIA[clave] || [];
    return intercambios.slice(-10).map((item: any) => ({
      rol: item.rol,
      contenido: item.contenido
    }));
  }

  private registrarIntercambioIA(clave: string, pregunta: string, respuesta: string) {
    var lista = this.historialIA[clave] || [];
    lista.push({ rol: 'usuario', contenido: String(pregunta || '').slice(0, 1200) });
    lista.push({ rol: 'asistente', contenido: String(respuesta || '').slice(0, 1200) });
    this.historialIA[clave] = lista.slice(-10);
    var claves = Object.keys(this.historialIA);
    if (claves.length > 25)
      delete this.historialIA[claves[0]];
  }

  private consultarIAGeneral(pregunta: string) {
    var mensaje = String(pregunta || '').replace(/^ia:\s*/i, '').trim();
    if (!mensaje || mensaje.length > 2000) {
      this.agregarMensaje('asistente', 'La pregunta debe tener entre 1 y 2000 caracteres.');
      return;
    }
    var usuario = this.obtenerUsuarioWms();
    if (!usuario) {
      this.agregarMensaje('asistente', 'No fue posible identificar la sesión actual de WMS.');
      return;
    }
    var headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('X-Femprobien-User', usuario);
    var options = new RequestOptions({ headers: headers });
    var version = this.versionConsultas;
    var ids: number[] = [];
    if (this.analisisGeneralFormulario &&
      this.analisisGeneralFormulario.modo === 'evaluar' &&
      this.analisisGeneralFormulario.idsSeleccionados) {
      ids = this.analisisGeneralFormulario.idsSeleccionados.slice();
    }
    else if (this.simulacionIntegralVisible && this.simSeleccionadas &&
      this.simSeleccionadas.length) {
      ids = this.simSeleccionadas.map((s: any) => Number(s.numeroSolicitud));
    }
    else if (this.analisisGeneralFormulario &&
      this.analisisGeneralFormulario.idsSeleccionados) {
      ids = this.analisisGeneralFormulario.idsSeleccionados.slice();
    }
    ids = ids.filter((n: number, i: number) => isFinite(n) && n > 0 && Math.floor(n) === n && ids.indexOf(n) === i).slice(0, 20);
    var claveMemoria = this.claveMemoriaIALote(ids);
    var body: any = {
      mensaje: mensaje,
      historial: this.obtenerHistorialIA(claveMemoria)
    };
    if (ids.length) {
      body.numeroSolicitudes = ids;
    }
    if (this.analisisGeneralFormulario &&
      this.analisisGeneralFormulario.modo === 'simular' &&
      ids.length && this.simMasiva && Array.isArray(this.simMasiva.resultados)) {
      body.resultadosSimulacion = this.simMasiva.resultados
        .filter((r: any) => ids.indexOf(Number(r.numeroSolicitud)) >= 0)
        .slice(0, 20)
        .map((r: any) => ({
          numeroSolicitud: Number(r.numeroSolicitud),
          estado: r.estado,
          simulacion: r.simulacion ? {
            cuotaPorPeriodo: r.simulacion.cuotaPorPeriodo,
            cuotaMensualEquivalente: r.simulacion.cuotaMensualEquivalente,
            plazoMeses: r.simulacion.plazoMeses,
            interesesTotales: r.simulacion.interesesTotales,
            totalPagar: r.simulacion.totalPagar,
            frecuenciaPago: r.simulacion.frecuenciaPago
          } : null,
          capacidadPago: r.capacidadPago ? {
            topeActualPorcentaje: r.capacidadPago.topeActualPorcentaje,
            topeProyectadoPorcentaje: r.capacidadPago.topeProyectadoPorcentaje
          } : null,
          validacionReglamentaria: r.validacionReglamentaria ? {
            plazoCumple: r.validacionReglamentaria.plazoCumple
          } : null
        }));
    }
    this.cargando = true;
    this.peticionIA = this.http.post(this.obtenerUrlBase() + '/femprobien/agente/consultar-general', body, options).subscribe((respuesta: Response) => {
      this.cargando = false;
      this.peticionIA = null;
      if (version !== this.versionConsultas)
        return;
      try {
        var datos: any = respuesta.json();
        if (!datos || typeof datos.respuesta !== 'string' || !datos.respuesta.trim()) {
          throw new Error('Respuesta vacía');
        }
        this.agregarMensaje('asistente', datos.respuesta);
        this.registrarIntercambioIA(claveMemoria, mensaje, datos.respuesta);
      }
      catch (e) {
        this.agregarMensaje('asistente', 'La respuesta del agente no es válida.');
      }
    }, (fallo: any) => {
      this.cargando = false;
      this.peticionIA = null;
      if (version !== this.versionConsultas)
        return;
      this.agregarMensaje('asistente', fallo && fallo.status === 404
        ? 'BridgeApi no tiene habilitado /femprobien/agente/consultar-general. Publica también el controlador Java incluido.'
        : 'No fue posible responder la consulta general.' + this.obtenerDetalleError(fallo));
    });
  }

  private consultarIA(pregunta: string) {
    var id = Number(this.solicitudId);
    var claveMemoria = this.claveMemoriaIAIndividual(id);
    var version = this.versionConsultas;
    var url = this.obtenerUrlBase() + '/femprobien/agente/consultar';
    var mensaje = (pregunta || '').replace(/^ia:\s*/i, '').trim();
    if (!mensaje || mensaje.length > 2000) {
      this.agregarMensaje('asistente', 'La consulta debe contener entre 1 y 2000 caracteres.');
      return;
    }
    var usuario = this.obtenerUsuarioWms();
    if (!usuario) {
      this.agregarMensaje('asistente', 'No fue posible identificar la sesión actual de WMS.');
      return;
    }
    var headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('X-Femprobien-User', usuario);
    var options = new RequestOptions({ headers: headers });
    this.cargando = true;
    this.peticionIA = this.http.post(url, {
      numeroSolicitud: id,
      mensaje: mensaje,
      historial: this.obtenerHistorialIA(claveMemoria)
    }, options).subscribe((response: Response) => {
      this.cargando = false;
      this.peticionIA = null;
      if (version !== this.versionConsultas || Number(this.solicitudId) !== id)
        return;
      try {
        var datos: any = response.json();
        if (!datos || Number(datos.numeroSolicitud) !== id ||
          typeof datos.respuesta !== 'string' || !datos.respuesta.trim()) {
          throw new Error('Respuesta IA inválida.');
        }
        this.agregarMensaje('asistente', datos.respuesta);
        this.registrarIntercambioIA(claveMemoria, mensaje, datos.respuesta);
      }
      catch (e) {
        this.agregarMensaje('asistente', 'BridgeApi devolvió una respuesta IA incompleta.');
      }
    }, (fallo: any) => {
      this.cargando = false;
      this.peticionIA = null;
      if (version !== this.versionConsultas || Number(this.solicitudId) !== id)
        return;
      var status = fallo && fallo.status;
      var detalle = '';
      try {
        var cuerpo: any = fallo.json();
        if (cuerpo && (cuerpo.error || cuerpo.mensaje)) {
          detalle = String(cuerpo.error || cuerpo.mensaje);
        }
      }
      catch (e) { }
      var mensajeError = (status === 401 || status === 403)
        ? (detalle || 'Tu usuario no tiene permiso para utilizar el agente financiero IA.')
        : status === 404
          ? (detalle || 'No fue posible consultar la solicitud.')
          : (detalle || 'No está disponible la IA (HTTP ' +
            (status == null ? '?' : status) + ').');
      this.agregarMensaje('asistente', mensajeError);
    });
  }

  public ingresosVariablesObservados(nomina: any): number | null {
    if (!nomina || !Array.isArray(nomina.comisionesConsolidadasDetalle)) {
      return null;
    }
    var conceptos: any[] = nomina.comisionesConsolidadasDetalle;
    var total: number = 0;
    var encontrados: boolean = false;
    for (var i = 0; i < conceptos.length; i++) {
      var concepto: any = conceptos[i];
      if (!concepto || concepto.valor == null || concepto.valor === '') {
        continue;
      }
      var valor = Number(concepto.valor);
      if (isFinite(valor)) {
        total += valor;
        encontrados = true;
      }
    }
    return encontrados ? total : null;
  }

  private obtenerUrlBase(): string {
    return String(GLOBAL.urlBridge || '')
      .trim()
      .replace(/\/+$/, '');
  }

  private urlEscenario(): string {
    return this.obtenerUrlBase() +
      '/femprobien/simulador-credito/escenario';
  }

  private consultarEstudio(tipo: string) {
    if (!this.tieneSolicitud() || this.estaProcesando()) {
      return;
    }
    var idConsultado = Number(this.solicitudId);
    var url = this.obtenerUrlBase() +
      '/femprobien/evaluacion/solicitudes/' +
      idConsultado;
    this.cargando = true;
    this.error = '';
    this.peticion = this.http.get(url).subscribe((respuesta: Response) => {
      this.cargando = false;
      this.peticion = null;
      if (Number(this.solicitudId) !== idConsultado) {
        return;
      }
      var datos: any;
      try {
        datos = respuesta.json();
      }
      catch (e) {
        this.agregarMensaje('asistente', 'BridgeApi no devolvió un JSON válido.');
        return;
      }
      if (!datos || !datos.resumenFinancieroAgente) {
        this.agregarMensaje('asistente', 'La respuesta no contiene resumenFinancieroAgente.');
        return;
      }
      if (datos.solicitud &&
        datos.solicitud.numeroSolicitud != null &&
        Number(datos.solicitud.numeroSolicitud) !== idConsultado) {
        this.agregarMensaje('asistente', 'La respuesta no pertenece a la solicitud.');
        return;
      }
      this.evaluacion = datos;
      this.mostrarResultado(tipo, datos);
    }, (fallo: any) => {
      this.cargando = false;
      this.peticion = null;
      this.error =
        'No fue posible consultar el estudio (HTTP ' +
        (fallo && fallo.status != null
          ? fallo.status : '?') +
        ')' + this.obtenerDetalleError(fallo);
      this.agregarMensaje('asistente', this.error);
    });
  }

  private mostrarResultado(tipo: string, datos: any) {
    var tipoMensaje = (tipo === 'simulacion' || tipo === 'comparacion')
      ? 'formulario_simulacion' : tipo === 'multiples' ? 'multiples' : tipo;
    var anterior = this.buscarMensajePorTipo(tipoMensaje, Number(this.solicitudId));
    if (anterior) {
      if (tipoMensaje === 'formulario_simulacion') {
        this.cambiarModoSimulador(anterior.datos, tipo === 'comparacion' ? 'comparacion' : 'individual');
      }
      this.enfocarMensajeExistente(anterior);
      return;
    }
    if (tipo === 'resumen') {
      this.agregarMensaje('asistente', 'Ficha ejecutiva del estudio financiero.', 'resumen', datos);
    }
    else if (tipo === 'deducciones') {
      this.agregarMensaje('asistente', 'Detalle de deducciones consultado en NovaWEB.', 'deducciones', datos);
    }
    else if (tipo === 'capacidad') {
      this.agregarMensaje('asistente', 'Capacidad de pago, cupo y validaciones pendientes.', 'capacidad', datos);
    }
    else if (tipo === 'simulacion') {
      this.abrirFormularioSimulacion(datos);
    }
    else if (tipo === 'comparacion') {
      this.abrirFormularioComparacion(datos);
    }
    else if (tipo === 'multiples') {
      this.abrirFormularioMultiples(datos);
    }
  }

  private obtenerMontoInicial(datos: any): number | null {
    var solicitud = datos && datos.solicitud
      ? datos.solicitud : {};
    var monto = Number(solicitud.montoSolicitado != null
      ? solicitud.montoSolicitado
      : this.montoSolicitado);
    return isFinite(monto) && monto > 0
      ? monto : null;
  }

  private obtenerTnaInicial(datos: any): number | null {
    var solicitud = datos && datos.solicitud
      ? datos.solicitud : {};
    var simulacion = datos && datos.simulacion
      ? datos.simulacion : {};
    var tasa = simulacion.tasaMensual != null
      ? simulacion.tasaMensual
      : solicitud.tasaInteresMensualRegistrada;
    if (tasa === null || tasa === undefined || tasa === '') {
      return null;
    }
    var valor = Number(tasa);
    if (!isFinite(valor) || valor < 0) {
      return null;
    }
    return Number((valor * 12).toFixed(6));
  }

  private pagosPorAnio(frecuencia: string): number {
    var frecuencias: any = {
      ANUAL: 1,
      SEMESTRAL: 2,
      CUATRIMESTRAL: 3,
      TRIMESTRAL: 4,
      BIMESTRAL: 6,
      MENSUAL: 12,
      QUINCENAL: 24
    };
    return frecuencias[frecuencia] || 0;
  }

  private obtenerFrecuenciaInicial(datos: any): string {
    var solicitud = datos && datos.solicitud
      ? datos.solicitud : {};
    var simulacion = datos && datos.simulacion
      ? datos.simulacion : {};
    var frecuencia = String(solicitud.frecuenciaPagoRegistrada ||
      simulacion.frecuencia ||
      'MENSUAL').toUpperCase();
    return this.pagosPorAnio(frecuencia) > 0
      ? frecuencia : 'MENSUAL';
  }

  private obtenerAniosInicial(datos: any): number {
    var solicitud = datos && datos.solicitud
      ? datos.solicitud : {};
    var meses = Number(solicitud.plazoMeses != null
      ? solicitud.plazoMeses
      : this.plazoMeses);
    return isFinite(meses) && meses > 0
      ? Number((meses / 12).toFixed(6))
      : 1;
  }

  private validarEscenario(montoOriginal: any, tnaOriginal: any, aniosOriginal: any, frecuencia: string): string {
    if (montoOriginal == null ||
      montoOriginal === '' ||
      tnaOriginal == null ||
      tnaOriginal === '' ||
      aniosOriginal == null ||
      aniosOriginal === '') {
      return 'Completa monto, TNA y plazo.';
    }
    var monto = Number(montoOriginal);
    var tna = Number(tnaOriginal);
    var anios = Number(aniosOriginal);
    var pagos = this.pagosPorAnio(frecuencia);
    var cantidad = anios * pagos;
    if (!isFinite(monto) ||
      monto <= 0 ||
      monto > 90071992547409 ||
      Math.abs(monto * 100 -
        Math.round(monto * 100)) > 0.0001) {
      return 'El monto debe ser positivo y tener máximo dos decimales.';
    }
    if (!isFinite(tna) || tna < 0 || tna > 100) {
      return 'La TNA debe estar entre 0% y 100%.';
    }
    if (!isFinite(anios) ||
      anios <= 0 ||
      anios > 40 ||
      pagos <= 0 ||
      cantidad < 1 ||
      cantidad > 240 ||
      Math.abs(cantidad -
        Math.round(cantidad)) > 0.0000001) {
      return 'El plazo debe producir entre 1 y 240 cuotas enteras con la frecuencia seleccionada.';
    }
    return '';
  }

  private consultarEscenario(monto: number, tna: number, anios: number, frecuencia: string): Observable<Response> {
    return this.http.post(this.urlEscenario(), {
      monto: monto,
      tna: tna,
      anios: anios,
      frecuencia: frecuencia
    });
  }

  private abrirFormularioSimulacion(datos: any, modo: string = 'individual') {
    this.agregarMensaje('asistente', 'Simulador de crédito: calcula una cuota o compara tres plazos ' +
      'con los mismos parámetros, sin modificar la solicitud.', 'formulario_simulacion', {
      numeroSolicitud: Number(this.solicitudId),
      modo: modo === 'comparacion' ? 'comparacion' : 'individual',
      monto: this.obtenerMontoInicial(datos),
      tna: this.obtenerTnaInicial(datos),
      frecuencia: this.obtenerFrecuenciaInicial(datos),
      simulacion: {
        anios: this.obtenerAniosInicial(datos),
        registrada: datos ? datos.simulacion : null,
        resultado: null,
        analisis: null,
        interpretacionIA: '',
        interpretacionAviso: '',
        interpretando: false,
        error: '',
        enviando: false
      },
      comparacion: {
        plazos: [{ anios: 1 }, { anios: 1.5 }, { anios: 2 }],
        resultados: null,
        plazoVisible: null,
        parametrosCalculados: null,
        analisis: null,
        interpretacionIA: '',
        interpretacionAviso: '',
        interpretando: false,
        error: '',
        enviando: false
      }
    });
  }

  public cambiarModoSimulador(formulario: any, modo: string) {
    if (!formulario || this.estaProcesando())
      return;
    if (modo !== 'individual' && modo !== 'comparacion')
      return;
    formulario.modo = modo;
  }

  public ejecutarSimuladorUnificado(formulario: any) {
    if (!formulario)
      return;
    if (formulario.modo === 'comparacion') {
      this.ejecutarComparacion(formulario);
    }
    else {
      this.ejecutarSimulacion(formulario);
    }
  }

  public invalidarParametrosSimulador(formulario: any) {
    if (!formulario || this.estaProcesando())
      return;
    this.invalidarSimulacion(formulario);
    this.invalidarComparacion(formulario);
  }

  public invalidarSimulacion(formulario: any) {
    if (!formulario || formulario.simulacion.enviando) {
      return;
    }
    this.cancelarInterpretacion();
    formulario.simulacion.resultado = null;
    formulario.simulacion.analisis = null;
    formulario.simulacion.interpretacionIA = '';
    formulario.simulacion.interpretacionAviso = '';
    formulario.simulacion.interpretando = false;
    formulario.simulacion.error = '';
  }

  public ejecutarSimulacion(formulario: any) {
    if (!formulario ||
      formulario.simulacion.enviando ||
      this.estaProcesando() ||
      !this.tieneSolicitud() ||
      Number(formulario.numeroSolicitud) !==
      Number(this.solicitudId)) {
      return;
    }
    formulario.simulacion.resultado = null;
    formulario.simulacion.error = '';
    var frecuencia = String(formulario.frecuencia || '').toUpperCase();
    var validacion = this.validarEscenario(formulario.monto, formulario.tna, formulario.simulacion.anios, frecuencia);
    if (validacion) {
      formulario.simulacion.error = validacion;
      return;
    }
    var idConsultado = Number(this.solicitudId);
    formulario.simulacion.enviando = true;
    this.cargandoSimulacion = true;
    this.peticionSimulacion = this.consultarEscenario(Number(formulario.monto), Number(formulario.tna), Number(formulario.simulacion.anios), frecuencia).subscribe((respuesta: Response) => {
      formulario.simulacion.enviando = false;
      this.cargandoSimulacion = false;
      this.peticionSimulacion = null;
      if (Number(this.solicitudId) !== idConsultado) {
        return;
      }
      try {
        var resultado = respuesta.json();
        if (!resultado ||
          resultado.cuota == null ||
          resultado.tablaAmortizacion == null) {
          throw new Error('Respuesta incompleta');
        }
        formulario.simulacion.resultado = resultado;
        this.interpretarEscenarios('SIMULACION', formulario.simulacion, [{
          monto: formulario.monto,
          tna: formulario.tna,
          frecuencia: frecuencia,
          plazoMeses: Number(formulario.simulacion.anios) * 12,
          cantidadCuotas: resultado.cantidadCuotas,
          cuota: resultado.cuota,
          interesesTotales: resultado.interesesTotales,
          total: resultado.total
        }]);
      }
      catch (e) {
        formulario.simulacion.error =
          'BridgeApi no devolvió una simulación válida.';
      }
    }, (fallo: any) => {
      formulario.simulacion.enviando = false;
      this.cargandoSimulacion = false;
      this.peticionSimulacion = null;
      if (Number(this.solicitudId) !== idConsultado) {
        return;
      }
      formulario.simulacion.error =
        'Error al simular (HTTP ' +
        (fallo && fallo.status != null
          ? fallo.status : '?') +
        ')' + this.obtenerDetalleError(fallo);
    });
  }

  private abrirFormularioComparacion(datos: any) {
    this.abrirFormularioSimulacion(datos, 'comparacion');
  }

  public invalidarComparacion(formulario: any) {
    if (!formulario || formulario.comparacion.enviando) {
      return;
    }
    this.cancelarInterpretacion();
    formulario.comparacion.resultados = null;
    formulario.comparacion.plazoVisible = null;
    formulario.comparacion.parametrosCalculados = null;
    formulario.comparacion.analisis = null;
    formulario.comparacion.interpretacionIA = '';
    formulario.comparacion.interpretacionAviso = '';
    formulario.comparacion.interpretando = false;
    formulario.comparacion.error = '';
  }

  public ejecutarComparacion(formulario: any) {
    if (!formulario ||
      formulario.comparacion.enviando ||
      this.estaProcesando() ||
      !this.tieneSolicitud() ||
      Number(formulario.numeroSolicitud) !==
      Number(this.solicitudId)) {
      return;
    }
    formulario.comparacion.resultados = null;
    formulario.comparacion.plazoVisible = null;
    formulario.comparacion.error = '';
    var monto = Number(formulario.monto);
    var tna = Number(formulario.tna);
    var frecuencia = String(formulario.frecuencia || '').toUpperCase();
    if (!formulario.comparacion.plazos ||
      formulario.comparacion.plazos.length !== 3) {
      formulario.comparacion.error = 'Debes ingresar tres alternativas.';
      return;
    }
    var anios: number[] = [];
    var cantidades: number[] = [];
    for (var i = 0; i < 3; i++) {
      var plazo = formulario.comparacion.plazos[i].anios;
      var error = this.validarEscenario(formulario.monto, formulario.tna, plazo, frecuencia);
      if (error) {
        formulario.comparacion.error =
          'Alternativa ' + (i + 1) + ': ' + error;
        return;
      }
      var a = Number(plazo);
      var cuotas = Math.round(a * this.pagosPorAnio(frecuencia));
      if (cantidades.indexOf(cuotas) >= 0) {
        formulario.comparacion.error =
          'Los tres plazos deben ser diferentes.';
        return;
      }
      anios.push(a);
      cantidades.push(cuotas);
    }
    anios.sort((a: number, b: number) => a - b);
    var llamadas: Observable<Response>[] = [];
    for (var j = 0; j < anios.length; j++) {
      llamadas.push(this.consultarEscenario(monto, tna, anios[j], frecuencia));
    }
    var idConsultado = Number(this.solicitudId);
    formulario.comparacion.enviando = true;
    this.cargandoComparacion = true;
    this.peticionComparacion =
      Observable.forkJoin(llamadas).subscribe((respuestas: Response[]) => {
        formulario.comparacion.enviando = false;
        this.cargandoComparacion = false;
        this.peticionComparacion = null;
        if (Number(this.solicitudId) !== idConsultado) {
          return;
        }
        try {
          var resultados: any[] = [];
          for (var k = 0; k < respuestas.length; k++) {
            var r = respuestas[k].json();
            if (!r ||
              r.cuota == null ||
              r.total == null ||
              r.interesesTotales == null ||
              Number(r.cantidadCuotas) !==
              Math.round(anios[k] *
                this.pagosPorAnio(frecuencia)) ||
              !isFinite(Number(r.cuota)) ||
              !isFinite(Number(r.total)) ||
              !isFinite(Number(r.interesesTotales))) {
              throw new Error('Escenario incompleto');
            }
            resultados.push({
              anios: anios[k],
              plazoMeses: Number((anios[k] * 12).toFixed(6)),
              frecuencia: frecuencia,
              cantidadCuotas: r.cantidadCuotas,
              cuota: r.cuota,
              interesesTotales: r.interesesTotales,
              total: r.total,
              tablaAmortizacion: Array.isArray(r.tablaAmortizacion)
                ? r.tablaAmortizacion : [],
              plazoReglamentario: (anios[k] * 12) <= 24
            });
          }
          formulario.comparacion.resultados = resultados;
          formulario.comparacion.parametrosCalculados = {
            monto: monto,
            tna: tna,
            frecuencia: frecuencia
          };
          this.interpretarEscenarios('COMPARACION', formulario.comparacion, resultados.map((r: any) => ({
            monto: monto,
            tna: tna,
            frecuencia: frecuencia,
            plazoMeses: r.plazoMeses,
            cantidadCuotas: r.cantidadCuotas,
            cuota: r.cuota,
            interesesTotales: r.interesesTotales,
            total: r.total
          })));
        }
        catch (e) {
          formulario.comparacion.error =
            'La API devolvió resultados incompletos.';
        }
      }, (fallo: any) => {
        formulario.comparacion.enviando = false;
        this.cargandoComparacion = false;
        this.peticionComparacion = null;
        if (Number(this.solicitudId) !== idConsultado) {
          return;
        }
        formulario.comparacion.error =
          'Error al comparar plazos (HTTP ' +
          (fallo && fallo.status != null
            ? fallo.status : '?') +
          ')' + this.obtenerDetalleError(fallo);
      });
  }

  private interpretarEscenarios(tipo: string, formulario: any, escenarios: any[]) {
    this.cancelarInterpretacion();
    formulario.analisis = null;
    formulario.interpretacionIA = '';
    formulario.interpretacionAviso = '';
    formulario.interpretando = false;
    var usuario = this.obtenerUsuarioWms();
    if (!usuario) {
      formulario.interpretacionAviso =
        'No se pudo identificar la sesion WMS para interpretar los escenarios.';
      return;
    }
    var numeroSolicitud = Number(this.solicitudId);
    var version = this.versionConsultas;
    var headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('X-Femprobien-User', usuario);
    var options = new RequestOptions({ headers: headers });
    this.cargandoInterpretacion = true;
    formulario.interpretando = true;
    this.peticionInterpretacion = this.http.post(this.obtenerUrlBase() + '/femprobien/agente/interpretar-escenarios', { numeroSolicitud: numeroSolicitud, tipo: tipo, escenarios: escenarios }, options).subscribe((respuesta: Response) => {
      this.cargandoInterpretacion = false;
      this.peticionInterpretacion = null;
      if (version !== this.versionConsultas ||
        numeroSolicitud !== Number(this.solicitudId))
        return;
      formulario.interpretando = false;
      try {
        var datos = respuesta.json();
        if (!datos || Number(datos.numeroSolicitud) !== numeroSolicitud) {
          throw new Error('Respuesta de interpretacion incorrecta.');
        }
        formulario.analisis = datos.analisis || null;
        formulario.interpretacionIA = datos.respuestaIA || '';
        formulario.interpretacionAviso = datos.advertenciaIA || '';
      }
      catch (e) {
        formulario.interpretacionAviso =
          'BridgeApi devolvio una interpretacion incompleta.';
      }
    }, (fallo: any) => {
      this.cargandoInterpretacion = false;
      this.peticionInterpretacion = null;
      if (version !== this.versionConsultas ||
        numeroSolicitud !== Number(this.solicitudId))
        return;
      formulario.interpretando = false;
      formulario.interpretacionAviso =
        'No fue posible generar la interpretacion financiera (HTTP ' +
        (fallo && fallo.status != null ? fallo.status : '?') + ')' +
        this.obtenerDetalleError(fallo);
    });
  }

  private cancelarInterpretacion() {
    if (this.peticionInterpretacion) {
      this.peticionInterpretacion.unsubscribe();
      this.peticionInterpretacion = null;
    }
    this.cargandoInterpretacion = false;
  }

  public alternarAmortizacionComparacion(formulario: any, resultado: any) {
    if (!formulario || !resultado || !resultado.tablaAmortizacion ||
      !resultado.tablaAmortizacion.length) {
      return;
    }
    formulario.plazoVisible = formulario.plazoVisible === resultado.plazoMeses
      ? null : resultado.plazoMeses;
  }

  public exportarAmortizacionComparacion(resultado: any) {
    if (!resultado || !Array.isArray(resultado.tablaAmortizacion) ||
      resultado.tablaAmortizacion.length === 0) {
      return;
    }
    var csv = 'Cuota;Cuota a pagar;Interes;Capital amortizado;Saldo pendiente\r\n';
    for (var i = 0; i < resultado.tablaAmortizacion.length; i++) {
      var f = resultado.tablaAmortizacion[i];
      if (Number(f.numeroCuota) === 0) {
        continue;
      }
      csv += [f.numeroCuota, f.cuotaAPagar || 0, f.interes || 0,
      f.capitalAmortizado || 0, f.capitalVivo || 0].join(';') + '\r\n';
    }
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'comparacion_amortizacion_' + resultado.plazoMeses + '_meses.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private crearCreditoMultiple(datos: any, usarSolicitud: boolean): any {
    this.secuenciaCreditoMultiple++;
    return {
      id: this.secuenciaCreditoMultiple,
      monto: usarSolicitud
        ? this.obtenerMontoInicial(datos)
        : null,
      tna: this.obtenerTnaInicial(datos),
      anios: usarSolicitud
        ? this.obtenerAniosInicial(datos)
        : 1,
      frecuencia: this.obtenerFrecuenciaInicial(datos)
    };
  }

  private abrirFormularioMultiples(datos: any) {
    this.agregarMensaje('asistente', 'Simula varios créditos simultáneamente. ' +
      'Cada préstamo tiene condiciones independientes. ' +
      'BridgeApi calculará cada cuota y mostraremos ' +
      'un consolidado preliminar de las obligaciones.', 'multiples', {
      numeroSolicitud: Number(this.solicitudId),
      creditos: [
        this.crearCreditoMultiple(datos, true),
        this.crearCreditoMultiple(datos, false)
      ],
      resultados: null,
      consolidado: null,
      error: '',
      enviando: false
    });
  }

  public agregarCreditoMultiple(formulario: any) {
    if (!formulario ||
      formulario.enviando ||
      this.estaProcesando()) {
      return;
    }
    if (!formulario.creditos ||
      formulario.creditos.length >= 6) {
      formulario.error = 'Se permiten máximo seis créditos.';
      return;
    }
    formulario.creditos.push(this.crearCreditoMultiple(this.evaluacion, false));
    this.invalidarMultiples(formulario);
  }

  public eliminarCreditoMultiple(formulario: any, idCredito: number) {
    if (!formulario ||
      formulario.enviando ||
      this.estaProcesando() ||
      !formulario.creditos) {
      return;
    }
    if (formulario.creditos.length <= 2) {
      formulario.error =
        'La simulación conjunta requiere mínimo dos créditos.';
      return;
    }
    formulario.creditos =
      formulario.creditos.filter((credito: any) => credito.id !== idCredito);
    this.invalidarMultiples(formulario);
  }

  public invalidarMultiples(formulario: any) {
    if (!formulario || formulario.enviando) {
      return;
    }
    formulario.resultados = null;
    formulario.consolidado = null;
    formulario.error = '';
  }

  public ejecutarSimulacionMultiple(formulario: any) {
    if (!formulario ||
      formulario.enviando ||
      this.estaProcesando() ||
      !this.tieneSolicitud() ||
      Number(formulario.numeroSolicitud) !==
      Number(this.solicitudId)) {
      return;
    }
    formulario.error = '';
    formulario.resultados = null;
    formulario.consolidado = null;
    if (!formulario.creditos ||
      formulario.creditos.length < 2 ||
      formulario.creditos.length > 6) {
      formulario.error =
        'Debes agregar entre dos y seis créditos.';
      return;
    }
    var entradas: any[] = [];
    for (var i = 0; i < formulario.creditos.length; i++) {
      var credito = formulario.creditos[i];
      var frecuencia = String(credito.frecuencia || '').toUpperCase();
      var error = this.validarEscenario(credito.monto, credito.tna, credito.anios, frecuencia);
      if (error) {
        formulario.error =
          'Crédito ' + (i + 1) + ': ' + error;
        return;
      }
      entradas.push({
        id: credito.id,
        numero: i + 1,
        monto: Number(credito.monto),
        tna: Number(credito.tna),
        anios: Number(credito.anios),
        frecuencia: frecuencia,
        pagosPorAnio: this.pagosPorAnio(frecuencia),
        cantidadCuotas: Math.round(Number(credito.anios) *
          this.pagosPorAnio(frecuencia))
      });
    }
    var llamadas: Observable<Response>[] = [];
    for (var j = 0; j < entradas.length; j++) {
      var e = entradas[j];
      llamadas.push(this.consultarEscenario(e.monto, e.tna, e.anios, e.frecuencia));
    }
    var idConsultado = Number(this.solicitudId);
    formulario.enviando = true;
    this.cargandoMultiples = true;
    this.peticionMultiples =
      Observable.forkJoin(llamadas).subscribe((respuestas: Response[]) => {
        formulario.enviando = false;
        this.cargandoMultiples = false;
        this.peticionMultiples = null;
        if (Number(this.solicitudId) !== idConsultado) {
          return;
        }
        try {
          var resultados: any[] = [];
          var totalSolicitado = 0;
          var totalIntereses = 0;
          var totalPagar = 0;
          var sumaMensual = 0;
          for (var k = 0; k < respuestas.length; k++) {
            var r = respuestas[k].json();
            var entrada = entradas[k];
            if (!r ||
              r.monto == null ||
              r.cuota == null ||
              r.total == null ||
              r.interesesTotales == null ||
              r.cantidadCuotas == null) {
              throw new Error('Respuesta incompleta del crédito ' +
                entrada.numero);
            }
            var montoDevuelto = Number(r.monto);
            var cuota = Number(r.cuota);
            var intereses = Number(r.interesesTotales);
            var total = Number(r.total);
            if (!isFinite(montoDevuelto) ||
              !isFinite(cuota) ||
              !isFinite(intereses) ||
              !isFinite(total) ||
              cuota <= 0 ||
              intereses < 0 ||
              total < entrada.monto - 0.01 ||
              Math.abs(montoDevuelto -
                entrada.monto) > 0.01 ||
              Number(r.cantidadCuotas) !==
              entrada.cantidadCuotas ||
              String(r.frecuencia || '').toUpperCase() !==
              entrada.frecuencia) {
              throw new Error('Valores inconsistentes en el crédito ' +
                entrada.numero);
            }
            var equivalenteMensual = cuota * entrada.pagosPorAnio / 12;
            resultados.push({
              numeroCredito: entrada.numero,
              idCredito: entrada.id,
              monto: entrada.monto,
              tna: entrada.tna,
              anios: entrada.anios,
              plazoMeses: Number((entrada.anios * 12).toFixed(6)),
              frecuencia: entrada.frecuencia,
              cantidadCuotas: entrada.cantidadCuotas,
              cuota: cuota,
              cuotaMensualEquivalente: Number(equivalenteMensual.toFixed(2)),
              interesesTotales: intereses,
              totalPagar: total
            });
            totalSolicitado += entrada.monto;
            totalIntereses += intereses;
            totalPagar += total;
            sumaMensual += equivalenteMensual;
          }
          formulario.resultados = resultados;
          formulario.consolidado = {
            cantidadCreditos: resultados.length,
            totalSolicitado: Number(totalSolicitado.toFixed(2)),
            cuotaMensualEquivalente: Number(sumaMensual.toFixed(2)),
            totalIntereses: Number(totalIntereses.toFixed(2)),
            totalPagar: Number(totalPagar.toFixed(2)),
            estado: 'SIMULACION_PRELIMINAR'
          };
        }
        catch (e) {
          formulario.resultados = null;
          formulario.consolidado = null;
          formulario.error = 'No se pudieron consolidar los créditos: ' + e;
        }
      }, (fallo: any) => {
        formulario.enviando = false;
        this.cargandoMultiples = false;
        this.peticionMultiples = null;
        if (Number(this.solicitudId) !== idConsultado) {
          return;
        }
        formulario.error =
          'Falló uno de los escenarios (HTTP ' +
          (fallo && fallo.status != null
            ? fallo.status : '?') +
          ')' + this.obtenerDetalleError(fallo);
      });
  }

  public obtenerObservacionesResultadoEstudio(datos: any): string[] {
    var indicadores = datos && datos.indicadoresFinancieros || {};
    var pendientes: any[] = Array.isArray(indicadores.pendientes) ? indicadores.pendientes : [];
    var nomina = datos && datos.nomina || {};
    var cartera = datos && datos.cartera || {};
    var cupo = datos && datos.cupoHistorico || {};
    var sinCreditos = (cartera.sinCreditosRegistrados === true ||
      cupo.sinCreditosRegistrados === true) &&
      cartera.sinCreditosRegistrados !== false &&
      cupo.sinCreditosRegistrados !== false;
    var saldoCeroCertificado = (cartera.saldoCeroCertificado === true ||
      cupo.saldoCeroCertificado === true) &&
      cartera.saldoCeroCertificado !== false &&
      cupo.saldoCeroCertificado !== false;
    var nominaValidada = nomina.nominaMensualCompleta === true &&
      nomina.requiereValidacionDeducciones === false &&
      nomina.deduccionesValidadasParaProyeccion != null;
    var nominaIncompleta = nomina.nominaMensualCompleta === false;
    var nominaSinValidar = !nominaValidada && (nominaIncompleta ||
      nomina.requiereValidacionDeducciones === true ||
      nomina.periodicidadPendienteConfirmacion === true ||
      nomina.deduccionesValidadasParaProyeccion === null ||
      nomina.estadoValidacionDeducciones === 'REQUIERE_REVISION' ||
      nomina.estadoValidacionDeducciones === 'PENDIENTE_CERTIFICACION');
    var tienePendienteNomina = false;
    var tienePendienteIngresoVariable = false;
    var tienePendienteCartera = false;
    var tienePendienteImportacion = false;
    var otrasObservaciones: string[] = [];

    for (var i = 0; i < pendientes.length; i++) {
      var original = String(pendientes[i] || '').trim();
      if (!original)
        continue;
      if (/n[oó]mina|deducc|quincen|comisi[oó]n|horas extra|ingresos variables/i.test(original)) {
        tienePendienteNomina = true;
        if (/comisi[oó]n|horas extra|ingresos variables/i.test(original)) {
          tienePendienteIngresoVariable = true;
        }
      }
      else if (/registros? omitid|importaci[oó]n/i.test(original)) {
        tienePendienteImportacion = true;
      }
      else if (/cr[eé]dit|cartera|saldos?\b|obligacion|deudas?/i.test(original)) {
        tienePendienteCartera = true;
      }
      else if (otrasObservaciones.indexOf(original) === -1) {
        otrasObservaciones.push(original);
      }
    }
    var resultado: string[] = [];
    var comisiones: any[] = Array.isArray(nomina.comisionesConsolidadasDetalle)
      ? nomina.comisionesConsolidadasDetalle : [];
    if (comisiones.some((c: any) => c && c.validacionIngreso === 'PENDIENTE_VALIDACION')) {
      tienePendienteIngresoVariable = true;
    }
    if (nominaIncompleta) {
      resultado.push('No se encontraron las dos quincenas consecutivas esperadas. Consulta el detalle en Nómina.');
    }
    else if (nominaSinValidar || (tienePendienteNomina && !nominaValidada)) {
      resultado.push('Los ingresos o las deducciones observadas aún requieren validación para la proyección financiera. Consulta el detalle en Nómina.');
    }
    else if (tienePendienteIngresoVariable) {
      resultado.push('Los ingresos variables requieren confirmar su recurrencia. Consulta el detalle en Nómina.');
    }
    if (!saldoCeroCertificado && sinCreditos) {
      resultado.push('No hay créditos FEMPROBIEN registrados al corte; falta certificar la ausencia de obligaciones.');
    }
    else if (!saldoCeroCertificado &&
      (tienePendienteCartera || cupo.saldoCreditosAlCorte == null)) {
      resultado.push(cupo.saldoCreditosAlCorte != null
        ? 'El saldo de los créditos registrados al corte requiere confirmación.'
        : 'El saldo de créditos FEMPROBIEN aún no está confirmado.');
    }
    var omitidos = cupo.registrosOmitidosUltimaImportacion;
    if (omitidos == null)
      omitidos = cartera.registrosOmitidosUltimaImportacion;
    var cantidadOmitidos = Number(omitidos);
    if (omitidos != null && isFinite(cantidadOmitidos) && cantidadOmitidos > 0) {
      resultado.push('La última importación de cartera reportó ' + cantidadOmitidos +
        ' registros omitidos; debe verificarse si afectan las obligaciones del asociado.');
    }
    else if (tienePendienteImportacion) {
      resultado.push('La importación de cartera tiene observaciones pendientes de revisión.');
    }
    if (indicadores.cupoDisponible == null && cupo.cupoEstimadoAlCorte != null) {
      resultado.push('El cupo estimado corresponde al corte ' +
        (cupo.fechaCorte || cartera.fechaCorteUltimaImportacion || 'disponible') +
        ' y no representa cupo aprobado.');
    }
    else if (cupo.cupoPotencialSiNoHayDeuda != null &&
      indicadores.cupoDisponible == null &&
      (!sinCreditos || saldoCeroCertificado)) {
      resultado.push('El cupo potencial mostrado es hipotético: depende de que las obligaciones estén confirmadas.');
    }
    else if (indicadores.cupoDisponible == null &&
      cupo.cupoEstimadoAlCorte == null &&
      cupo.cupoPotencialSiNoHayDeuda == null) {
      resultado.push('No hay información suficiente para determinar el cupo disponible.');
    }
    return resultado.concat(otrasObservaciones);
  }

  public abrirAnalisisGeneral(modo: string = 'evaluar') {
    if (this.estaProcesando())
      return;
    this.abierto = true;
    this.maximizado = true;
    var formulario: any = this.analisisGeneralFormulario;
    if (!formulario) {
      var preseleccion: number[] = [];
      var actual = Number(this.solicitudId);
      if (this.tieneSolicitud() &&
        (this.solicitudesCredito || []).some((sol: any) => Number(sol.numero_solicitud) === actual)) {
        preseleccion.push(actual);
      }
      formulario = {
        modo: modo === 'simular' ? 'simular' : (modo === 'descargar' ? 'descargar' : 'evaluar'),
        busqueda: '',
        busquedaEvaluar: '',
        busquedaSimular: '',
        busquedaDescargar: '',
        idsSeleccionadosEvaluar: preseleccion.slice(),
        idsSeleccionadosSimular: [],
        idsSeleccionadosDescargar: [],
        idsSeleccionados: modo === 'simular' || modo === 'descargar'
          ? [] : preseleccion.slice(),
        filtroEstado: 'TODAS',
        filtroEstadoEvaluar: 'TODAS',
        filtroEstadoSimular: 'PENDIENTE',
        filtroEstadoDescargar: 'TODAS',
        error: '',
        excelEstado: ''
      };
      this.analisisGeneralFormulario = formulario;
    }
    else if (modo === 'simular' || modo === 'descargar') {
      this.cambiarModoAnalisisGeneral(formulario, modo);
    }
    var selector = this.buscarMensajePorTipo('seleccion_multiple');
    if (!selector || selector.datos !== formulario) {
      this.agregarMensaje('asistente', 'Análisis general: selecciona de 1 a 100 solicitudes, incluso de un mismo asociado. ' +
        'Evaluación, simulación y descarga conservan selecciones independientes.', 'seleccion_multiple', formulario);
      selector = this.buscarMensajePorTipo('seleccion_multiple');
    }
    if (formulario.modo === 'simular' && this.simulacionIntegralVisible &&
      this.simFormulario && this.simMensajeActual > 0) {
      var simulador = this.buscarMensajePorTipo('simulacion_masiva');
      if (simulador && simulador.datos &&
        Number(simulador.datos.id) === this.simMensajeActual) {
        this.simPanelExpandido = true;
        this.enfocarMensajeExistente(simulador);
        return;
      }
    }
    if (selector)
      this.enfocarMensajeExistente(selector);
  }

  public analisisGeneralFormularioModoSimulacion(): boolean {
    return !this.analisisGeneralFormulario ||
      this.analisisGeneralFormulario.modo === 'simular';
  }

  private guardarSeleccionGeneralPorModo(formulario: any) {
    if (!formulario)
      return;
    if (formulario.modo === 'simular') {
      formulario.idsSeleccionadosSimular = (formulario.idsSeleccionados || []).slice();
      formulario.busquedaSimular = String(formulario.busqueda || '');
      formulario.filtroEstadoSimular = formulario.filtroEstado || 'PENDIENTE';
    }
    else if (formulario.modo === 'descargar') {
      formulario.idsSeleccionadosDescargar = (formulario.idsSeleccionados || []).slice();
      formulario.busquedaDescargar = String(formulario.busqueda || '');
      formulario.filtroEstadoDescargar = formulario.filtroEstado || 'TODAS';
    }
    else {
      formulario.idsSeleccionadosEvaluar = (formulario.idsSeleccionados || []).slice();
      formulario.busquedaEvaluar = String(formulario.busqueda || '');
      formulario.filtroEstadoEvaluar = formulario.filtroEstado || 'PENDIENTE';
    }
  }

  public cambiarModoAnalisisGeneral(formulario: any, modo: string) {
    if (!formulario || this.estaProcesando() || this.descargandoEstudiosExcel)
      return;
    var destino = modo === 'simular' ? 'simular'
      : (modo === 'descargar' ? 'descargar' : 'evaluar');
    if (!Array.isArray(formulario.idsSeleccionadosEvaluar)) {
      formulario.idsSeleccionadosEvaluar = formulario.modo === 'evaluar'
        ? (formulario.idsSeleccionados || []).slice() : [];
    }
    if (!Array.isArray(formulario.idsSeleccionadosSimular)) {
      formulario.idsSeleccionadosSimular = formulario.modo === 'simular'
        ? (formulario.idsSeleccionados || []).slice() : [];
    }
    if (!Array.isArray(formulario.idsSeleccionadosDescargar)) {
      formulario.idsSeleccionadosDescargar = formulario.modo === 'descargar'
        ? (formulario.idsSeleccionados || []).slice() : [];
    }
    if (typeof formulario.busquedaEvaluar !== 'string') {
      formulario.busquedaEvaluar = formulario.modo === 'evaluar'
        ? String(formulario.busqueda || '') : '';
    }
    if (typeof formulario.busquedaSimular !== 'string') {
      formulario.busquedaSimular = formulario.modo === 'simular'
        ? String(formulario.busqueda || '') : '';
    }
    if (typeof formulario.busquedaDescargar !== 'string') {
      formulario.busquedaDescargar = formulario.modo === 'descargar'
        ? String(formulario.busqueda || '') : '';
    }
    if (typeof formulario.filtroEstadoEvaluar !== 'string') {
      formulario.filtroEstadoEvaluar = formulario.modo === 'evaluar'
        ? (formulario.filtroEstado || 'PENDIENTE') : 'PENDIENTE';
    }
    if (typeof formulario.filtroEstadoSimular !== 'string') {
      formulario.filtroEstadoSimular = formulario.modo === 'simular'
        ? (formulario.filtroEstado || 'PENDIENTE') : 'PENDIENTE';
    }
    if (typeof formulario.filtroEstadoDescargar !== 'string') {
      formulario.filtroEstadoDescargar = formulario.modo === 'descargar'
        ? (formulario.filtroEstado || 'TODAS') : 'TODAS';
    }

    this.guardarSeleccionGeneralPorModo(formulario);
    formulario.modo = destino;
    formulario.idsSeleccionados = destino === 'simular'
      ? formulario.idsSeleccionadosSimular.slice()
      : (destino === 'descargar'
        ? formulario.idsSeleccionadosDescargar.slice()
        : formulario.idsSeleccionadosEvaluar.slice());
    formulario.busqueda = destino === 'simular'
      ? formulario.busquedaSimular
      : (destino === 'descargar'
        ? formulario.busquedaDescargar : formulario.busquedaEvaluar);
    formulario.filtroEstado = destino === 'simular'
      ? formulario.filtroEstadoSimular
      : (destino === 'descargar'
        ? formulario.filtroEstadoDescargar : formulario.filtroEstadoEvaluar);
    formulario.error = '';
  }

  public abrirSelectorSimulacionMultiple() {
    this.abrirAnalisisGeneral('simular');
    this.simPanelExpandido = false;
    var mensajeExistente = this.buscarMensajePorTipo('seleccion_multiple');
    if (mensajeExistente) {
      this.enfocarMensajeExistente(mensajeExistente);
    }
  }

  private filaSimulacionDesdeSolicitud(numero: number, origen?: any): any {
    var encontrada: any = (this.solicitudesCredito || []).filter((s: any) => Number(s.numero_solicitud) === numero)[0] || {};
    var datos = origen && origen.datos ? origen.datos : {};
    var asociado = datos.asociado || {};
    var solicitud = datos.solicitud || {};
    var anterior = (this.simSeleccionadas || []).filter((f: any) => Number(f.numeroSolicitud) === numero)[0] || {};
    return {
      numeroSolicitud: numero,
      nombre: encontrada.nombre_completo_solicitante || encontrada.nom_aso ||
        asociado.nombre || 'Asociado sin nombre',
      documento: String(encontrada.numero_documento_solicitante ||
        encontrada.cod_asp || asociado.documento ||
        asociado.numeroDocumento || asociado.identificacion || '').trim(),
      empresa: encontrada.empresa_grupo ||
        (datos.nomina && datos.nomina.empresa) || '',
      estadoOriginal: this.estadoSolicitudGeneral(encontrada),
      montoRegistrado: encontrada.monto_solicitado != null
        ? encontrada.monto_solicitado : solicitud.montoSolicitado,
      monto: anterior.monto != null ? anterior.monto : '',
      plazoMeses: anterior.plazoMeses != null ? anterior.plazoMeses : '',
      tasaPorcentaje: anterior.tasaPorcentaje != null ? anterior.tasaPorcentaje : '',
      frecuenciaPago: anterior.frecuenciaPago || '',
      fechaPrimeraCuota: anterior.fechaPrimeraCuota || ''
    };
  }

  public prepararSimulacionVariasSolicitudes(formulario: any) {
    if (!formulario || this.estaProcesando())
      return;
    formulario.error = '';
    var ids: number[] = (formulario.idsSeleccionados || []).slice();
    if (ids.length < 1 || ids.length > 100) {
      formulario.error = 'Selecciona entre 1 y 100 solicitudes.';
      return;
    }
    var filas: any[] = [];
    for (var i = 0; i < ids.length; i++) {
      var id = Number(ids[i]);
      var origen = (this.solicitudesCredito || []).filter((s: any) => Number(s.numero_solicitud) === id)[0];
      if (!isFinite(id) || id <= 0 || Math.floor(id) !== id ||
        !origen || filas.some((f: any) => f.numeroSolicitud === id)) {
        formulario.error = 'La selección contiene solicitudes inválidas o repetidas.';
        return;
      }
      var estado = this.estadoSolicitudGeneral(origen);
      if (formulario.filtroEstado !== 'TODAS' &&
        formulario.filtroEstado !== estado) {
        formulario.error = 'La solicitud #' + id + ' (' + estado +
          ') está fuera del filtro actual. Usa "Todas" o ajusta la selección.';
        return;
      }
      filas.push(this.filaSimulacionDesdeSolicitud(id));
    }
    if (this.recuperarSimulacionMasiva(ids))
      return;
    this.simSeleccionadas = filas;
    this.simConfirmarNegadas = false;
    this.abrirSimulacionIntegral('MASIVA');
    this.simSolicitudesTexto = ids.join(', ');
  }

  public alternarConfiguracionSolicitudMasiva(numero: number) {
    if (this.estaProcesando())
      return;
    this.simSolicitudActiva = this.simSolicitudActiva === numero ? null : numero;
  }

  public tieneAjustesSolicitudMasiva(solicitud: any): boolean {
    if (!solicitud)
      return false;
    var tiene = (valor: any): boolean => valor !== null && valor !== undefined && valor !== '';
    return tiene(solicitud.monto) || tiene(solicitud.plazoMeses) ||
      tiene(solicitud.tasaPorcentaje) || tiene(solicitud.frecuenciaPago) ||
      tiene(solicitud.fechaPrimeraCuota);
  }

  public invalidarResultadosSimulacionMasiva() {
    var ids = (this.simSeleccionadas || []).map((f: any) => Number(f.numeroSolicitud));
    delete this.historialIA[this.claveMemoriaIALote(ids)];
    this.simMasiva = null;
    this.simError = '';
  }

  public cambiarAsociadosSimulacion() {
    if (this.estaProcesando())
      return;
    this.cerrarSimulacionIntegral();
    this.abrirAnalisisGeneral('simular');
  }

  public nombreDeAsociadoSimulado(numeroSolicitud: any): string {
    var fila = (this.simSeleccionadas || []).filter((s: any) => Number(s.numeroSolicitud) === Number(numeroSolicitud))[0];
    return fila ? fila.nombre : 'Asociado no identificado';
  }

  public abrirFormularioEvaluacionMultiple() {
    this.abrirAnalisisGeneral();
    if (this.analisisGeneralFormulario) {
      this.cambiarModoAnalisisGeneral(this.analisisGeneralFormulario, 'evaluar');
      this.simPanelExpandido = false;
      var mensajeSeleccionMultiple = this.buscarMensajePorTipo('seleccion_multiple');
      if (mensajeSeleccionMultiple)
        this.enfocarMensajeExistente(mensajeSeleccionMultiple);
    }
  }

  public estadoSolicitudGeneral(solicitud: any): string {
    var valor = solicitud && (solicitud.estado_credito ||
      solicitud.estadoCredito || solicitud.estadoSolicitud || solicitud.estado);
    var estado = String(valor || '').trim().toUpperCase()
      .replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
    if (estado.indexOf('PENDIENT') >= 0)
      return 'PENDIENTE';
    if (estado.indexOf('EN ESTUDIO') >= 0 || estado === 'ESTUDIO')
      return 'EN ESTUDIO';
    if (estado.indexOf('APROB') >= 0)
      return 'APROBADA';
    if (estado.indexOf('APLAZ') >= 0)
      return 'APLAZADA';
    if (estado.indexOf('NEGAD') >= 0 || estado.indexOf('RECHAZAD') >= 0)
      return 'NEGADA';
    return estado || 'SIN ESTADO';
  }

  public estadoDeSolicitudPorNumero(numero: any): string {
    var id = Number(numero);
    var solicitud = (this.solicitudesCredito || []).filter((s: any) => Number(s.numero_solicitud) === id)[0];
    return this.estadoSolicitudGeneral(solicitud);
  }

  public cambiarFiltroEstadoGeneral(formulario: any, estado: string) {
    if (!formulario || this.estaProcesando() || this.descargandoEstudiosExcel)
      return;
    var estados = ['TODAS', 'PENDIENTE', 'EN ESTUDIO',
      'APROBADA', 'APLAZADA', 'NEGADA'];
    formulario.filtroEstado = estados.indexOf(estado) >= 0 ? estado : 'PENDIENTE';
    formulario.error = '';
    this.guardarSeleccionGeneralPorModo(formulario);
  }

  private coincideFiltroGeneral(formulario: any, solicitud: any): boolean {
    if (!formulario)
      return true;
    var estado = this.estadoSolicitudGeneral(solicitud);
    var filtro = formulario.filtroEstado || 'PENDIENTE';
    return filtro === 'TODAS' || filtro === estado;
  }

  public contarSeleccionadasFueraFiltro(formulario: any): number {
    if (!formulario)
      return 0;
    var fuera = 0;
    (formulario.idsSeleccionados || []).forEach((id: number) => {
      var solicitud = (this.solicitudesCredito || []).filter((s: any) => Number(s.numero_solicitud) === Number(id))[0];
      if (!solicitud || !this.coincideFiltroGeneral(formulario, solicitud))
        fuera++;
    });
    return fuera;
  }

  public obtenerSolicitudesParaAnalisis(formulario: any): any[] {
    var texto = String(formulario && formulario.busqueda || '')
      .trim().toUpperCase();
    var vistos: number[] = [];
    return (this.solicitudesCredito || []).filter((s: any) => {
      var id = Number(s && s.numero_solicitud);
      if (!isFinite(id) || id <= 0 || Math.floor(id) !== id ||
        vistos.indexOf(id) >= 0)
        return false;
      vistos.push(id);
      if (!this.coincideFiltroGeneral(formulario, s))
        return false;
      if (!texto)
        return true;
      return [s.numero_solicitud, s.nombre_completo_solicitante,
      s.nom_aso, s.numero_documento_solicitante, s.cod_asp,
      s.empresa_grupo, s.estado_credito, s.destino_credito]
        .join(' ').toUpperCase().indexOf(texto) >= 0;
    });
  }

  public seleccionarTodasVisiblesGeneral(formulario: any) {
    if (!formulario || this.estaProcesando() || this.descargandoEstudiosExcel)
      return;
    var visibles = this.obtenerSolicitudesParaAnalisis(formulario);
    formulario.error = '';
    if (!visibles.length) {
      formulario.error = 'No hay solicitudes visibles para seleccionar.';
      return;
    }
    var nuevaSeleccion = visibles.slice(0, 100).map((s: any) => Number(s.numero_solicitud));
    var anteriorSeleccion = (formulario.idsSeleccionados || []).slice();
    formulario.idsSeleccionados = nuevaSeleccion;
    this.guardarSeleccionGeneralPorModo(formulario);
    if (formulario.modo === 'simular' &&
      !this.mismosNumerosSolicitud(anteriorSeleccion, nuevaSeleccion)) {
      this.invalidarLotePorCambioSeleccion();
    }
    if (visibles.length > 100) {
      formulario.error = 'Hay ' + visibles.length + ' solicitudes visibles. ' +
        'Se marcaron las primeras 100. Procesa las demás en otro lote.';
    }
  }

  public hayNegadasSimulacion(): boolean {
    var ids: number[] = (this.simSeleccionadas || []).map((f: any) => Number(f.numeroSolicitud));
    if (ids.length === 0) {
      var lineas = String(this.simSolicitudesTexto || '').split(/[,;\n\r\s]+/);
      ids = lineas.map((valor: string) => Number(valor.split('|')[0]))
        .filter((valor: number) => isFinite(valor) && valor > 0);
    }
    return ids.some((id: number) => this.estadoDeSolicitudPorNumero(id) === 'NEGADA');
  }

  public estaSolicitudMarcada(formulario: any, numero: any): boolean {
    return !!formulario &&
      !!formulario.idsSeleccionados &&
      formulario.idsSeleccionados.indexOf(Number(numero)) >= 0;
  }

  public cambiarSolicitudMarcada(formulario: any, numeroOriginal: any, marcado: boolean) {
    if (!formulario || this.estaProcesando() || this.descargandoEstudiosExcel) {
      return;
    }
    var numero = Number(numeroOriginal);
    var existe = (this.solicitudesCredito || []).some((s: any) => Number(s.numero_solicitud) === numero);
    if (!isFinite(numero) ||
      numero <= 0 ||
      Math.floor(numero) !== numero ||
      !existe) {
      formulario.error =
        'Esta solicitud no está disponible.';
      return;
    }
    var ids: number[] = formulario.idsSeleccionados || [];
    var posicion = ids.indexOf(numero);
    formulario.error = '';
    if (marcado && posicion < 0) {
      if (ids.length >= 100) {
        formulario.error =
          'El máximo es 100 solicitudes.';
        return;
      }
      ids.push(numero);
    }
    else if (!marcado && posicion >= 0) {
      ids.splice(posicion, 1);
    }
    if ((marcado && posicion >= 0) || (!marcado && posicion < 0))
      return;
    formulario.idsSeleccionados = ids;
    this.guardarSeleccionGeneralPorModo(formulario);
    if (formulario === this.analisisGeneralFormulario &&
      formulario.modo === 'simular') {
      this.invalidarLotePorCambioSeleccion();
    }
  }

  public limpiarSeleccionGeneral(formulario: any) {
    if (!formulario || this.estaProcesando() || this.descargandoEstudiosExcel)
      return;
    var teniaSeleccion = (formulario.idsSeleccionados || []).length > 0;
    formulario.idsSeleccionados = [];
    formulario.error = '';
    this.guardarSeleccionGeneralPorModo(formulario);
    if (teniaSeleccion && formulario.modo === 'simular') {
      this.invalidarLotePorCambioSeleccion();
    }
  }

  private invalidarLotePorCambioSeleccion() {
    this.cerrarSimulacionIntegral();
    this.simSeleccionadas = [];
    this.simSolicitudActiva = null;
    this.simFormulario = null;
    this.simMasiva = null;
    this.simSolicitudesTexto = '';
    this.simConfirmarNegadas = false;
    this.simError = '';
  }

  public ejecutarEvaluacionSeleccionada(formulario: any) {
    if (!formulario || this.estaProcesando()) {
      return;
    }
    formulario.error = '';
    var ids: number[] = (formulario.idsSeleccionados || []).slice();
    if (ids.length < 1 || ids.length > 100) {
      formulario.error =
        'Selecciona entre 1 y 100 solicitudes.';
      return;
    }
    if (this.contarSeleccionadasFueraFiltro(formulario) > 0) {
      formulario.error = 'Hay solicitudes seleccionadas fuera del filtro actual. ' +
        'Elige "Todas" o ajusta la selección antes de evaluar.';
      return;
    }
    var disponibles = (this.solicitudesCredito || []).map((s: any) => Number(s.numero_solicitud));
    for (var i = 0; i < ids.length; i++) {
      if (disponibles.indexOf(ids[i]) < 0) {
        formulario.error =
          'Una solicitud dejó de estar disponible. ' +
          'Actualiza tu selección.';
        return;
      }
    }
    this.evaluarVariasSolicitudes(ids);
  }

  public evaluarVariasSolicitudes(numeros: number[]) {
    if (this.estaProcesando()) {
      return;
    }
    var ids: number[] = [];
    var entradas = numeros || [];
    for (var i = 0; i < entradas.length; i++) {
      var numero = Number(entradas[i]);
      if (!isFinite(numero) ||
        numero <= 0 ||
        Math.floor(numero) !== numero) {
        this.abierto = true;
        this.agregarMensaje('asistente', 'La selección contiene un número de solicitud inválido.');
        return;
      }
      if (ids.indexOf(numero) < 0) {
        ids.push(numero);
      }
    }
    if (ids.length < 1 || ids.length > 100) {
      this.abierto = true;
      this.agregarMensaje('asistente', 'Debes seleccionar entre 1 y 100 solicitudes distintas.');
      return;
    }
    this.abierto = true;
    this.maximizado = true;
    this.agregarMensaje('usuario', 'Evaluar solicitudes: ' +
      ids.map((n: number) => '#' + n).join(', '));
    var versionActual = this.versionConsultas;
    var base = this.obtenerUrlBase();
    var consultas: Observable<any>[] = ids.map((id: number) => {
      var url = base +
        '/femprobien/evaluacion/solicitudes/' + id;
      return this.http.get(url)
        .map((response: Response) => {
          var datos: any = response.json();
          if (!datos ||
            !datos.solicitud ||
            !datos.resumenFinancieroAgente ||
            !datos.asociado ||
            Number(datos.solicitud.numeroSolicitud) !== id) {
            throw new Error('Respuesta incompleta o solicitud incorrecta.');
          }
          return {
            numeroSolicitud: id,
            correcto: true,
            datos: datos,
            error: null
          };
        })
        .catch((fallo: any) => {
          var estado = fallo && fallo.status != null
            ? fallo.status : null;
          var detalle = estado === 401 || estado === 403
            ? 'No autorizado para consultar esta solicitud.'
            : estado === 404
              ? 'La solicitud no existe o no está disponible.'
              : estado === 0
                ? 'Sin conexión con BridgeApi.'
                : 'No fue posible evaluar esta solicitud' +
                (estado == null
                  ? '.'
                  : ' (HTTP ' + estado + ').');
          return Observable.of({
            numeroSolicitud: id,
            correcto: false,
            datos: null,
            error: detalle
          });
        });
    });
    this.cargandoEvaluacionMultiple = true;
    this.peticionEvaluacionMultiple =
      Observable.forkJoin(consultas).subscribe((resultados: any[]) => {
        this.peticionEvaluacionMultiple = null;
        if (versionActual !== this.versionConsultas) {
          return;
        }
        this.cargandoEvaluacionMultiple = false;
        var correctos = resultados.filter((item: any) => item.correcto).length;
        this.agregarMensaje('asistente', 'Evaluación completada: ' +
          correctos + ' de ' +
          resultados.length +
          ' solicitudes consultadas correctamente.', 'evaluacion_multiple', {
          resultados: resultados,
          numeroSolicitudes: ids.slice(),
          total: resultados.length,
          correctos: correctos,
          fallidas: resultados.length - correctos,
          detalleActivo: null
        });
      }, (fallo: any) => {
        this.peticionEvaluacionMultiple = null;
        if (versionActual !== this.versionConsultas) {
          return;
        }
        this.cargandoEvaluacionMultiple = false;
        this.agregarMensaje('asistente', 'No fue posible completar la consulta múltiple. ' +
          'Revisa la conexión con BridgeApi.');
      });
  }

  public idsEstudiosCorrectosParaExcel(reporte: any): number[] {
    if (!reporte || !Array.isArray(reporte.resultados))
      return [];
    return reporte.resultados
      .filter((item: any) => item && item.correcto)
      .map((item: any) => Number(item.numeroSolicitud))
      .filter((id: number, index: number, todos: number[]) => isFinite(id) && id > 0 && Math.floor(id) === id && todos.indexOf(id) === index);
  }

  public descargarExcelSeleccionGeneral(formulario: any) {
    if (!formulario)
      return;
    formulario.error = '';
    formulario.excelEstado = '';
    if (this.descargandoEstudiosExcel || this.estaProcesando()) {
      formulario.error = 'Hay otra consulta o descarga en curso. Intenta al terminar.';
      return;
    }
    if (formulario.modo !== 'descargar') {
      formulario.error = 'Abre la pestaña Descargar créditos para exportar los estudios registrados.';
      return;
    }
    var seleccion: any[] = Array.isArray(formulario.idsSeleccionados)
      ? formulario.idsSeleccionados.slice() : [];
    var ids: number[] = [];
    for (var i = 0; i < seleccion.length; i++) {
      var n = Number(seleccion[i]);
      if (!isFinite(n) || n <= 0 || Math.floor(n) !== n || ids.indexOf(n) >= 0) {
        formulario.error = 'La seleccion contiene numeros de solicitud invalidos o repetidos.';
        return;
      }
      ids.push(n);
    }
    if (ids.length < 1 || ids.length > 100) {
      formulario.error = 'Selecciona entre 1 y 100 solicitudes para descargar.';
      return;
    }
    var disponibles: number[] = (this.solicitudesCredito || [])
      .map((s: any) => Number(s && s.numero_solicitud));
    for (var j = 0; j < ids.length; j++) {
      if (disponibles.indexOf(ids[j]) < 0) {
        formulario.error = 'La solicitud #' + ids[j] +
          ' ya no esta cargada. Actualiza la lista antes de descargar.';
        return;
      }
    }
    this.ejecutarDescargaEstudiosExcel(ids, formulario);
  }

  public descargarEstudiosExcel(entrada: number[]) {
    if (this.descargandoEstudiosExcel || this.estaProcesando())
      return;
    var ids: number[] = [];
    (entrada || []).forEach((valor: number) => {
      var n = Number(valor);
      if (isFinite(n) && n > 0 && Math.floor(n) === n && ids.indexOf(n) < 0) {
        ids.push(n);
      }
    });
    if (ids.length < 1 || ids.length > 100) {
      this.agregarMensaje('asistente', 'Para descargar el estudio selecciona entre 1 y 100 solicitudes validas.');
      return;
    }
    this.ejecutarDescargaEstudiosExcel(ids);
  }

  private ejecutarDescargaEstudiosExcel(ids: number[], formulario?: any) {
    if (this.descargandoEstudiosExcel)
      return;
    var url = this.obtenerUrlBase() + '/femprobien/evaluacion/estudios-excel';
    if (formulario) {
      formulario.error = '';
      formulario.excelEstado = 'Generando el Excel de ' + ids.length +
        ' solicitudes: ' + ids.map((id: number) => '#' + id).join(', ') + '. ' +
        'La generacion puede demorar mientras BridgeApi consulta cada estudio.';
    }
    var opciones = new RequestOptions({
      headers: new Headers({
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json'
      }),
      responseType: ResponseContentType.Blob
    });
    this.descargandoEstudiosExcel = true;
    try {
      this.peticionExcel = this.http.post(url, { numeroSolicitudes: ids }, opciones).subscribe((response: Response) => {
        this.descargandoEstudiosExcel = false;
        this.peticionExcel = null;
        var archivo: Blob;
        try {
          archivo = response.blob();
        }
        catch (error) {
          this.mostrarErrorDescargaExcel(formulario, 'La respuesta de BridgeApi no contiene un archivo descargable.');
          return;
        }
        if (!archivo || archivo.size === 0) {
          this.mostrarErrorDescargaExcel(formulario, 'BridgeApi devolvio un archivo vacio.');
          return;
        }
        var tipo = String(response.headers && response.headers.get('Content-Type') || '').toLowerCase();
        if (tipo.indexOf('application/json') >= 0 || tipo.indexOf('text/html') >= 0) {
          this.mostrarErrorDescargaExcel(formulario, 'BridgeApi devolvio una respuesta de texto, no un Excel. Comprueba el controlador desplegado.');
          return;
        }
        var nombre = ids.length === 1
          ? 'Estudio_FEMPROBIEN_' + ids[0] + '.xlsx'
          : 'Estudios_FEMPROBIEN_' + ids.length + '_solicitudes.xlsx';
        var disposicion = response.headers && response.headers.get('Content-Disposition');
        if (disposicion) {
          var coincidencia = /filename="?([^";]+)"?/i.exec(disposicion);
          if (coincidencia && /\.xlsx$/i.test(coincidencia[1])) {
            nombre = coincidencia[1].replace(/[^a-zA-Z0-9_.-]/g, '_');
          }
        }
        try {
          var navegador: any = window.navigator;
          if (navegador && navegador.msSaveOrOpenBlob) {
            navegador.msSaveOrOpenBlob(archivo, nombre);
          }
          else {
            var urlTemporal = window.URL.createObjectURL(archivo);
            var enlace = document.createElement('a');
            enlace.href = urlTemporal;
            enlace.download = nombre;
            enlace.style.display = 'none';
            document.body.appendChild(enlace);
            enlace.click();
            document.body.removeChild(enlace);
            window.setTimeout(() => window.URL.revokeObjectURL(urlTemporal), 30000);
          }
          if (formulario) {
            formulario.excelEstado = 'Excel preparado: ' + nombre +
              '. Comprueba la carpeta Descargas del navegador.';
          }
        }
        catch (error) {
          this.mostrarErrorDescargaExcel(formulario, 'Se genero el Excel, pero el navegador no pudo iniciar la descarga. ' +
            'Revisa los permisos de descarga del navegador.');
        }
      }, (fallo: any) => {
        this.descargandoEstudiosExcel = false;
        this.peticionExcel = null;
        var estado: number = fallo && typeof fallo.status === 'number' ? fallo.status : 0;
        var mensaje = estado === 400
          ? 'BridgeApi rechazo los numeros de solicitud enviados (HTTP 400).'
          : estado === 404
            ? 'No se encontro /femprobien/evaluacion/estudios-excel (HTTP 404). Comprueba el despliegue.'
            : estado === 422
              ? 'BridgeApi no pudo generar el lote (HTTP 422). Una solicitud puede tener datos incompletos. ' +
              'Consulta los registros del servidor para identificarla.'
              : estado === 500 || estado === 503
                ? 'Fallo interno en BridgeApi o sus consultas (HTTP ' + estado + '). Revisa el log de Java.'
                : estado === 401 || estado === 403
                  ? 'El endpoint rechazo la solicitud por acceso (HTTP ' + estado + ').'
                  : estado === 0
                    ? 'El navegador bloqueo la peticion o no pudo conectar. Revisa F12 > Red y Console (CORS/HTTPS).'
                    : 'No se pudo descargar el Excel (HTTP ' + estado + ').';
        var cuerpo: Blob | null = null;
        try {
          if (fallo && typeof fallo.blob === 'function')
            cuerpo = fallo.blob();
        }
        catch (ex) {
          cuerpo = null;
        }
        if (cuerpo && cuerpo.size > 0 && cuerpo.size < 8192 && typeof FileReader !== 'undefined') {
          var lector = new FileReader();
          lector.onload = () => {
            var detalle = '';
            try {
              var respuesta = JSON.parse(String(lector.result || '{}'));
              if (respuesta && typeof respuesta.mensaje === 'string')
                detalle = respuesta.mensaje.trim();
            }
            catch (ex) { }
            this.mostrarErrorDescargaExcel(formulario, detalle ? mensaje + ' ' + detalle : mensaje);
          };
          lector.onerror = () => this.mostrarErrorDescargaExcel(formulario, mensaje);
          try {
            lector.readAsText(cuerpo);
          }
          catch (ex) {
            this.mostrarErrorDescargaExcel(formulario, mensaje);
          }
        }
        else {
          this.mostrarErrorDescargaExcel(formulario, mensaje);
        }
      });
    }
    catch (error) {
      this.descargandoEstudiosExcel = false;
      this.peticionExcel = null;
      this.mostrarErrorDescargaExcel(formulario, 'No se pudo iniciar la peticion al endpoint de Excel. Revisa la consola del navegador.');
    }
  }

  private mostrarErrorDescargaExcel(formulario: any, mensaje: string) {
    if (formulario) {
      formulario.excelEstado = '';
      formulario.error = mensaje;
    }
    else {
      this.agregarMensaje('asistente', mensaje);
    }
  }

  public alternarDetalleEvaluacion(reporte: any, numeroSolicitud: number) {
    if (!reporte || !reporte.resultados) {
      return;
    }
    var encontrado = reporte.resultados.some((r: any) => r.correcto &&
      Number(r.numeroSolicitud) ===
      Number(numeroSolicitud));
    if (!encontrado) {
      return;
    }
    reporte.detalleActivo =
      Number(reporte.detalleActivo) ===
        Number(numeroSolicitud)
        ? null
        : Number(numeroSolicitud);
  }

  private obtenerDetalleError(fallo: any): string {
    if (!fallo) {
      return '.';
    }
    if (fallo.status === 0) {
      return ': verifica la URL, HTTPS, red y CORS.';
    }
    try {
      var detalle = fallo.json();
      var mensaje = detalle &&
        (detalle.message ||
          detalle.mensaje ||
          detalle.error);
      if (typeof mensaje === 'string' &&
        mensaje.trim()) {
        return ': ' + mensaje + '.';
      }
    }
    catch (e) {
    }
    return '.';
  }

  private agregarMensaje(rol: 'asistente' | 'usuario', contenido: string, tipo: string = 'texto', datos: any = null) {
    this.mensajes.push({
      rol: rol,
      contenido: contenido,
      fecha: new Date(),
      tipo: tipo,
      datos: datos
    });
    this.irAlUltimoMensaje();
  }

  private irAlUltimoMensaje() {
    setTimeout(() => {
      if (!this.historialMensajes || !this.historialMensajes.nativeElement)
        return;
      var contenedor = this.historialMensajes.nativeElement;
      contenedor.scrollTop = contenedor.scrollHeight;
    }, 0);
  }

  private buscarMensajePorTipo(tipo: string, solicitud?: number): MensajeAgente | null {
    for (var i = this.mensajes.length - 1; i >= 0; i--) {
      var m = this.mensajes[i];
      if (m.tipo !== tipo)
        continue;
      if (solicitud != null) {
        var id = m.datos && (m.datos.numeroSolicitud != null
          ? m.datos.numeroSolicitud
          : m.datos.solicitud && m.datos.solicitud.numeroSolicitud);
        if (Number(id) !== Number(solicitud))
          continue;
      }
      return m;
    }
    return null;
  }

  private enfocarMensajeExistente(mensaje: MensajeAgente) {
    if (!mensaje)
      return;
    var posicion = this.mensajes.indexOf(mensaje);
    if (posicion < 0)
      return;
    if (posicion !== this.mensajes.length - 1) {
      this.mensajes.splice(posicion, 1);
      this.mensajes.push(mensaje);
    }
    this.irAlUltimoMensaje();
  }

  private mismosNumerosSolicitud(a: number[], b: number[]): boolean {
    if (!a || !b || a.length !== b.length)
      return false;
    return a.every((id: number) => b.indexOf(Number(id)) >= 0);
  }

  private recuperarSimulacionMasiva(ids: number[]): boolean {
    if (!this.simFormulario || this.simMensajeActual <= 0 ||
      !this.mismosNumerosSolicitud(ids, (this.simSeleccionadas || []).map((s: any) => Number(s.numeroSolicitud)))) {
      return false;
    }
    var anterior = this.buscarMensajePorTipo('simulacion_masiva');
    if (!anterior || !anterior.datos ||
      Number(anterior.datos.id) !== this.simMensajeActual)
      return false;
    this.simulacionIntegralVisible = true;
    this.simPanelExpandido = true;
    this.simSolicitudesTexto = ids.join(', ');
    this.enfocarMensajeExistente(anterior);
    return true;
  }

  public abrirSimulacionMasivaDesdeEvaluacion(reporte: any) {
    if (!reporte || !reporte.resultados || this.estaProcesando())
      return;
    var ids: number[] = [];
    for (var i = 0; i < reporte.resultados.length; i++) {
      var item = reporte.resultados[i];
      var n = Number(item.numeroSolicitud);
      if (item.correcto && isFinite(n) && n > 0 && ids.indexOf(n) < 0) {
        ids.push(n);
      }
    }
    if (ids.length < 1) {
      this.error = 'Se requiere al menos una solicitud evaluada correctamente.';
      return;
    }
    if (ids.length > 100) {
      this.error = 'La simulación por lote admite máximo 100 solicitudes desde el agente.';
      return;
    }
    if (this.analisisGeneralFormulario) {
      this.cambiarModoAnalisisGeneral(this.analisisGeneralFormulario, 'simular');
      this.analisisGeneralFormulario.idsSeleccionados = ids.slice();
      this.guardarSeleccionGeneralPorModo(this.analisisGeneralFormulario);
      this.analisisGeneralFormulario.error = '';
    }
    if (this.recuperarSimulacionMasiva(ids))
      return;
    this.simConfirmarNegadas = false;
    this.simSeleccionadas = ids.map((id: number) => {
      var origen = reporte.resultados.filter((r: any) => Number(r.numeroSolicitud) === id)[0];
      return this.filaSimulacionDesdeSolicitud(id, origen);
    });
    this.abrirSimulacionIntegral('MASIVA');
    this.simSolicitudesTexto = ids.join(', ');
  }

  public abrirSimulacionIntegral(modo: string) {
    if (modo !== 'MASIVA' || this.estaProcesando())
      return;
    this.simulacionIntegralVisible = true;
    this.simPanelExpandido = true;
    this.simMensajeActual = ++this.simMensajeSecuencia;
    this.agregarMensaje('asistente', 'Simulación masiva preparada. Puedes configurar solicitudes y continuar conversando sin cerrar nada.', 'simulacion_masiva', { id: this.simMensajeActual });
    this.simConfirmarNegadas = false;
    this.maximizado = true;
    this.simError = '';
    this.simMasiva = null;
    this.simSolicitudActiva = null;
    this.simFormulario = {
      monto: null,
      plazoMeses: '',
      tasaPorcentaje: '',
      tipoTasa: 'TNA_30_360',
      tipoTasaAnterior: 'TNA_30_360',
      frecuenciaPago: '',
      fechaPrimeraCuota: '',
      salarioBasico: '',
      comisionesPrestacionales: '',
      horasExtrasPrestacionales: '',
      bonificacionesNoPrestacionales: '',
      incluirVariablesEnEscenario: false,
      usarDeduccionesManuales: false,
      deducciones: [
        { concepto: 'Ahorro FEMPROBIEN', valor: '' },
        { concepto: 'Salud', valor: '' },
        { concepto: 'Pensión', valor: '' },
        { concepto: 'Préstamos externos', valor: '' },
        { concepto: 'Anticipos', valor: '' },
        { concepto: 'Crédito FEMPROBIEN', valor: '' },
        { concepto: 'Otras deducciones', valor: '' }
      ]
    };
  }

  public cambiarTipoTasaIntegral(nuevaConvencion: string) {
    if (!this.simFormulario)
      return;
    var anterior = this.simFormulario.tipoTasaAnterior || 'TNA_30_360';
    var actual = nuevaConvencion;
    var tasa = Number(this.simFormulario.tasaPorcentaje);
    if (this.simFormulario.tasaPorcentaje !== '' &&
      this.simFormulario.tasaPorcentaje !== null &&
      this.simFormulario.tasaPorcentaje !== undefined &&
      anterior !== actual && isFinite(tasa) && tasa >= 0) {
      if (anterior === 'TNA_30_360' && actual === 'MENSUAL') {
        this.simFormulario.tasaPorcentaje = Number((tasa / 12).toFixed(6));
      }
      else if (anterior === 'MENSUAL' && actual === 'TNA_30_360') {
        this.simFormulario.tasaPorcentaje = Number((tasa * 12).toFixed(6));
      }
    }
    if (anterior !== actual) {
      for (var i = 0; i < (this.simSeleccionadas || []).length; i++) {
        var fila = this.simSeleccionadas[i];
        if (fila.tasaPorcentaje === '' || fila.tasaPorcentaje === null ||
          fila.tasaPorcentaje === undefined)
          continue;
        var tasaFila = Number(fila.tasaPorcentaje);
        if (!isFinite(tasaFila) || tasaFila < 0)
          continue;
        fila.tasaPorcentaje = Number((anterior === 'TNA_30_360'
          ? tasaFila / 12 : tasaFila * 12).toFixed(6));
      }
    }
    this.simFormulario.tipoTasaAnterior = actual;
    this.invalidarResultadosSimulacionMasiva();
  }

  public alternarPanelSimulacionMasiva() {
    this.simPanelExpandido = !this.simPanelExpandido;
  }

  public cerrarSimulacionIntegral() {
    this.cancelarSimulacionIntegral();
    this.simulacionIntegralVisible = false;
    this.simPanelExpandido = false;
  }

  private cancelarSimulacionIntegral() {
    if (this.peticionIntegral) {
      this.peticionIntegral.unsubscribe();
      this.peticionIntegral = null;
    }
    this.cargandoSimulacionIntegral = false;
  }

  private simParametros(formulario: any, incluirMonto: boolean): any {
    var p: any = {};
    var tiene = (v: any): boolean => v !== '' && v !== null && v !== undefined;
    if (incluirMonto && tiene(formulario.monto)) {
      var monto = Number(formulario.monto);
      if (!isFinite(monto) || monto <= 0)
        throw new Error('Monto inválido.');
      p.monto = monto;
    }
    if (tiene(formulario.plazoMeses)) {
      var plazo = Number(formulario.plazoMeses);
      if (!isFinite(plazo) || plazo < 1 || plazo > 120 || Math.floor(plazo) !== plazo) {
        throw new Error('El plazo común debe ser un número entero entre 1 y 120 meses.');
      }
      p.plazoMeses = plazo;
    }
    if (tiene(formulario.tasaPorcentaje)) {
      var tasa = Number(formulario.tasaPorcentaje);
      if (!isFinite(tasa) || tasa < 0 || tasa > 100) {
        throw new Error('La tasa común debe estar entre 0 y 100 %.');
      }
      p.tipoTasa = formulario.tipoTasa || 'TNA_30_360';
      p.tasaPorcentaje = tasa;
    }
    if (tiene(formulario.frecuenciaPago)) {
      var frecuencia = String(formulario.frecuenciaPago).toUpperCase();
      if (frecuencia !== 'MENSUAL' && frecuencia !== 'QUINCENAL') {
        throw new Error('Frecuencia común inválida.');
      }
      p.frecuenciaPago = frecuencia;
    }
    if (tiene(formulario.fechaPrimeraCuota))
      p.fechaPrimeraCuota = formulario.fechaPrimeraCuota;
    return p;
  }

  private simBody(numero: number, f: any, incluirMonto: boolean): any {
    var body: any = { numeroSolicitud: numero, parametros: this.simParametros(f, incluirMonto) };
    var manual: any = {};
    var campos = ['salarioBasico', 'comisionesPrestacionales',
      'horasExtrasPrestacionales', 'bonificacionesNoPrestacionales'];
    for (var i = 0; i < campos.length; i++) {
      var k = campos[i];
      if (f[k] !== '' && f[k] !== undefined && f[k] !== null) {
        manual[k] = Number(f[k]);
      }
    }
    if (f.incluirVariablesEnEscenario)
      manual.incluirVariablesEnEscenario = true;
    if (Object.keys(manual).length > 0)
      body.ingresos = manual;
    if (f.usarDeduccionesManuales) {
      var detalle: any[] = [];
      for (var j = 0; j < f.deducciones.length; j++) {
        var d = f.deducciones[j];
        if (d.valor !== '' && d.valor !== null && d.valor !== undefined) {
          detalle.push({ concepto: d.concepto, valor: Number(d.valor) });
        }
      }
      if (detalle.length === 0)
        throw new Error('Ingresa al menos una deducción manual (puede ser cero).');
      body.deducciones = { detalle: detalle };
    }
    return body;
  }

  private validarDatosManualesLote(ids: number[]): string {
    if (!this.simFormulario || !ids || ids.length < 2)
      return '';
    var f: any = this.simFormulario;
    var tiene = (valor: any): boolean => valor !== '' && valor !== null && valor !== undefined;
    var ingresosManuales = ['salarioBasico', 'comisionesPrestacionales',
      'horasExtrasPrestacionales', 'bonificacionesNoPrestacionales']
      .some((campo: string) => tiene(f[campo]));
    var deduccionesManuales = !!f.usarDeduccionesManuales;
    if (!ingresosManuales && !deduccionesManuales)
      return '';
    var documentos: string[] = [];
    for (var i = 0; i < ids.length; i++) {
      var numero = Number(ids[i]);
      var fila: any = (this.simSeleccionadas || []).filter((s: any) => Number(s.numeroSolicitud) === numero)[0];
      var origen: any = (this.solicitudesCredito || []).filter((s: any) => Number(s.numero_solicitud) === numero)[0];
      var documento = String((fila && fila.documento) ||
        (origen && (origen.numero_documento_solicitante || origen.cod_asp)) || '').trim();
      if (!documento) {
        return 'No se puede aplicar nomina o deducciones manuales compartidas: ' +
          'falta identificar el asociado de la solicitud #' + numero + '.';
      }
      if (documentos.indexOf(documento) < 0)
        documentos.push(documento);
    }
    if (documentos.length > 1) {
      return 'El lote contiene solicitudes de asociados diferentes. ' +
        'No es seguro aplicarles un mismo salario, ingresos variables o ' +
        'deducciones manuales. Deja vacios los ingresos comunes y desactiva ' +
        'las deducciones manuales para utilizar los datos propios de cada ' +
        'solicitud recuperados por BridgeApi.';
    }
    return '';
  }

  public ejecutarSimulacionMasiva() {
    if (!this.simFormulario || this.estaProcesando())
      return;
    this.simError = '';
    this.simMasiva = null;
    var textoSolicitudes = String(this.simSolicitudesTexto || '').trim();
    var ids: number[] = [];
    var filas: any[] = [];
    var porFila = textoSolicitudes.indexOf('|') >= 0;
    if (this.simSeleccionadas && this.simSeleccionadas.length > 0) {
      porFila = true;
      for (var s = 0; s < this.simSeleccionadas.length; s++) {
        var f = this.simSeleccionadas[s];
        var seleccionado = Number(f.numeroSolicitud);
        if (!isFinite(seleccionado) || seleccionado <= 0 ||
          Math.floor(seleccionado) !== seleccionado ||
          ids.indexOf(seleccionado) >= 0) {
          this.simError = 'Solicitud inválida o repetida en la selección.';
          return;
        }
        ids.push(seleccionado);
        filas.push({
          id: seleccionado,
          monto: f.monto,
          plazo: f.plazoMeses,
          tasa: f.tasaPorcentaje,
          frecuencia: f.frecuenciaPago,
          fechaPrimeraCuota: f.fechaPrimeraCuota
        });
      }
    }
    else if (porFila) {
      var lineas = textoSolicitudes.split(/\r?\n/);
      for (var k = 0; k < lineas.length; k++) {
        var linea = lineas[k].trim();
        if (!linea)
          continue;
        var c = linea.split('|').map((v: string) => v.trim());
        if (c.length > 5 || c.length < 1) {
          this.simError = 'Formato de lote inválido en línea ' + (k + 1);
          return;
        }
        var id = Number(c[0]);
        if (!isFinite(id) || id <= 0 || Math.floor(id) !== id || ids.indexOf(id) >= 0) {
          this.simError = 'Número de solicitud inválido o repetido en línea ' + (k + 1);
          return;
        }
        ids.push(id);
        filas.push({ id: id, monto: c[1], plazo: c[2], tasa: c[3], frecuencia: c[4] });
      }
    }
    else {
      var raw = textoSolicitudes.split(/[,;\s]+/).filter((v: string) => !!v);
      for (var i = 0; i < raw.length; i++) {
        var numero = Number(raw[i]);
        if (!isFinite(numero) || numero <= 0 || Math.floor(numero) !== numero || ids.indexOf(numero) >= 0) {
          this.simError = 'La lista contiene números de solicitud inválidos o repetidos.';
          return;
        }
        ids.push(numero);
        filas.push({ id: numero });
      }
    }
    if (ids.length < 1 || ids.length > 100) {
      this.simError = 'Selecciona entre 1 y 100 solicitudes diferentes por lote.';
      return;
    }
    var negadas: number[] = [];
    for (var n = 0; n < ids.length; n++) {
      var idActual = ids[n];
      var estadoActual = this.estadoDeSolicitudPorNumero(idActual);
      if (estadoActual === 'NEGADA')
        negadas.push(idActual);
    }
    if (negadas.length > 0 && !this.simConfirmarNegadas) {
      this.simError = 'Confirma la simulación hipotética de las solicitudes NEGADAS: ' +
        negadas.map((n: number) => '#' + n).join(', ') + '.';
      return;
    }
    var errorFuentes = this.validarDatosManualesLote(ids);
    if (errorFuentes) {
      this.simError = errorFuentes;
      return;
    }
    var payload: any[] = [];
    try {
      for (var j = 0; j < filas.length; j++) {
        var fila = filas[j];
        var body = this.simBody(fila.id, this.simFormulario, false);
        if (porFila) {
          if (fila.monto !== null && fila.monto !== undefined && fila.monto !== '') {
            var m = Number(fila.monto);
            if (!isFinite(m) || m <= 0 || m > 90071992547409 ||
              Math.abs(m * 100 - Math.round(m * 100)) > 0.0001) {
              throw new Error('Monto inválido (máximo dos decimales) en solicitud #' + fila.id);
            }
            body.parametros.monto = m;
          }
          if (fila.plazo !== null && fila.plazo !== undefined && fila.plazo !== '') {
            var pl = Number(fila.plazo);
            if (!isFinite(pl) || pl < 1 || pl > 120 || Math.floor(pl) !== pl) {
              throw new Error('Plazo inválido en solicitud #' + fila.id);
            }
            body.parametros.plazoMeses = pl;
          }
          if (fila.tasa !== null && fila.tasa !== undefined && fila.tasa !== '') {
            var t = Number(fila.tasa);
            if (!isFinite(t) || t < 0 || t > 100)
              throw new Error('Tasa inválida en solicitud #' + fila.id);
            body.parametros.tipoTasa = this.simFormulario.tipoTasa || 'TNA_30_360';
            body.parametros.tasaPorcentaje = t;
          }
          if (fila.frecuencia !== null && fila.frecuencia !== undefined && fila.frecuencia !== '') {
            var fr = String(fila.frecuencia).toUpperCase();
            if (fr !== 'MENSUAL' && fr !== 'QUINCENAL')
              throw new Error('Frecuencia inválida en solicitud #' + fila.id);
            body.parametros.frecuenciaPago = fr;
          }
        }
        var primeraCuota = fila.fechaPrimeraCuota ||
          this.simFormulario.fechaPrimeraCuota;
        if (!primeraCuota) {
          throw new Error('Define la fecha de primera cuota (individual o común) ' +
            'para la solicitud #' + fila.id + '.');
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(primeraCuota))) {
          throw new Error('Fecha de primera cuota inválida en solicitud #' + fila.id + '.');
        }
        body.parametros.fechaPrimeraCuota = String(primeraCuota);
        payload.push(body);
      }
    }
    catch (e) {
      this.simError = String((e as any).message || e);
      return;
    }
    var version = this.versionConsultas;
    this.cargandoSimulacionIntegral = true;
    this.peticionIntegral = this.http.post(this.obtenerUrlBase() + '/femprobien/simulaciones/simular-lote', payload).subscribe((res: Response) => {
      if (version !== this.versionConsultas)
        return;
      this.cargandoSimulacionIntegral = false;
      this.peticionIntegral = null;
      var datos: any = res.json();
      if (!datos || !Array.isArray(datos.resultados)) {
        this.simError = 'BridgeApi devolvió una respuesta de lote incompleta.';
        return;
      }
      this.simMasiva = datos;
      delete this.historialIA[this.claveMemoriaIALote(ids)];
      this.agregarMensaje('asistente', 'Resultados del lote disponibles. Puedes preguntarme por las cuotas, ' +
        'el TOPE proyectado, las diferencias entre solicitudes o las validaciones pendientes. ' +
        'Las simulaciones no constituyen aprobación y las cifras se contrastan ' +
        'con los estudios recuperados por BridgeApi.');
    }, (error: any) => {
      if (version !== this.versionConsultas)
        return;
      this.cargandoSimulacionIntegral = false;
      this.peticionIntegral = null;
      this.simError = error && error.status === 404
        ? 'El endpoint /femprobien/simulaciones/simular-lote no está disponible en BridgeApi.'
        : 'Error al simular lote' + this.obtenerDetalleError(error);
    });
  }

  public alternarAmortizacionIntegral(item: any) {
    if (item)
      item.mostrarAmortizacion = !item.mostrarAmortizacion;
  }

  public exportarAmortizacionIntegral(item: any) {
    if (!item || !item.simulacion || !item.simulacion.tablaAmortizacion)
      return;
    var filas = item.simulacion.tablaAmortizacion;
    var csv = 'Cuota;Fecha;Cuota a pagar;Interes;Capital amortizado;Saldo pendiente\r\n';
    for (var i = 0; i < filas.length; i++) {
      var f = filas[i];
      csv += [f.numeroCuota, f.fechaVencimiento || '', f.cuotaAPagar || 0,
      f.interes || 0, f.capitalAmortizado || 0, f.capitalVivo || 0].join(';') + '\r\n';
    }
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'amortizacion_femprobien_solicitud_' + item.numeroSolicitud + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  public formatearInterpretacionIA(contenido: any): string {
    if (contenido == null) {
      return '';
    }
    var texto = String(contenido)
      .replace(/\r\n?/g, '\n')
      .trim();
    texto = texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    return texto.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  }

  private cancelarConsulta() {
    this.cancelarSimulacionIntegral();
    this.cancelarInterpretacion();
    if (this.peticionIA) {
      this.peticionIA.unsubscribe();
      this.peticionIA = null;
    }
    this.versionConsultas++;
    if (this.peticionEvaluacionMultiple) {
      this.peticionEvaluacionMultiple.unsubscribe();
      this.peticionEvaluacionMultiple = null;
    }
    this.cargandoEvaluacionMultiple = false;
    if (this.peticionMultiples) {
      this.peticionMultiples.unsubscribe();
      this.peticionMultiples = null;
    }
    if (this.peticionComparacion) {
      this.peticionComparacion.unsubscribe();
      this.peticionComparacion = null;
    }
    if (this.peticionSimulacion) {
      this.peticionSimulacion.unsubscribe();
      this.peticionSimulacion = null;
    }
    if (this.peticion) {
      this.peticion.unsubscribe();
      this.peticion = null;
    }
    this.cargando = false;
    this.cargandoSimulacion = false;
    this.cargandoComparacion = false;
    this.cargandoMultiples = false;
  }
}
