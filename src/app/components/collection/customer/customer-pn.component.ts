import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { PersonNatural } from '../../../models/customer/client-pn';
import { Department } from '../../../models/customer/client-department';
import { Municipality } from '../../../models/customer/client-municipality';
import { BusinessPartnerService } from '../../../services/business-partner.service';

declare var $: any;

@Component({
  templateUrl: './customer-pn.component.html',
  styleUrls: ['./customer-pn.component.css'],
  providers: [BusinessPartnerService]
})

export class CustomerPnComponent {
  public tipoDi1: string = '';
  public numDi1: string = '';
  public stDi1: string = '';
  public stDi1a: string = '';
  public cardiDi1: string = '';
  public numDi2: string = '';
  public stDi2: string = '';
  public stDi2a: string = '';
  public cardiDi2: string = '';
  public numDi3: string = '';
  public tipoViv: string = '';
  public undDi: string = '';
  public numApto: string = '';
  public changeCustomerPNMessage: string;
  public changeCustomerPNErrorMessage: string;
  public clientPn: PersonNatural = new PersonNatural();
  public municipalities: Municipality[] = [];
  public departments: Department[] = [];
  public filteredMunicipalities: Municipality[] = [];
  public camposCompletados: number = 0;
  // Variables para los datos del gráfico Dona
  public pieChartLabels = ['% Cliente'];
  public pieChartData = [];
  public pieChartType = 'doughnut';

  constructor(private _router: Router, private _businessPartnerService: BusinessPartnerService) {
    this.clientPn.acceptHabeasData = 'Y';
    this.clientPn.companyName = 'VELEZ';
    this.clientPn.typeDoc = '13';
    this.clientPn.codDepartamento = '';
    this.clientPn.codMunicipio = '';
  }

  ngOnInit() {
    this.getListOfDepartments();
    this.getListOfMunicipalities();
    $('#name').focus();
  }

  private redirectIfSessionInvalid(error): void {
    if (error && error.status && error.status == 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

  // Traslado función para actualizar progreso
  public onFormChange() {
    this.updateProgres();
  }

  // Método para obtener la lista de departamentos
  public getListOfDepartments() {
    this._businessPartnerService.listDepartments().subscribe(
      response => {
        this.departments = response;
      },
      error => {
        console.error('Error al obtener la lista de municipios:', error);
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  // Método para obtener la lista de municipios
  public getListOfMunicipalities() {
    this._businessPartnerService.listMunicipalities().subscribe(
      response => {
        this.municipalities = response;
      },
      error => {
        console.error('Error al obtener la lista de municipios:', error);
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  // Método para filtrar los municipios
  public onDepartamentChange() {
    const selectedDepartamentCode = this.clientPn.codDepartamento;
    this.filteredMunicipalities = this.municipalities.filter(
      (municipality) => municipality.code.startsWith(selectedDepartamentCode)
    );
    if (this.filteredMunicipalities && this.filteredMunicipalities.length > 0) {
      this.clientPn.codMunicipio = this.filteredMunicipalities[0].code;
    }
    this.clientPn.codMunicipio = '';
    this.updateProgres();
  }

  // Método para crear cliente
  public createClient() {
    $('#modal_transfer_process').modal({ backdrop: 'static', keyboard: false, show: true });
    this._businessPartnerService.createClientPn(this.clientPn).subscribe(
      response => {
        if (response.code === 0) {
          this.clear();
          this.changeCustomerPNMessage = 'Cliente creado con éxito: ' + response.content;
          this.clientPn = new PersonNatural;
        } else {
          this.changeCustomerPNErrorMessage = response.content;
        }
        $('#modal_transfer_process').modal('hide');
      },
      error => {
        console.error(error);
        $('#modal_transfer_process').modal('hide');
        this.changeCustomerPNErrorMessage = 'Ha ocurrido un error de conexión';
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  // Método para calcular el progreso general del formulario
  public updateProgres() {
    const camposModelo = [
      'document',
      'firstname',
      'lastname1',
      'lastname2',
      'phone',
      'cellular',
      'mail',
      'codDepartamento',
      'codMunicipio',
      'address',
      'priceList'
    ];
    const camposLlenos = camposModelo.filter(campo => this.clientPn.hasOwnProperty(campo) && this.clientPn[campo] && this.clientPn[campo].toString().trim() !== '');
    this.camposCompletados = (camposLlenos.length / camposModelo.length) * 100;
  }

  // Concatenar campos de modal direccion
  public updateAddres() {
    this.clientPn.address = `${this.tipoDi1} ${this.numDi1}${this.stDi1}${this.stDi1a}${this.cardiDi1} ${this.numDi2}${this.stDi2}${this.stDi2a}${this.cardiDi2} ${this.numDi3} ${this.tipoViv} ${this.undDi} ${this.numApto}`;
  }

  // Limpiar campos de modal direccion
  public deleteNomenclature() {
    this.clientPn.address = '';
    this.tipoDi1 = '';
    this.numDi1 = '';
    this.stDi1a = '';
    this.cardiDi1 = '';
    this.numDi2 = '';
    this.stDi2 = '';
    this.stDi2a = '';
    this.cardiDi2 = '';
    this.numDi3 = '';
    this.tipoViv = '';
    this.undDi = '';
    this.numApto = '';
    this.updateProgres();
  }

  // Vaciar formulario y reiniciar objeto cliente
  public clear() {
    this.clientPn.codDepartamento = '';
    this.clientPn.codMunicipio = '';
    this.clientPn.firstname = '';
    this.clientPn.lastname1 = '';
    this.clientPn.lastname2 = '';
    this.clientPn.document = '';
    this.clientPn.mail = '';
    this.clientPn.phone = '';
    this.clientPn.cellular = '';
    this.clientPn.codDepartamento = '';
    this.clientPn.codMunicipio = '';
    this.clientPn.address = '';
    this.clientPn.priceList = '';
    this.camposCompletados = 0;
    this.changeCustomerPNErrorMessage = '';
    this.changeCustomerPNMessage = '';
    this.deleteNomenclature();
    $('#name').focus();
  }
}
