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
        cedula: this.cedula,
        jefeInmediato: this.jefeInmediato,
        logo: this.logo,
        fechaInicio: this.fechaInicio,
        fechaFin: this.fechaFin,
        fechaReintegro: this.fechaReintegro,
        diasSolicitados: this.diasSolicitados,
        vacacionesDinero: this.vacacionesDinero,
        fecha1: this.fecha1,
        fecha2: this.fecha2,
        diasDisfrutados: this.diasDisfrutados,
        diasPendientes: this.diasPendientes,
        comentarios: this.comentarios,
        empresa: this.selectedCompany
      };

      this._reportService.generateVacation(printReportDTO, this.selectedCompany).subscribe(
        response => {
          if (response.content === true) {
            window.open(vacationUrl, '_blank');
          } else {
            alert('La generación de la solicitud de vacaciones no fue exitosa.');
          }
        },
        error => {
          console.error('Error al generar el reporte:', error);
        }
      );
    } else {
      alert('Falta información necesaria para generar la solicitud.');
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
