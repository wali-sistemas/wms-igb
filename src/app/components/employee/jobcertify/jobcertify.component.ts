import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ReportService } from '../../../services/report.service';
import { UserService } from '../../../services/user.service';
import { EmployeeService } from '../../../services/employee.service';
import { GLOBAL } from 'app/services/global';

declare var $: any;

@Component({
  templateUrl: './jobcertify.component.html',
  styleUrls: ['./jobcertify.component.css'],
  providers: [ReportService, UserService, EmployeeService]
})

export class EmployeeJobCertifyComponent {
  public identity;
  public selectedYear: string = "";
  public selectedMonth: string = "";
  public selectedPeriodo: string = "";
  public cedula: number;
  public fechaNacimiento: string;
  public urlShared: string = GLOBAL.urlShared;
  public showErrorModal = false;
  public dirigidoA: string = "";
  public contenidoPersonalizado: string;
  public selectedCompany: string = "";
  public logo: string;

  constructor(private _reportService: ReportService, private _userService: UserService, private _router: Router, private _employeeService: EmployeeService) {
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

  public generateJobCertify() {
    let printReportDTO = {
      "id": this.cedula,
      "copias": 0,
      "documento": "jobCertify",
      "companyName": this.selectedCompany,
      "origen": 'N',
      "filtro": this.dirigidoA == 'Personalizado' ? this.contenidoPersonalizado : this.dirigidoA,
      "imprimir": false,
      "year": this.selectedYear,
      "month": this.selectedMonth,
      "day": this.selectedPeriodo
    };

    this._reportService.generateReport(printReportDTO).subscribe(
      response => {
        if (response.code >= 0) {
          window.open(this.urlShared + this.identity.selectedCompany + '/employee/jobCertify/' + this.cedula + '.pdf', '_blank');
          this.cancelForm();
        } else {
          alert('La generación de la carta laboral no fue exitosa.');
        }
      },
      error => {
        this.redirectIfSessionInvalid(error);
        console.error(error);
      }
    );
  }

  public cancelForm() {
    this.cedula = null;
    this.selectedYear = '';
    this.selectedMonth = '';
    this.selectedPeriodo = '';
    this.fechaNacimiento = '';
  }

  public confirmGenerate() {
    this._employeeService.validateEmployeeExistence(this.cedula.toString(), this.fechaNacimiento, this.selectedCompany).subscribe(
      response => {
        if (response.content === false) {
          alert('Error al validar datos.');
        } else {
          $('#confirmModal').modal('show');
        }
      },
      error => {
        this.redirectIfSessionInvalid(error);
        console.error(error);
      }
    );
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
