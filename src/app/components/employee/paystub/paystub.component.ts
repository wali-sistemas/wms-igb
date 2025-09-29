import { Component } from '@angular/core';
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
  public identity: any;
  public formLocked = false;
  public showResumen = false;
  public errorMessage = '';
  public successMessage = '';
  public selectedCompany: string = '';
  public selectedCompanyPrint: string = '';
  public cedula: number | null = null;
  public selectedYear: string = '2025';
  public selectedMonth: string = '';
  public selectedPeriodo: string = '';
  public fechaNacimiento: string = '';
  public logo: string = '';
  public urlShared: string = GLOBAL.urlShared;
  public today = new Date();
  public computedDay: number = 0;

  private readonly COMPANY_FOLDER: { [schema: string]: string } = {
    'IGB_NOVAWEB': 'IGB',
    'MTZ_NOVAWEB': 'MOTOZONE',
    'WALI_NOVAWEB': 'WALI',
    'DSM_NOVAWEB': 'DIGITAL',
    'INVERSUR_NOVAWEB': 'INVERSUR',
    'MOTOREPUESTOS_NOVAWEB': 'MOTOREPUESTOS',
    'VILNA_NOVAWEB': 'REDPLAS'
  };

  constructor(private _reportService: ReportService, private _userService: UserService, private _router: Router, private _employeeService: EmployeeService) {
  }

  ngOnInit() {
    this.selectedYear = '2025';
    this.identity = this._userService.getItentity();
    if (this.identity === null) {
      this._router.navigate(['/']);
      return;
    }
  }

  private redirectIfSessionInvalid(error) {
    if (error && error.status && error.status == 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

  public onCompanyChange() {
    this.selectedCompanyPrint = this.COMPANY_FOLDER[this.selectedCompany] || '';
    switch (this.selectedCompany) {
      case 'DSM_NOVAWEB': this.logo = '1'; break;
      case 'INVERSUR_NOVAWEB': this.logo = '2'; break;
      case 'IGB_NOVAWEB': this.logo = '3'; break;
      case 'MOTOREPUESTOS_NOVAWEB': this.logo = '4'; break;
      case 'MTZ_NOVAWEB': this.logo = '5'; break;
      case 'VILNA_NOVAWEB': this.logo = '6'; break;
      case 'WALI_NOVAWEB': this.logo = '7'; break;
      default: this.logo = '';
    }
  }

  private getLastDayOfSelectedMonth() {
    const y = Number(this.selectedYear);
    const m = Number(this.selectedMonth);
    return new Date(y, m, 0).getDate();
  }

  public mostrarResumen() {
    this.errorMessage = '';

    if (!this.selectedCompany || !this.cedula || !this.selectedYear || !this.selectedMonth || !this.selectedPeriodo || !this.fechaNacimiento) {
      this.errorMessage = 'Completa todos los campos obligatorios.';
      return;
    }

    this.computedDay = (this.selectedPeriodo === '30') ? this.getLastDayOfSelectedMonth() : 15;

    this._employeeService.validateEmployeeExistence(this.cedula.toString(), this.fechaNacimiento, this.selectedCompany).subscribe(
      response => {
        let notFound = false;
        if (response && typeof response === 'object') {
          if (typeof response.code === 'number' && response.code >= 0 && response.content === false) {
            notFound = true;
          } else if (response && response.content === false) {
            notFound = true;
          }
        }
        if (notFound) {
          this.errorMessage = 'Los datos ingresados son incorrectos.';
          this.showResumen = false;
          this.formLocked = false;
        } else {
          this.showResumen = true;
          this.formLocked = true;
        }
      },
      error => {
        console.error(error);
        this.redirectIfSessionInvalid(error);
        this.errorMessage = 'Ocurrió un error validando la información.';
        this.showResumen = false;
        this.formLocked = false;
      }
    );
  }

  public editar() {
    this.showResumen = false;
    this.formLocked = false;
  }

  public generatePaystub() {
    this.errorMessage = '';

    if (!this.selectedCompany || !this.cedula || !this.selectedYear || !this.selectedMonth || !this.selectedPeriodo || !this.fechaNacimiento) {
      this.errorMessage = 'Completa todos los campos obligatorios.';
      return;
    }

    const dayForPeriodo = (this.selectedPeriodo === '30') ? this.getLastDayOfSelectedMonth() : 15;

    const payload = {
      id: this.cedula,
      year: parseInt(this.selectedYear, 10),
      month: parseInt(this.selectedMonth, 10),
      day: dayForPeriodo,
      logo: this.logo
    };

    this._reportService.generatePaystub(payload, this.selectedCompany).subscribe(
      response => {
        if (response && response.code === 0 && response.content) {
          window.open(response.content, '_blank');
          this.successMessage = 'Colilla generada correctamente.';
          this.resetFields(false);
        } else {
          this.errorMessage = 'La generación de la colilla de pago no fue exitosa.';
        }
      },
      error => {
        console.error('Error al generar el reporte:', error);
        this.redirectIfSessionInvalid(error);
        this.errorMessage = 'La generación de la colilla de pago no fue exitosa.';
      }
    );
  }

  public cancelForm() {
    this.resetFields(true);
  }

  private resetFields(clearMessages: boolean = true) {
    this.selectedCompany = '';
    this.selectedCompanyPrint = '';
    this.cedula = null;
    this.selectedYear = '2025';
    this.selectedMonth = '';
    this.selectedPeriodo = '';
    this.fechaNacimiento = '';
    this.logo = '';
    this.showResumen = false;
    this.formLocked = false;
    this.computedDay = 0;

    if (clearMessages) {
      this.errorMessage = '';
      this.successMessage = '';
    }
  }
}
