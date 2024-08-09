import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { ReportService } from '../../../services/report.service';
import { UserService } from '../../../services/user.service';
import { EmployeeService } from '../../../services/employee.service';
import { GLOBAL } from 'app/services/global';

@Component({
  templateUrl: './paystub.component.html',
  styleUrls: ['./paystub.component.css'],
  providers: [ReportService, UserService, EmployeeService]
})
export class EmployeePaystubComponent {
  public selectedCompany: string = "";
  public identity;
  public selectedYear: string = "";
  public selectedMonth: string = "";
  public selectedPeriodo: string = "";
  public logo: string;
  public cedula: number;
  public fechaNacimiento: string;
  public url: string;
  public showErrorModal = false;
  public errorMessage: string;
  public confirmacionMessage: string;

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

  public getUrlPaystub() {
    if (this.cedula) {
      return `${this.url} /employee/paystub/${this.cedula}.pdf`;
    } else {
      return '';
    }
  }

  public generatePaystub() {
    const paystubUrl = this.getUrlPaystub();
    if (paystubUrl) {
      let printReportDTO = {
        id: this.cedula,
        year: parseInt(this.selectedYear, 10),
        month: parseInt(this.selectedMonth, 10),
        day: parseInt(this.selectedPeriodo, 10),
        logo: this.logo
      };

      this._reportService.generatePaystub(printReportDTO, this.selectedCompany).subscribe(
        response => {
          if (response.code === 0) {
            this.errorMessage = '';
            this.confirmacionMessage = response.content
            window.open(paystubUrl, '_blank');
            this.cancelForm();
          } else if (response.code === -1) {
            this.errorMessage = 'La generación de la colilla de pago no fue exitosa';
          }
        },
        error => {
          console.error('Error al generar el reporte:', error);
          this.errorMessage = 'La generación de la colilla de pago no fue exitosa';
          this.redirectIfSessionInvalid(error);
        }
      );
    } else {
      this.errorMessage = 'La generación de la colilla de pago no fue exitosa';
    }
  }

  public cancelForm() {
    this.selectedCompany = '';
    this.cedula = null;
    this.selectedYear = "";
    this.selectedMonth = "";
    this.selectedPeriodo = "";
    this.fechaNacimiento = '';
    this.errorMessage = '';
  }

  public confirmGenerate() {
    //TODO: Validando la existencia del empleado
    this.validateEmployee(this.cedula.toString(), this.fechaNacimiento, this.selectedCompany);

    const pdfUrl = this.getUrlPaystub();
    let employeeValidationResult = false;

    this._employeeService.validateEmployeeExistence(this.cedula.toString(), this.fechaNacimiento, this.selectedCompany).subscribe(
      response => {
        if (response.code >= 0 && response.content === false) {
          alert('Los datos ingresados son incorrectos.');
        } else if (response.code >= 0 && response.content === true) {
          employeeValidationResult = true;
        } else {
          console.error('Los datos ingresados son incorrectos.');
        }

        if (pdfUrl && employeeValidationResult) {
          window.open(pdfUrl, '_blank');
        } else {
          console.error('La URL del PDF no es válida o la validación del empleado falló.');
        }
      },
      error => {
        console.error(error);
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public validateEmployee(idEmployee: string, birthdate: string, companyName: string) {
    this._employeeService.validateEmployeeExistence(idEmployee, birthdate, companyName).subscribe(
      response => {
        if (response.code >= 0 && response.content === false) {
          this.errorMessage = 'Los datos ingresados son incorrectos.';
        } else if (response.code >= 0 && response.content === true) {
          this.generatePaystub();
        } else {
          console.error('Los datos ingresados son incorrectos.');
        }
      },
      error => {
        console.error(error);
        this.redirectIfSessionInvalid(error);
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
