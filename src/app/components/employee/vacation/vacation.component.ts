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
  public identity;
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
  public errorMessage: string;

  constructor(private _reportService: ReportService, private _userService: UserService, private _router: Router, private _employeeService: EmployeeService) {
    this.url = GLOBAL.urlShared;
  }

  ngOnInit() {
    this.identity = this._userService.getItentity();
    if (this.identity === null) {
      this._router.navigate(['/']);
    }
  }

  private redirectIfSessionInvalid(error) {
    if (error && error.status && error.status == 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

  public generateVacation() {
    let printReportDTO = {
      id: this.cedula,
      jefeInmediato: this.jefeInmediato.toString(),
      logo: this.logo.toString(),
      fechaInicio: this.fechaInicio.toString(),
      fechaFin: this.fechaFin.toString(),
      fechaReintegro: this.fechaReintegro.toString(),
      diasSolicitados: this.diasSolicitados.toString(),
      numDiasSolicitadosDinero: this.vacacionesDinero.toString(),
      fechaInicioPeriodo: this.fecha1.toString(),
      fechaFinPeriodo: this.fecha2.toString(),
      diasDisfrutados: this.diasDisfrutados.toString(),
      diasPendientes: this.diasPendientes.toString(),
      comentarios: this.comentarios.toString()
    };

    this._reportService.generateVacation(printReportDTO, this.selectedCompany).subscribe(
      response => {
        if (response.code === 0) {
          this.errorMessage = '';
          window.open(response.content, '_blank');
          this.cancelForm();
        } else {
          this.errorMessage = 'La generación de la solicitud de vacaciones no fue exitosa';
        }
      },
      error => {
        console.error('Error al generar el reporte:', error);
        this.errorMessage = 'La generación de la solicitud de vacaciones no fue exitosa';
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public cancelForm(): void {
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
    this.errorMessage = '';
  }

  public onCompanyChange() {
    switch (this.selectedCompany) {
      case 'DSM_NOVAWEB':
        this.logo = "1";
        break;
      case 'INVERSUR_NOVAWEB':
        this.logo = "2";
        break;
      case 'IGB_NOVAWEB':
        this.logo = "3";
        break;
      case 'MOTOREPUESTOS_NOVAWEB':
        this.logo = "4";
        break;
      case 'MTZ_NOVAWEB':
        this.logo = "5";
        break;
      case 'VILNA_NOVAWEB':
        this.logo = "6";
        break;
      case 'WALI_NOVAWEB':
        this.logo = "7";
        break;
      default:
        this.selectedCompany = '';
    }
  }
}
