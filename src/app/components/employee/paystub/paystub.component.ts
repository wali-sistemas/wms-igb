import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
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
    this._employeeService.validateEmployeeExistence(this.cedula.toString(), this.fechaNacimiento, this.selectedCompany).subscribe(
      response => {
        if (response.code >= 0 && response.content === false) {
          this.errorMessage = 'Los datos ingresados son incorrectos.';
          $('#confirmModal').modal('hide');
        } else {
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
                window.open(response.content, '_blank');
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
        }
      },
      error => {
        console.error(error);
        this.redirectIfSessionInvalid(error);
      }
    );
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
