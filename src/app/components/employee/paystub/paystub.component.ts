import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { ReportService } from '../../../services/report.service';
import { UserService } from '../../../services/user.service';
import { EmployeeService } from '../../../services/employee.service';
import { GLOBAL } from 'app/services/global';

declare var $: any;

@Component({
  templateUrl: './paystub.component.html',
  styleUrls: ['./paystub.component.css'],
  providers: [ReportService, UserService, EmployeeService]
})

export class EmployeePaystubComponent {
  public identity;
  public selectedYear: string = '';
  public selectedMonth: string = '';
  public selectedPeriodo: string = '';
  public cedula: number;
  public fechaNacimiento: string;
  public url: string;
  public showErrorModal = false;

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

  public generatePaystub() {
    let printReportDTO = {
      "id": this.cedula,
      "copias": 0,
      "documento": "paystub",
      "companyName": this.identity.selectedCompany,
      "origen": 'N',
      "imprimir": false,
      "year": this.selectedYear,
      "month": this.selectedMonth,
      "day": this.selectedPeriodo
    };

    this._reportService.generateReport(printReportDTO).subscribe(
      response => {
        if (response.code >= 0) {
          window.open(this.url + this.identity.selectedCompany + '/employee/paystub/' + this.cedula + '.pdf', '_blank');
          $('#confirmModal').modal('hide');
          this.cancelForm();
        } else {
          alert('La generación de la colilla de pago no fue exitosa.');
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
          alert('Los datos ingresados son incorrectos.');
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
}
