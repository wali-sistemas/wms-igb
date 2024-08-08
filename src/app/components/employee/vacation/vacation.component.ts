import { Component, HostListener } from '@angular/core';
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
  public confirmacionMessage: string;

  constructor(
    private _reportService: ReportService,
    private _userService: UserService,
    private _router: Router,
    private _employeeService: EmployeeService
  ) {
    this.url = GLOBAL.urlShared;
  }

  ngOnInit() {
    this.identity = this._userService.getItentity();
    if (this.identity === null) {
      this._router.navigate(['/']);
    }
  }

  public getUrlVacation(): string {
    if (this.cedula) {
      return `${this.url}${this.selectedCompany}/employee/vacation/${this.cedula}.pdf`;
    }
    return '';
  }

  public generateVacation(): void {
    const vacationUrl = this.getUrlVacation();
    if (vacationUrl) {
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
            this.confirmacionMessage = response.content
            window.open(vacationUrl, '_blank');
            this.cancelForm();
          } else if (response.code === -1) {
            this.errorMessage = 'La generación de la solicitud de vacaciones no fue exitosa';
          }
        },
        error => {
          console.error('Error al generar el reporte:', error);
          this.errorMessage = 'La generación de la solicitud de vacaciones no fue exitosa';
        }
      );
    } else {
      this.errorMessage = 'La generación de la solicitud de vacaciones no fue exitosa';
    }
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

  public onCompanyChange(): void {
    console.log(this.logo);
    console.log(this.selectedCompany);
    switch (this.logo) {
      case '1':
        this.selectedCompany = 'DIGITAL_NOVAWEB';
        break;
      case '2':
        this.selectedCompany = 'INVERSUR_NOVAWEB';
        break;
      case '3':
        this.selectedCompany = 'IGB_NOVAWEB';
        break;
      case '4':
        this.selectedCompany = 'MOTOREPUESTOS_NOVAWEB';
        break;
      case '5':
        this.selectedCompany = 'MOTOZONE_NOVAWEB';
        break;
      case '6':
        this.selectedCompany = 'REDPLAS_NOVAWEB';
        break;
      case '7':
        this.selectedCompany = 'WALI_NOVAWEB';
        break;
      default:
        this.selectedCompany = '';
    }
  }
}
