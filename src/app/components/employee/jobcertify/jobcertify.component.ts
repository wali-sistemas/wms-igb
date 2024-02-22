import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ReportService } from '../../../services/report.service';
import { UserService } from '../../../services/user.service';
import { EmployeeService } from '../../../services/employee.service';
import { GLOBAL } from 'app/services/global';

@Component({
  templateUrl: './jobcertify.component.html',
  styleUrls: ['./jobcertify.component.css'],
  providers: [ReportService, UserService, EmployeeService]
})

export class EmployeeJobCertifyComponent {
  public identity;
  public selectedYear: string = '';
  public selectedMonth: string = '';
  public selectedPeriodo: string = '';
  public cedula: number;
  public fechaNacimiento: string;
  public url: string;
  public showErrorModal = false;
  public dirigidoA: string = '';
  public contenidoPersonalizado: string;

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

  public generateJobCertify() {
    let printReportDTO = {
      "id": this.cedula,
      "copias": 0,
      "documento": "jobCertify",
      "companyName": this.identity.selectedCompany,
      "origen": 'N',
      "filtro": this.dirigidoA == '0' ? "A quién pueda interesar" : this.contenidoPersonalizado,
      "imprimir": false,
      "year": this.selectedYear,
      "month": this.selectedMonth,
      "day": this.selectedPeriodo
    };

    this._reportService.generateReport(printReportDTO).subscribe(
      response => {
        if (response.content === true) {
          window.open(this.url + this.identity.selectedCompany + '/employee/jobCertify/' + this.cedula + '.pdf', '_blank');
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
    this._employeeService.validateEmployeeExistence(this.cedula.toString(), this.fechaNacimiento).subscribe(
      response => {
        if (response.content === false) {
          alert('Error al validar datos.');
        } else {
          this.generateJobCertify();
        }
      },
      error => {
        this.redirectIfSessionInvalid(error);
        console.error(error);
      }
    );
  }
}
