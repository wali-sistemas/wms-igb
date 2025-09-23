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
  public identity: any;
  public selectedCompany: string = '';
  public selectedCompanyPrint: string = '';
  public cedula: number;
  public fechaNacimiento: string;
  public dirigidoA: string = '';
  public contenidoPersonalizado: string;
  public formLocked = false;
  public selectedYear: string = '';
  public selectedMonth: string = '';
  public selectedPeriodo: string = '';
  public mesAnteriorLabel = '';
  public showResumen = false;
  public errorMessage = '';
  public successMessage = '';
  public urlShared: string = GLOBAL.urlShared;
  public logo: string;

  constructor(private _reportService: ReportService, private _userService: UserService, private _router: Router, private _employeeService: EmployeeService) { }

  ngOnInit() {
    this.identity = this._userService.getItentity();
    if (this.identity === null) {
      this._router.navigate(['/']);
      return;
    }
    this.setMesAnterior();
  }

  private setMesAnterior() {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const yyyy = d.getFullYear();
    const mm = (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1);

    this.selectedYear = String(yyyy);
    this.selectedMonth = mm;

    const nombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    this.mesAnteriorLabel = `${nombres[d.getMonth()]} ${yyyy}`;
  }

  private redirectIfSessionInvalid(error: any) {
    if (error && error.status && error.status === 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

  public mostrarResumen() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.selectedCompany || !this.cedula ||
      !this.selectedPeriodo || !this.fechaNacimiento || !this.dirigidoA) {
      this.errorMessage = 'Completa todos los campos obligatorios.';
      return;
    }

    if (!this.selectedYear || !this.selectedMonth) {
      this.setMesAnterior();
    }

    this._employeeService.validateEmployeeExistence(this.cedula.toString(), this.fechaNacimiento, this.selectedCompany).subscribe(
      response => {
        if (response.content === false) {
          this.errorMessage = 'No se encontró un empleado con los datos ingresados.';
          this.resetForm();
          this.showResumen = false;
          this.formLocked = false;
        } else {
          this.showResumen = true;
          this.formLocked = true;
        }
      },
      error => {
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

  public generateJobCertify() {
    if (!this.selectedYear || !this.selectedMonth) {
      this.setMesAnterior();
    }

    if (!this.selectedCompany) {
      this.errorMessage = 'Selecciona la empresa.';
      return;
    }

    const printReportDTO = {
      id: this.cedula,
      copias: 0,
      documento: 'jobCertify',
      companyName: this.selectedCompany,
      origen: 'N',
      filtro: this.dirigidoA === 'Personalizado' ? this.contenidoPersonalizado : this.dirigidoA,
      imprimir: false,
      year: this.selectedYear,
      month: this.selectedMonth,
      day: this.selectedPeriodo
    };

    this._reportService.generateReport(printReportDTO).subscribe(
      response => {
        if (response && response.code >= 0) {
          const pdfUrl = this.urlShared + this.identity.selectedCompany + '/employee/jobCertify/' + this.cedula + '.pdf';
          window.open(pdfUrl, '_blank');

          this.successMessage = 'Carta generada correctamente.';
          this.cancelForm();
        } else {
          this.errorMessage = 'La generación de la carta laboral no fue exitosa.';
        }
      },
      error => {
        this.redirectIfSessionInvalid(error);
        console.error(error);
      }
    )
  }

  public cancelForm() {
    this.cedula = null;
    this.selectedPeriodo = '';
    this.fechaNacimiento = '';
    this.dirigidoA = '';
    this.contenidoPersonalizado = '';
    this.showResumen = false;
    this.formLocked = false;
    this.setMesAnterior();
  }

  public onCompanyChange() {
    switch (this.selectedCompany) {
      case 'IGB_NOVAWEB':
        this.selectedCompanyPrint = 'IGB';
        break;
      case 'MTZ_NOVAWEB':
        this.selectedCompanyPrint = 'VARROC';
        break;
      default:
        this.selectedCompanyPrint = '';
    }
  }

  private resetForm() {
    this.selectedCompany = '';
    this.selectedCompanyPrint = '';
    this.cedula = null as any;
    this.selectedPeriodo = '';
    this.fechaNacimiento = '';
    this.dirigidoA = '';
    this.contenidoPersonalizado = '';
    this.showResumen = false;
    this.formLocked = false;
    this.setMesAnterior();
  }
}
