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
  public cedula: number | null = null;
  public fechaNacimiento: string = '';
  public dirigidoA: string = '';
  public contenidoPersonalizado: string = '';
  public formLocked = false;
  public selectedYear: string = '';
  public selectedMonth: string = '';
  public selectedPeriodo: string = '';
  public mesAnteriorLabel = '';
  public showResumen = false;
  public errorMessage = '';
  public successMessage = '';
  public urlShared: string = GLOBAL.urlShared;
  public logo: string = '';
  public today = new Date();

  private readonly COMPANY_FOLDER: { [schema: string]: string } = {
    'IGB_NOVAWEB': 'IGB',
    'MTZ_NOVAWEB': 'MOTOZONE',
    'WALI_NOVAWEB': 'WALI',
    'DSM_NOVAWEB': 'DIGITAL',
    'INVERSUR_NOVAWEB': 'INVERSUR',
    'MOTOREPUESTOS_NOVAWEB': 'MOTOREPUESTOS',
    'MODULA_NOVAWEB': 'BODEGAS'
  };

  private getCompanyFolder(schema?: string) {
    return this.COMPANY_FOLDER[schema || this.selectedCompany] || '';
  }

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
    const mmNumber = d.getMonth() + 1;
    const mm = (mmNumber < 10 ? '0' : '') + mmNumber;

    this.selectedYear = String(yyyy);
    this.selectedMonth = mm;

    const nombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    this.mesAnteriorLabel = `${nombres[d.getMonth()]} ${yyyy}`;
  }

  private getLastDayOfSelectedMonth() {
    const y = Number(this.selectedYear);
    const m = Number(this.selectedMonth);
    return new Date(y, m, 0).getDate();
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

    if (this.dirigidoA === 'Personalizado' &&
      !(this.contenidoPersonalizado && this.contenidoPersonalizado.trim())) {
      this.errorMessage = 'Escribe el destinatario personalizado.';
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
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.selectedYear || !this.selectedMonth) this.setMesAnterior();

    if (!this.selectedCompany) {
      this.errorMessage = 'Selecciona la empresa.';
      return;
    }

    if (!this.cedula || !this.selectedPeriodo || !this.fechaNacimiento || !this.dirigidoA) {
      this.errorMessage = 'Completa todos los campos obligatorios.';
      return;
    }

    if (this.dirigidoA === 'Personalizado' &&
      !(this.contenidoPersonalizado && this.contenidoPersonalizado.trim())) {
      this.errorMessage = 'Escribe el destinatario personalizado.';
      return;
    }

    const dayForTipo = this.selectedPeriodo === '30' ? this.getLastDayOfSelectedMonth() : 15;

    const payload = {
      id: String(this.cedula),
      year: Number(this.selectedYear),
      month: Number(this.selectedMonth),
      day: dayForTipo,
      sendto: this.dirigidoA === 'Personalizado'
        ? this.contenidoPersonalizado.trim()
        : this.dirigidoA
    };

    this._reportService.generateJobCertify(payload, this.selectedCompany).subscribe(
      response => {
        let urlFromBackend = '';
        if (response) {
          if (typeof response === 'string') urlFromBackend = response.trim();
          else if (response.content) urlFromBackend = String(response.content).trim();
          else if (response.url) urlFromBackend = String(response.url).trim();
        }

        const folder = this.getCompanyFolder(this.selectedCompany);
        const fallbackUrl = `${this.urlShared}${folder}/employee/jobcertify/${this.cedula}.pdf`;

        const finalUrl = urlFromBackend || fallbackUrl;

        window.open(finalUrl, '_blank');
        this.successMessage = 'Carta generada correctamente.';
        this.cancelForm();
      },
      error => {
        this.redirectIfSessionInvalid(error);
        this.errorMessage = 'Ocurrió un error generando la carta.';
      }
    );
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
    this.selectedCompany = '';
    this.selectedCompanyPrint = '';
    this.onCompanyChange();
  }

  public onCompanyChange() {
    this.selectedCompanyPrint = this.getCompanyFolder(this.selectedCompany);
  }

  private resetForm() {
    this.selectedCompany = '';
    this.selectedCompanyPrint = '';
    this.cedula = null;
    this.selectedPeriodo = '';
    this.fechaNacimiento = '';
    this.dirigidoA = '';
    this.contenidoPersonalizado = '';
    this.showResumen = false;
    this.formLocked = false;
    this.setMesAnterior();
  }
}
