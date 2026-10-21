import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class EmployeeService {
  public urlManager: string;
  public urlBridge: string;

  constructor(private _http: Http) {
    this.urlManager = GLOBAL.urlManager;
    this.urlBridge = GLOBAL.urlBridge;
  }

  public listCustodyByEmployeeOrAsset(filtre: string) {
    return this._http.get(this.urlManager + 'employee/list-custody?filtre=' + filtre, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public findEmployee(cardCode: string) {
    return this._http.get(this.urlManager + 'employee/find-employee/' + cardCode, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public addOrRefrescEmployee(employeeDTO: any, bottonAction: string) {
    return this._http.post(this.urlManager + 'employee/add-refresh-employee?bottonAction=' + bottonAction, employeeDTO, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public listEmployeesActives() {
    return this._http.get(this.urlManager + 'employee/list-actives-employee', { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public findAsset(idAsset: string) {
    return this._http.get(this.urlManager + 'employee/find-asset/' + idAsset, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public addOrRefrescAsset(assetMasterDTO: any, bottonAction: string) {
    return this._http.post(this.urlManager + 'employee/add-refresh-asset?bottonAction=' + bottonAction, assetMasterDTO, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public validateEmployeeExistence(idEmployee: string, birthdate: string, companyName: string) {
    return this._http.get(this.urlManager + 'employee/validate-employee-existence/' + companyName + '?id=' + idEmployee + '&birthdate=' + birthdate, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public updateStatusAssociatedReques(cardcode: string, status: string) {
    return this._http.patch(this.urlManager + 'employee/femprobien/update-status-requests?cardcode=' + cardcode + '&status=' + status, null, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public addAfiliadoFemprobien(afiliado: any) {
    return this._http.post(this.urlBridge + '/femprobien/solicitudes-afiliacion', afiliado)
      .map(res => res.json());
  }

  public validateAssociatedExistence(cardcode: string, birthdate: string) {
    return this._http.get(this.urlBridge + '/femprobien/asociados/' + encodeURIComponent(cardcode))
      .map(res => {
        const asociado = res.json();
        const fechaBackend = asociado && asociado.fec_nac ? asociado.fec_nac.toString().substring(0, 10) : '';
        const fechaIngresada = birthdate ? birthdate.toString().substring(0, 10) : '';
        const coincideFecha = fechaBackend !== '' && fechaIngresada !== '' && fechaBackend === fechaIngresada;

        return {
          code: coincideFecha ? 0 : 1,
          content: coincideFecha ? asociado : null
        };
      });
  }

  public loadAssociatedRequests() {
    return this._http.get(this.urlBridge + '/femprobien/solicitudes-afiliacion?estado=PENDIENTE')
      .map(res => {
        const data = res.json();
        return {
          code: 0,
          content: Array.isArray(data) ? data : []
        };
      });
  }

  public loadAffiliatedEmployees() {
    return this._http.get(this.urlBridge + '/femprobien/solicitudes-afiliacion?estado=' + encodeURIComponent('AFILIADO(A)'))
      .map(res => {
        const data = res.json();
        const solicitudes = Array.isArray(data) ? data : [];
        const asociados = solicitudes.map((s: any) => {
          const nombreCompleto = ((s.nombres || '') + ' ' + (s.primer_apellido || '') + ' ' + (s.segundo_apellido || '')).replace(/\s+/g, ' ').trim();

          return {
            id: s.id,
            codAso: s.cod_asp,
            nomAso: nombreCompleto,
            tipoSolicitud: s.tipo_solicitud,
            tipoIngreso: s.tipo_ingreso,
            fecAfi: s.fecha_afiliacion,
            periodoAporte: s.forma_desc,
            cantPorcen: s.cant_porcen,
            porcenAhorro: s.porcen_ahorro,
            tipoDoc: s.tipo_documento,
            codAfi: s.cod_asp,
            nomAfi: s.nombres,
            ap1Afi: s.primer_apellido,
            ap2Afi: s.segundo_apellido,
            estCiv: s.est_civil,
            fecNac: s.fec_nac,
            fecExp: s.fec_exp,
            lugarExp: s.lugar_exp,
            eMail: s.email_per,
            dirRes: s.dir_res,
            nomBar: s.ciudad_residencia,
            tel: s.tel,
            telCel: s.cel,
            otroTel: s.otro_tel,
            nivelEstudios: s.nivel_estudios,
            nomEmp: s.nom_emp,
            fecIng: s.fec_ing,
            salBas: s.sal_bas,
            promPres: s.prom_pres,
            promBoni: s.prom_boni,
            cargo: s.cargo,
            profesion: s.profesion,
            ctaTipo: s.tipo_cuenta,
            fdoBan: s.banco,
            ctaBan: s.n_cuenta,
            manejaRecursosPublicos: s.maneja_recursos_publicos ? 'SI' : 'NO',
            reconocimientoPublico: s.reconocimiento_publico ? 'SI' : 'NO',
            nomConyuge: s.nom_conyuge,
            ocuConyuge: s.ocupacion_conyuge,
            telConyuge: s.tel_conyuge,
            tipoDocConyuge: s.tipo_documento_conyuge,
            docConyuge: s.documento_conyuge,
            bienRaices: s.bien_raiz ? 'SI' : 'NO',
            bienesDir: s.direccion_bien,
            vehiculo: s.vehiculo ? 'SI' : 'NO',
            marcaVeh: s.marca_vehiculo,
            modeloVeh: s.modelo_vehiculo,
            tipoDocBen1: s.tipo_doc_ben1,
            codBen1: s.cod_ben1,
            nomBen1: s.nom_ben1,
            parBen1: s.par_ben1,
            tipoDocBen2: s.tipo_doc_ben2,
            codBen2: s.cod_ben2,
            nomBen2: s.nom_ben2,
            parBen2: s.par_ben2,
            tipoDocBen3: s.tipo_doc_ben3,
            codBen3: s.cod_ben3,
            nomBen3: s.nom_ben3,
            parBen3: s.par_ben3
          };
        });

        return {
          code: 0,
          content: asociados
        };
      });
  }
}
