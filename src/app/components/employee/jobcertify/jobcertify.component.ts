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
  public dirigidoA: string;
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

  public getUrlVerification() {
    if (this.cedula) {
      return this.url + this.identity.selectedCompany + '/employee/jobCertify/' + this.cedula + '.pdf';
    }
    return '';
  }

  public generateJobCertify() {
    const verificationUrl = this.getUrlVerification();
    if (verificationUrl) {
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
            window.open(verificationUrl, '_blank');
          } else {
            // Mostrar alerta solo si response.content es false
            if (response.content === false) {
              alert('La generación de la carta laboral no fue exitosa.');
            }
            return;
          }
        },
        error => { console.error(error); }
      );
    }
  }

  public cancelForm() {
    this.cedula = null;
    this.selectedYear = '';
    this.selectedMonth = '';
    this.selectedPeriodo = '';
    this.fechaNacimiento = '';
  }

  public confirmGenerate() {
    // TODO: Validando la existencia del empleado
    this.validateEmployee(this.cedula.toString(), this.fechaNacimiento);

    const dataToSave = {
      cedula: this.cedula,
      year: this.selectedYear,
      month: this.selectedMonth,
      periodo: this.selectedPeriodo,
      fechaNacimiento: this.fechaNacimiento
    };

    const pdfUrl = this.getUrlVerification();

    // Almacena el resultado de validateEmployee en una variable
    let employeeValidationResult = false;

    this._employeeService.validateEmployeeExistence(this.cedula.toString(), this.fechaNacimiento).subscribe(
      response => {
        if (response.code >= 0 && response.content === false) {
          alert('Los datos ingresados son incorrectos.');
        } else if (response.code >= 0 && response.content === true) {
          employeeValidationResult = true;
        } else {
          console.error('Los datos ingresados son incorrectos.');
        }

        // Verifica el resultado y abre la ventana solo si es válido
        if (pdfUrl && employeeValidationResult) {
          window.open(pdfUrl, '_blank');
        }
      },
      error => { console.error(error); }
    );
  }

  public validateEmployee(idEmployee: string, birthdate: string) {
    this._employeeService.validateEmployeeExistence(idEmployee, birthdate).subscribe(
      response => {
        if (response.code >= 0 && response.content === false) {
          alert('Error al validar datos.');
        } else if (response.code >= 0 && response.content === true) {
          this.generateJobCertify();
        } else {
          console.error('Los datos ingresados son incorrectos.');
        }
      },
      error => { console.error(error); }
    );
  }
}
