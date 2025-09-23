import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ReportService } from '../../../services/report.service';
import { UserService } from '../../../services/user.service';
import { EmployeeService } from '../../../services/employee.service';
import { GLOBAL } from 'app/services/global';

declare var $: any;

@Component({
  templateUrl: './vacation.component.html',
  styleUrls: ['./vacation.component.css'],
  providers: [ReportService, UserService, EmployeeService]
})

export class EmployeeVacationComponent {
  public selectedCompany: string = '';
  public identity: any;
  public cedula: number;
  public jefeInmediato: string = '';
  public logo: string = '';
  public fechaInicio: string = '';
  public fechaFin: string = '';
  public fechaReintegro: string = '';
  public diasSolicitados: number;
  public vacacionesDinero: number;
  public ultimoPeriodo: string = '';
  public fecha1: string = '';
  public fecha2: string = '';
  public diasDisfrutados: number;
  public diasPendientes: number;
  public comentarios: string = '';
  public url: string;
  public showErrorModal = false;
  public errorMessage: string = '';
  public successMessage: string = '';
  public tipoVacaciones: 'DINERO' | 'TIEMPO' | 'AMBAS' | '' = '';
  public formLocked = false;
  public showPanels = false;

  private readonly LOGO_BY_COMPANY: Record<string, string> = {
    'DSM_NOVAWEB': '1',
    'INVERSUR_NOVAWEB': '2',
    'IGB_NOVAWEB': '3',
    'MOTOREPUESTOS_NOVAWEB': '4',
    'MTZ_NOVAWEB': '5',
    'VILNA_NOVAWEB': '6',
    'WALI_NOVAWEB': '7',
  };

  constructor(private _reportService: ReportService, private _userService: UserService, private _router: Router) {
    this.url = GLOBAL.urlShared;
  }

  ngOnInit() {
    this.identity = this._userService.getItentity();
    if (this.identity === null) {
      this._router.navigate(['/']);
    }
  }

  private redirectIfSessionInvalid(error: any) {
    if (error && error.status && error.status == 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

  public isDinero() {
    return this.tipoVacaciones === 'DINERO';
  }

  public isTiempo() {
    return this.tipoVacaciones === 'TIEMPO';
  }

  public isAmbas() {
    return this.tipoVacaciones === 'AMBAS';
  }

  public onTipoVacacionesChange() {
    if (this.isDinero()) {
      this.fechaInicio = '';
      this.fechaFin = '';
      this.fechaReintegro = '';
      this.diasSolicitados = null;
    } else if (this.isTiempo()) {
      this.vacacionesDinero = null;
    }
  }

  public onCompanyChange() {
    this.logo = this.LOGO_BY_COMPANY[this.selectedCompany] || '';
  }

  private isFormComplete() {
    return !!this.cedula && !!this.selectedCompany && !!this.jefeInmediato && !!this.tipoVacaciones;
  }

  public checkAndLock() {
    if (!this.formLocked && this.isFormComplete()) {
      this.formLocked = true;
      this.showPanels = true;
      this.errorMessage = '';
    } else if (!this.formLocked && !this.isFormComplete()) {
      this.showPanels = false;
    }
  }

  private resetFormFields() {
    this.cedula = null;
    this.jefeInmediato = '';
    this.logo = '';
    this.fechaInicio = '';
    this.fechaFin = '';
    this.fechaReintegro = '';
    this.diasSolicitados = null;
    this.vacacionesDinero = null;
    this.ultimoPeriodo = '';
    this.fecha1 = '';
    this.fecha2 = '';
    this.diasDisfrutados = null;
    this.diasPendientes = null;
    this.comentarios = '';
    this.selectedCompany = '';
    this.tipoVacaciones = '';
  }

  private resetOnError(msg: string) {
    this.resetFormFields();
    this.formLocked = false;
    this.showPanels = false;
    this.successMessage = '';
    this.errorMessage = msg;
  }

  public generateVacation() {
    if (!this.cedula || !this.jefeInmediato || !this.selectedCompany) {
      this.resetOnError('Debe diligenciar cédula, jefe inmediato y seleccionar una empresa.');
      return;
    }

    if (!this.tipoVacaciones) {
      this.resetOnError('Seleccione el tipo de vacaciones (Dinero, Tiempo o Ambas).');
      return;
    }

    const derivedLogo: string = this.LOGO_BY_COMPANY[this.selectedCompany] || '';

    const isDinero = this.tipoVacaciones === 'DINERO';
    const isTiempo = this.tipoVacaciones === 'TIEMPO';
    const isAmbas = this.tipoVacaciones === 'AMBAS';

    const fechaInicio = (isTiempo || isAmbas) ? (this.fechaInicio || '') : '';
    const fechaFin = (isTiempo || isAmbas) ? (this.fechaFin || '') : '';
    const fechaReintegro = (isTiempo || isAmbas) ? (this.fechaReintegro || '') : '';
    const diasSolicitados = (isTiempo || isAmbas) && this.diasSolicitados != null ? String(this.diasSolicitados) : '';
    const numDiasDinero = (isDinero || isAmbas) && this.vacacionesDinero != null ? String(this.vacacionesDinero) : '';

    const fecha1 = this.fecha1 || '';
    const fecha2 = this.fecha2 || '';
    const diasDisfrutados = this.diasDisfrutados != null ? String(this.diasDisfrutados) : '';
    const diasPendientes = this.diasPendientes != null ? String(this.diasPendientes) : '';

    const printReportDTO = {
      id: this.cedula,
      jefeInmediato: (this.jefeInmediato || '').toString(),
      logo: derivedLogo,
      fechaInicio,
      fechaFin,
      fechaReintegro,
      diasSolicitados,
      numDiasSolicitadosDinero: numDiasDinero,
      fechaInicioPeriodo: fecha1,
      fechaFinPeriodo: fecha2,
      diasDisfrutados,
      diasPendientes,
      comentarios: this.comentarios || ''
    };

    this._reportService.generateVacation(printReportDTO, this.selectedCompany).subscribe(
      response => {
        if (response.code === 0) {
          this.errorMessage = '';
          this.successMessage = 'La solicitud de vacaciones se generó correctamente.';
          const url = response.content;

          this.resetFormFields();
          this.formLocked = false;
          this.showPanels = false;

          if (url) {
            window.open(url, '_blank');
          } else {
            this.resetOnError('La generación de la solicitud de vacaciones no fue exitosa');
          }
        }
      },
      error => {
        console.error('Error al generar el reporte:', error);
        this.resetOnError('La generación de la solicitud de vacaciones no fue exitosa');
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public cancelForm() {
    this.resetFormFields();
    this.formLocked = false;
    this.showPanels = false;
    this.errorMessage = '';
  }
}
