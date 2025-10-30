import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Client } from '../../../models/customer/client';
import { Advisor } from '../../../models/customer/client-advisor';
import { Municipality } from '../../../models/customer/client-municipality';
import { Department } from '../../../models/customer/client-department';
import { BusinessPartnerService } from '../../../services/business-partner.service';
import { UserService } from '../../../services/user.service';

declare var $: any;
declare var google: any;

@Component({
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css'],
  providers: [BusinessPartnerService, UserService]
})

export class CustomerComponent implements OnInit {
  private googleMap: any;
  // Variable para almacenar el progreso actual
  public camposCompletados: number = 0;
  //Progreso Tabs
  public progressTab1: number = 0;
  public progressTab2: number = 0;
  public progressTab3: number = 0;
  public progressTab4: number = 0;
  public progressTab5: number = 0;
  // Modal Direcciones
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
  // Modal Direcciones MM
  public tipoDi1MM: string = '';
  public numDi1MM: string = '';
  public stDi1MM: string = '';
  public stDi1aMM: string = '';
  public cardiDi1MM: string = '';
  public numDi2MM: string = '';
  public stDi2MM: string = '';
  public stDi2aMM: string = '';
  public cardiDi2MM: string = '';
  public numDi3MM: string = '';
  public tipoVivMM: string = '';
  public undDiMM: string = '';
  public numAptoMM: string = '';
  public map: any;
  public tempSearchMode: boolean;
  public filter: string = '';
  public client: Client = new Client(); // Instancia de la clase Client
  public advisors: Advisor[] = []; // Lista de asesores
  public regions: string[] = []; // lista de regiones
  public municipalities: Municipality[] = []; // Lista de municipios
  public departments: Department[] = []; // Lista de departamentos
  public filteredMunicipalities: Municipality[] = [];
  private initialClient: Client;  // Almacenamos una copia inicial
  private readonly MAX_LIMIT = 50000000;
  public isSearchMode: boolean = false;
  public isEditMode: boolean = false;
  public selectedCompany: string;
  public typeTransaction: string;
  public wTCode3: string;
  public wtCode4: string;
  //Alertas
  public changeCustomerMessage: string;
  public changeCustomerErrorMessage: string;
  // Variables para los datos del gráfico
  barChartLabels = ['Cliente', 'Contacto', 'Ubicacion', 'Campos mandatarios', 'Finanzas'];
  barChartData = [];
  barChartType = 'bar';
  barChartColors: any[] = [
    {
      backgroundColor: ['#F3ABC2', '#F6D1DE', '#75F9F2', '#B0F6F2', '#EEF6B0'],
      borderColor: '#ffffff', // Color de borde opcional
    }
  ];
  // Opciones del gráfico de barras
  barChartOptions: any = {
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero: true,
          max: 100,
          stepSize: 20
        }
      }]
    }
  };
  // Variables para los datos del gráfico Dona
  pieChartLabels = ['% Cliente'];
  pieChartData = [];
  pieChartType = 'doughnut';

  constructor(private _router: Router, private _businessPartnerService: BusinessPartnerService, private _userService: UserService) {
    this.client.selectedGroup = '';
    this.client.selectedAdviser = '';
    this.client.selectedZone = '';
    this.client.selectedTaxResposabilitie = '';
    this.client.selectedTypeSell = '';
    this.client.codDepartamento = ''
    this.client.codMunicipio = '';
    this.client.selectedTaxAdrress = '';
    this.client.typeDoc = '';
    this.client.selectedPersonType = '';
    this.client.selectedTaxRegimen = '';
    this.client.selectedCityMM = '';
    this.client.selectedVariable = '';
    this.client.selectedPaymentCondition = '';
    this.client.selectedTaxType = '';
    this.client.selectedCodeCityMM = 0;
    this.client.selectedCityCode = 0;
    this.client.occupationContactPerson = '';
    this.client.commitedLimit = 0;
    this.client.creditLimit = 0;
    this.client.discount = 0;
    this.initializeClient();
  }

  ngOnInit() {
    const identity = this._userService.getItentity();
    if (identity) {
      this.selectedCompany = identity.selectedCompany;
    }

    const mapOptions = {
      center: { lat: 6.124942, lng: -75.631201 },
      zoom: 18,
    };

    this.googleMap = new google.maps.Map(
      document.getElementById('google-map'),
      mapOptions
    );

    this.googleMap.addListener('click', (event) => {
      $('#latInput').focus();
      this.updateCoordinates(event.latLng.lat(), event.latLng.lng());
    });

    this.getListOfAdvisors();
    this.getListOfMunicipalities();
    this.getListOfDepartments();
    $('#name').focus();
  }

  private redirectIfSessionInvalid(error) {
    if (error && error.status && error.status == 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

  // Método para eliminar espacios en el input cuando pierde el foco
  public trimInput(field: string) {
    if (this.client[field]) {
      this.client[field] = this.client[field].trim();
    }
  }

  // Método para obtener info de asesores
  public getListOfAdvisors() {
    this._businessPartnerService.listAdvisors("*").subscribe(
      response => {
        this.advisors = response.map((item) => {
          return new Advisor(item[0], item[1], item[2], item[3], item[4]);
        });

        // Extraer regiones únicas
        const uniqueRegions = new Set(this.advisors.map(a => a.region).filter(r => !!r));
        this.regions = Array.from(uniqueRegions);
      },
      error => {
        console.error('Error al obtener la lista de asesores:', error);
        this.redirectIfSessionInvalid(error);
      }
    );
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

  // Método para inicializar el cliente y guardar la copia inicial
  private initializeClient() {
    this.initialClient = { ...this.client };
  }

  // Método para Cambiar de modo
  public toggleSearchMode(isSearch: boolean) {
    if (this.isSearchMode !== isSearch) {
      this.tempSearchMode = isSearch;
      $('#confirmationModal').modal('show');
    }
  }

  // Restaurar valores iniciales si se cambia de modo
  public confirmModeChange() {
    if (!this.tempSearchMode) {
      this.client = { ...this.initialClient };
      this.clear();
      this.isEditMode = false;
      $(document).ready(function () {
        $('#tab0').click();
      });
    }
    else {
      this.client = new Client();
      this.clear();
      this.isEditMode = false;
    }
    this.isSearchMode = this.tempSearchMode;
    $('#confirmationModal').modal('hide');
  }

  // Calcular progreso
  public updateProgress() {
    const camposModelo = [
      'cardName',
      'cardCode',
      'selectedGroup',
      'phone',
      'cellular',
      'mail',
      'selectedTaxResposabilitie',
      'selectedZone',
      'selectedAdviser',
      'idContactPerson',
      'nameContactPerson',
      'lastNameContactPerson',
      'occupationContactPerson',
      'phoneContactPerson',
      'dateContactPerson',
      'idAdress',
      'address',
      'codDepartamento',
      'codMunicipio',
      'latitudeMap',
      'lengthMap',
      'firstname',
      'lastname1',
      'lastname2',
      'typeDoc',
      'selectedPersonType',
      'selectedTaxRegimen',
      'selectedCityMM',
      'addressMM',
      'emailFE',
      'selectedVariable',
      'selectedPaymentCondition',
      'selectedTypeSell',
    ];

    const camposLlenos = camposModelo.filter(
      campo => this.client.hasOwnProperty(campo) && this.client[campo] !== ''
    ).length;
    // Retenciones: lógica por compañía
    let extrasLlenos = 0;
    if (this.selectedCompany === 'IGB') {
      if (this.wTCode3) extrasLlenos++;
      if (this.wtCode4) extrasLlenos++;
    } else if (this.selectedCompany === 'VARROC') {
      // Solo una de las dos es requerida
      if (this.wTCode3 || this.wtCode4) extrasLlenos++;
    }
    const totalCampos = camposModelo.length + (this.selectedCompany === 'IGB' ? 2 : 1);
    const totalLlenos = camposLlenos + extrasLlenos;
    this.camposCompletados = (totalLlenos / totalCampos) * 100;
    this.calculateProgress();
    this.changeCustomerMessage = '';
    this.changeCustomerErrorMessage = '';
  }

  // Método para calcular el progreso con campos de todos los tabs
  public calculateProgress(): number {
    const camposTab1 = [
      'cardName',
      'cardCode',
      'selectedGroup',
      'phone',
      'cellular',
      'mail',
      'selectedTaxResposabilitie',
      'selectedZone',
      'selectedAdviser'
    ];
    const camposTab2 = [
      'idContactPerson',
      'nameContactPerson',
      'lastNameContactPerson',
      'occupationContactPerson',
      'phoneContactPerson',
      'dateContactPerson'
    ];
    const camposTab3 = [
      'idAdress',
      'address',
      'codDepartamento',
      'codMunicipio',
      'latitudeMap',
      'lengthMap'
    ];
    const camposTab4 = [
      'firstname',
      'lastname1',
      'lastname2',
      'typeDoc',
      'selectedPersonType',
      'selectedTaxRegimen',
      'selectedCityMM',
      'addressMM',
      'emailFE',
      'selectedVariable',
      'selectedTypeSell'
    ];
    const camposTab5 = [
      'selectedPaymentCondition'
    ];
    this.progressTab1 = this.calculateProgressTab(camposTab1);
    this.progressTab2 = this.calculateProgressTab(camposTab2);
    this.progressTab3 = this.calculateProgressTab(camposTab3);
    this.progressTab4 = this.calculateProgressTab(camposTab4);
    this.progressTab5 = this.calculateProgressTab(camposTab5);
    const progresoTotal = this.progressTab1 + this.progressTab2 + this.progressTab3 + this.progressTab4 + this.progressTab5;
    return Math.min(progresoTotal, 100);
  }

  // Método para calcular el progreso de un tab específico
  private calculateProgressTab(campos: string[]): number {
    const camposLlenos = campos.filter(campo => this.client.hasOwnProperty(campo) && this.client[campo] !== '');
    const progreso = (camposLlenos.length / campos.length) * 100;
    return Number(progreso.toFixed(0));
  }

  // Método para manejar la validación del nombre del cliente
  public handleValidation() {
    const minNameLength = 9;
    this.changeCustomerErrorMessage = '';
    if (this.client.cardName && this.client.cardName.length < minNameLength) {
      this.changeCustomerErrorMessage = 'El nombre debe tener al menos 9 caracteres.';
      $('#name').focus();
      return;
    }
    if (!this.client.cardName || !this.changeCustomerErrorMessage) {
      this.updateProgress();
    }
    this.changeCustomerErrorMessage = '';
  }

  // Método para manejar la validación de los campos de teléfono
  public phoneValidation() {
    const minPhoneNumberLength = 10;
    this.changeCustomerErrorMessage = '';
    if (this.client.phone && this.client.phone.length < minPhoneNumberLength) {
      this.changeCustomerErrorMessage = 'El teléfono fijo debe tener al menos 10 caracteres.';
      $('#phone').focus();
      return;
    } else {
      this.updateProgress();
    }
    // Validación del teléfono móvil
    if (this.client.cellular && this.client.cellular.length < minPhoneNumberLength) {
      this.changeCustomerErrorMessage = 'El teléfono móvil debe tener al menos 10 caracteres.';
      $('#cellular').focus();
      return;
    } else {
      this.updateProgress();
    }
    if (!this.changeCustomerErrorMessage) {
      this.changeCustomerErrorMessage = '';
    }
  }

  // Método para manejar la validación del campo de correo electrónico
  public emailValidation() {
    const minEmailLength = 10;
    this.changeCustomerErrorMessage = '';
    if (this.client.mail && this.client.mail.length < minEmailLength) {
      this.changeCustomerErrorMessage = 'El correo electrónico debe tener al menos 10 caracteres.';
      $('#email').focus();
      return;
    }
    if (this.client.mail && !this.client.mail.includes('@')) {
      this.changeCustomerErrorMessage = 'El correo electrónico debe contener el símbolo "@".';
      $('#email').focus();
      return;
    }
    if (!this.client.mail || !this.changeCustomerErrorMessage) {
      this.updateProgress();
      return;
    }
    this.changeCustomerErrorMessage = '';
  }

  // Método para manejar la validación del campo de correo electrónico FE
  public emailFEValidation() {
    const minEmailLength = 10;
    this.changeCustomerErrorMessage = '';
    if (this.client.emailFE.length < minEmailLength) {
      this.changeCustomerErrorMessage = 'El correo electrónico de facturación electrónica (FE) debe tener al menos 10 caracteres.';
      $('#emailFE').focus();
      return;
    }
    if (this.client.emailFE && !this.client.emailFE.includes('@')) {
      this.changeCustomerErrorMessage = 'El correo electrónico de facturación electrónica (FE) debe contener el símbolo "@".';
      $('#emailFE').focus();
      return;
    }
    if (!this.client.emailFE || !this.changeCustomerErrorMessage) {
      this.updateProgress();
    }
    this.changeCustomerErrorMessage = '';
  }

  // Método único que valida dependiendo el modo
  public getValidationErrorMessage(): string {
    if (this.isEditMode) {
      return this.validateFormEdit(); // Si estamos editando
    } else {
      return this.validateForm(); // Si estamos creando
    }
  }

  // Validar formulario en modo edición
  public validateFormEdit(): string {
    let errorMessage = '';
    if (!this.isEditMode) {
      return '';
    }
    if (!this.client.cardName || this.client.cardName.length < 9) {
      errorMessage = 'El nombre del cliente debe tener al menos 9 caracteres.';
    } else if (!this.client.mail || this.client.mail.length < 9 || !this.client.mail.includes('@')) {
      errorMessage = 'El correo electrónico principal debe tener al menos 9 caracteres y contener el símbolo "@"';
    } else if (!this.client.phone || this.client.phone.length < 7) {
      errorMessage = 'El teléfono fijo debe tener al menos 10 caracteres.';
    } else if (!this.client.cellular || this.client.cellular.length < 10) {
      errorMessage = 'El teléfono móvil debe tener al menos 10 caracteres.';
    } else if (!this.client.selectedAdviser) {
      errorMessage = 'Debe seleccionar un asesor comercial.';
    } else if (!this.client.address || this.client.address.length < 5) {
      errorMessage = 'La dirección debe tener al menos 5 caracteres.';
    } else if (!this.client.codDepartamento || !this.client.codMunicipio) {
      errorMessage = 'Debe seleccionar un departamento y un municipio.';
    }
    return errorMessage;
  }

  // Validar formulario
  public validateForm(): string {
    let errorMessage = '';
    if (!this.isSearchMode && !this.isEditMode) {
      return ''; // No aplican validaciones en solo búsqueda
    }
    if (!this.client.cardName || this.client.cardName.length < 9) {
      errorMessage = 'El nombre del cliente debe tener al menos 9 caracteres';
    } else if (!this.client.emailFE || this.client.emailFE.length < 9 || !this.client.emailFE.includes('@')) {
      errorMessage = 'El correo electrónico de facturación electrónica (FE) debe tener al menos 9 caracteres y contener el símbolo "@"';
    } else if (!this.client.mail || this.client.mail.length < 9 || !this.client.mail.includes('@')) {
      errorMessage = 'El correo electrónico principal debe tener al menos 9 caracteres y contener el símbolo "@"';
    } else if (!this.client.cardCode || this.client.cardCode.length < 7 || this.client.cardCode.charAt(0).toLowerCase() !== 'c') {
      errorMessage = 'El código de cliente debe empezar con la letra "C" y tener al menos 7 caracteres.';
    } else if (this.client.dateContactPerson && new Date(this.client.dateContactPerson).getFullYear() > 2024) {
      errorMessage = 'El año de la fecha de nacimiento no puede ser posterior a 2024.';
    }
    return errorMessage;
  }

  // Método para quitarle la C al cardCode
  public onCardCodeChange() {
    if (this.client.cardCode && this.client.cardCode.length > 0) {
      const firstCharacter = this.client.cardCode.charAt(0);
      if (firstCharacter !== 'c' && firstCharacter !== 'C') {
        this.changeCustomerErrorMessage = 'El código debe empezar con la letra "C".';
        $('#cardCode').focus();
        return;
      }
    }
    if (this.client.cardCode && this.client.cardCode.length > 1) {
      this.client.document = this.client.cardCode.substring(1);
    } else {
      this.client.document = '';
    }
    this.changeCustomerErrorMessage = '';
    this.updateProgress();
  }

  // Método para clasificar los municipios del departamento
  public onDepartamentChange() {
    const selectedDepartamentCode = this.client.codDepartamento;
    this.filteredMunicipalities = this.municipalities.filter(
      (municipality) => municipality.code.startsWith(selectedDepartamentCode)
    );
    if (this.filteredMunicipalities && this.filteredMunicipalities.length > 0) {
      this.client.codMunicipio = this.filteredMunicipalities[0].code;
    }
    this.client.codMunicipio = '';
    if (['94', '95', '97', '99', '91'].includes(selectedDepartamentCode)) {
      this.client.selectedTaxAdrress = 'IVAVEXE';
      this.client.taxType = 'Y';
    } else if (selectedDepartamentCode === '88') {
      this.client.selectedTaxAdrress = 'IVAEXCLU';
      this.client.taxType = 'N';
    } else {
      this.client.selectedTaxAdrress = 'IVAG19';
      this.client.taxType = 'Y';
    }
    if (!this.client.taxType || this.client.taxType.trim() === '') {
      this.client.taxType = '';
    }
    this.updateProgress();
  }

  // Método para asignar descripcion de la responsabilidad fiscal
  public onTaxResponsabilityChange() {
    switch (this.client.selectedTaxResposabilitie) {
      case 'R-99-PN':
        this.client.nameResFis = 'No aplica – Otros';
        break;
      case 'O-47':
        this.client.nameResFis = 'Régimen simple de tributación';
        break;
      case 'O-23':
        this.client.nameResFis = 'Agente de retención IVA';
        break;
      case 'O-13':
        this.client.nameResFis = 'Gran Contribuyente';
        break;
      case 'O-15':
        this.client.nameResFis = 'Autorretenedor';
        break;
      default:
        this.client.nameResFis = '';
        break;
    }
    this.updateProgress();
  }

  // Método para Crear Cliente
  public createClient() {
    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });
    let transpValue: string;
    let priceListValue: number;
    if (this.selectedCompany === 'IGB') {
      transpValue = '03';
      priceListValue = 4;
    } else if (this.selectedCompany === 'VARROC') {
      transpValue = this.client.selectedVariable;
      priceListValue = 1;
    } else {
      transpValue = '03';
      priceListValue = 4;
    }
    const clientData = {
      //Generales
      typeTransaction: 'add',
      companyName: this.selectedCompany,
      acceptHabeasData: 'Y',
      priceList: priceListValue,
      //Cliente
      cardCode: this.client.cardCode,
      cardName: this.client.cardName,
      licTradNum: this.client.licTradNum,
      document: this.client.document,
      phone: this.client.phone,
      cellular: this.client.cellular,
      mail: this.client.mail,
      slpCode: this.client.selectedAdviser,
      zona: this.client.selectedZone,
      comment: this.client.comments,
      grupo: this.client.selectedGroup,
      codeResFis: this.client.selectedTaxResposabilitie,
      descResFis: this.client.nameResFis,
      //Contacto
      contactPerson: this.client.idContactPerson,
      nameContactPerson: this.client.nameContactPerson,
      secondNamecontactPerson: this.client.secondNameContactPerson,
      lastNameContactPerson: this.client.lastNameContactPerson,
      occupationContactPerson: this.client.occupationContactPerson,
      phoneContactPerson: this.client.phoneContactPerson,
      dateContactPerson: this.client.dateContactPerson,
      //Ubicacion
      idAddress: this.client.idAdress,
      address: this.client.address,
      codDepartamento: this.client.codDepartamento,
      codMunicipio: this.client.codMunicipio,
      taxAddress: this.client.selectedTaxAdrress,
      lengthMap: this.client.lengthMap,
      latitudeMap: this.client.latitudeMap,
      //MM
      firstname: this.client.firstname,
      lastname1: this.client.lastname1,
      lastname2: this.client.lastname2,
      typeDoc: this.client.typeDoc,
      typePerson: this.client.selectedPersonType,
      taxRegimen: this.client.selectedTaxRegimen,
      codeCity: this.client.selectedCityMM,
      addressMM: this.client.addressMM,
      regional: this.client.selectedVariable,
      mailFE: this.client.emailFE,
      transp: transpValue,
      typeSell: this.client.selectedTypeSell,
      //Impuestos Y Finanzas
      paymentCondition: this.client.selectedPaymentCondition,
      discount: this.client.discount,
      taxType: this.client.taxType,
      creditLimit: this.client.creditLimit,
      comiteLimit: this.client.creditLimit,
      withholdingTax: [
        ...(this.wTCode3 ? [{ wtCode: this.wTCode3 }] : []),
        ...(this.wtCode4 ? [{ wtCode: this.wtCode4 }] : [])
      ]
    };
    this._businessPartnerService.createClient(clientData).subscribe(
      response => {
        if (response.code === 0) {
          this.clear();
          this.changeCustomerMessage = 'Cliente creado con éxito: ' + response.content;
          $(document).ready(function () {
            $('#tab0').click();
          });
          this.client = { ...this.initialClient };
          this.wTCode3 = "";
          this.wtCode4 = "";
        } else {
          this.changeCustomerErrorMessage = response.content;
        }
        $('#modal_transfer_process').modal('hide');
      },
      error => {
        $('#modal_transfer_process').modal('hide');
        this.changeCustomerErrorMessage = 'Ha ocurrido un error de conexión';
        this.redirectIfSessionInvalid(error);
      }
    );
    $('#confirmationModalCreate').modal('hide');
  }

  // Método para Modificar Cliente
  public updateClient() {
    $('#modal_transfer_process').modal({ backdrop: 'static', keyboard: false, show: true });
    let transpValue: string;
    let priceListValue: number;
    if (this.selectedCompany === 'IGB') {
      transpValue = '03';
      priceListValue = 4;
    } else if (this.selectedCompany === 'VARROC') {
      transpValue = this.client.selectedVariable;
      priceListValue = 1;
    } else {
      transpValue = '03';
      priceListValue = 4;
    }
    const clientData = {
      //Generales
      typeTransaction: 'update',
      companyName: this.selectedCompany,
      acceptHabeasData: 'Y',
      priceList: priceListValue,
      //Cliente
      cardCode: this.client.cardCode,
      cardName: this.client.cardName,
      licTradNum: this.client.licTradNum,
      document: this.client.document,
      phone: this.client.phone,
      cellular: this.client.cellular,
      mail: this.client.mail,
      slpCode: this.client.selectedAdviser,
      zona: this.client.selectedZone,
      comment: this.client.comments,
      grupo: this.client.selectedGroup,
      //codeResFis: this.client.selectedTaxResposabilitie,
      //descResFis: this.client.nameResFis,
      //Contacto
      //contactPerson: this.client.idContactPerson,
      //nameContactPerson: this.client.nameContactPerson,
      //secondNamecontactPerson: this.client.secondNameContactPerson,
      //lastNameContactPerson: this.client.lastNameContactPerson,
      //occupationContactPerson: this.client.occupationContactPerson,
      //phoneContactPerson: this.client.phoneContactPerson,
      //dateContactPerson: this.client.dateContactPerson,
      //Ubicacion
      idAddress: this.client.idAdress,
      address: this.client.address,
      codDepartamento: this.client.codDepartamento,
      codMunicipio: this.client.codMunicipio,
      taxAddress: this.client.selectedTaxAdrress,
      //lengthMap: this.client.lengthMap,
      //latitudeMap: this.client.latitudeMap,
      //MM
      firstname: this.client.firstname,
      lastname1: this.client.lastname1,
      lastname2: this.client.lastname2,
      typeDoc: this.client.typeDoc,
      typePerson: this.client.selectedPersonType,
      taxRegimen: this.client.selectedTaxRegimen,
      codeCity: this.client.selectedCityMM,
      addressMM: this.client.addressMM,
      regional: this.client.selectedVariable,
      mailFE: this.client.emailFE,
      transp: transpValue,
      typeSell: this.client.selectedTypeSell,
      //Impuestos Y Finanzas
      paymentCondition: this.client.selectedPaymentCondition,
      discount: this.client.discount,
      taxType: this.client.taxType,
      creditLimit: this.client.creditLimit,
      comiteLimit: this.client.creditLimit,
      withholdingTax: [
        ...(this.wTCode3 ? [{ wtCode: this.wTCode3 }] : []),
        ...(this.wtCode4 ? [{ wtCode: this.wtCode4 }] : [])
      ]
    };
    this._businessPartnerService.createClient(clientData).subscribe(
      response => {
        if (response.code === 0) {
          this.clear();
          this.client = { ...this.initialClient };
          this.wTCode3 = "";
          this.wtCode4 = "";
          $('#name').focus();
          this.changeCustomerMessage = response.content;
        } else {
          this.changeCustomerErrorMessage = response.content;
        }
        $('#modal_transfer_process').modal('hide');
      },
      error => {
        $('#modal_transfer_process').modal('hide');
        this.changeCustomerErrorMessage = 'Ha ocurrido un error de conexión';
        this.redirectIfSessionInvalid(error);
      }
    );
    $('#confirmationModalCreate').modal('hide');
  }

  // Método para buscar cliente
  public searchClient() {
    $('#modal_transfer_process').modal({ backdrop: 'static', keyboard: false, show: true });
    this._businessPartnerService.searchClient(this.selectedCompany, this.filter).subscribe(
      response => {
        if (response.code === 0) {
          //Cliente
          this.client.cardCode = response.content.cardCode;
          this.client.cardName = response.content.cardName;
          this.client.selectedAdviser = response.content.slpCode;
          this.client.cellular = response.content.phone2;
          this.client.phone = response.content.phone1;
          this.client.mail = response.content.email;
          this.client.comments = response.content.freeText;
          this.client.selectedGroup = response.content.groupCode;
          this.client.selectedTaxResposabilitie = response.content.ucodeResFis;
          this.client.selectedZone = response.content.territory;
          //Contacto
          this.client.idContactPerson = response.content.idContact;
          this.client.nameContactPerson = response.content.firstNameContact;
          this.client.secondNameContactPerson = response.content.middleNameContact;
          this.client.lastNameContactPerson = response.content.lastNameContact;
          this.client.occupationContactPerson = response.content.positionContact;
          this.client.phoneContactPerson = response.content.tel1Contact;
          this.client.dateContactPerson = response.content.birthDateContact;
          //Ubicacion
          this.client.idAdress = response.content.billToDef;
          this.client.codDepartamento = response.content.state1;
          this.client.codMunicipio = response.content.block;
          this.client.address = response.content.address;
          this.client.latitudeMap = response.content.ulatitud;
          this.client.lengthMap = response.content.ulongitud;
          //MM
          this.client.firstname = response.content.ubpcoNombre;
          this.client.lastname1 = response.content.ubpco1Apellido;
          this.client.lastname2 = response.content.ubpco2Apellido;
          this.client.typeDoc = response.content.ubpcoTDC;
          this.client.selectedPersonType = response.content.ubpcoTP;
          this.client.selectedTaxRegimen = response.content.ubpcoRTC;
          this.client.selectedCityMM = response.content.ubpcoCity;
          this.client.addressMM = response.content.ubpcoAddress;
          this.client.emailFE = response.content.uemailFE;
          this.client.selectedVariable = response.content.uregional;
          this.client.selectedVariable = response.content.utrasp;
          this.client.selectedTypeSell = response.content.typeSell;
          //Impuestos y Finanzas
          this.client.creditLimit = response.content.creditLine;
          this.client.selectedPaymentCondition = response.content.groupNum;
          this.client.taxType = response.content.vatStatus;
          this.client.discount = response.content.discount;
          this.client.creditLimit = response.content.creditLine;
          this.client.commitedLimit = response.content.creditLine;
          this.wTCode3 = response.content.wtAUT3 === 'Y' ? 'AUT3' : '';
          this.wtCode4 = response.content.wtAUT4 === 'Y' ? 'AUT4' : '';
          $('#modal_transfer_process').modal('hide');
          this.onTaxResponsabilityChange();
          this.onCardCodeChange();
          this.centerMap();
          this.updateProgress();
          this.isSearchMode = false;
          this.isEditMode = true;
          this.validateFormEdit();
          $(document).ready(function () { $('#tab0').click(); });
        }
        else {
          $('#modal_transfer_process').modal('hide');
          this.updateProgress();
          this.changeCustomerErrorMessage = response.content;
          $('#filter').focus();
        }
      },
      error => {
        $('#modal_transfer_process').modal('hide');
        this.changeCustomerErrorMessage = 'Ha ocurrido un error de conexión';
        this.redirectIfSessionInvalid(error);
      }
    )
  }

  // Método para centrar el mapa
  public centerMap() {
    let lat = parseFloat(this.client.latitudeMap);
    let lng = parseFloat(this.client.lengthMap);
    if (isNaN(lat) || isNaN(lng) || this.client.latitudeMap.trim() === '' || this.client.lengthMap.trim() === '') {
      lat = 6.124942;
      lng = -75.631201;
    }
    const center = new google.maps.LatLng(lat, lng);
    const marker = new google.maps.Marker({
      position: center,
      map: this.googleMap,
      title: 'Ubicación',
      icon: 'glyphicon glyphicon-map-marker'
    });
    this.googleMap.setCenter(center);
    this.googleMap.setZoom(18);
  }

  // Método para buscar en el mapa
  public searchLocation() {
    const input = document.getElementById('search-location') as HTMLInputElement;
    const autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const location = place.geometry.location;
        this.googleMap.setCenter(location);
      }
    });
  }

  // Modificar cordenadas
  public updateCoordinates(latitude: number, longitude: number) {
    this.client.latitudeMap = latitude.toString(); // Convierte a string si es necesario
    this.client.lengthMap = longitude.toString();
    this.updateProgress();
  }

  // Obtener el nombre del municipio seleccionado
  public centerMapOnCity() {
    const selectedMunicipality = this.filteredMunicipalities.find(municipality => municipality.code === this.client.codMunicipio);
    if (!selectedMunicipality) {
      console.error('No se pudo encontrar el municipio seleccionado.');
      return;
    }
    const cityName = selectedMunicipality.name;
    const selectedDepartment = this.departments.find(department => department.code === this.client.codDepartamento);
    if (!selectedDepartment) {
      console.error('No se pudo encontrar el departamento seleccionado.');
      return;
    }
    const departmentName = selectedDepartment.name;
    const address = `${cityName}, ${departmentName}, Colombia`;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'address': address }, (results, status) => {
      if (status === 'OK' && results && results.length > 0) {
        const location = results[0].geometry.location;
        const latitude = location.lat();
        const longitude = location.lng();

        const mapOptions = {
          center: { lat: latitude, lng: longitude },
          zoom: 13
        };
        this.googleMap.setOptions(mapOptions);
      } else {
        console.error('No se pudo encontrar la ciudad en el mapa.');
      }
    });
  }

  // Ubicar el mapa en el municipio seleccionado
  public onMunicipalityChange() {
    this.centerMapOnCity();
    this.updateProgress();
  }

  // Concatenar campos de modal direccion
  public updateAddress() {
    this.client.address = `${this.tipoDi1} ${this.numDi1}${this.stDi1}${this.stDi1a}${this.cardiDi1} ${this.numDi2}${this.stDi2}${this.stDi2a}${this.cardiDi2} ${this.numDi3} ${this.tipoViv} ${this.undDi} ${this.numApto}`.trim();
  }

  // Concatenar campos de modal direccion MM
  public updateAddressMM() {
    this.client.addressMM = `${this.tipoDi1MM} ${this.numDi1MM}${this.stDi1MM}${this.stDi1aMM}${this.cardiDi1MM} ${this.numDi2MM}${this.stDi2MM}${this.stDi2aMM}${this.cardiDi2MM} ${this.numDi3MM} ${this.tipoVivMM} ${this.undDiMM} ${this.numAptoMM}`.trim();
  }

  // Metodo para convertir string en miles
  private formatNumber(n?: number): string {
    if (n == null) return '';
    return new Intl.NumberFormat('es-CO').format(n);
  }

  public formatMoneyInput(event: Event, field: 'creditLimit' | 'commitedLimit') {
    const el = event.target as HTMLInputElement;
    const raw = el.value.replace(/\D/g, ''); // solo dígitos
    let val = raw ? Number(raw) : 0;

    // límites
    if (val < 0) val = 0;
    if (val > this.MAX_LIMIT) val = this.MAX_LIMIT;

    this.client[field] = val;
    el.value = this.formatNumber(val);

    //notifica cambio de progreso
    this.updateProgress();
  }

  public displayMoney(n?: number): string {
    return this.formatNumber(n != null ? n : 0);
  }

  // Limpiar campos de modal direccion
  public deleteNomenclature() {
    this.client.address = '';
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
  }

  // Limpiar campos de modal direccion MM
  public deleteNomenclatureMM() {
    this.client.addressMM = '';
    this.tipoDi1MM = '';
    this.numDi1MM = '';
    this.stDi1aMM = '';
    this.cardiDi1MM = '';
    this.numDi2MM = '';
    this.stDi2MM = '';
    this.stDi2aMM = '';
    this.cardiDi2MM = '';
    this.numDi3MM = '';
    this.tipoVivMM = '';
    this.undDiMM = '';
    this.numAptoMM = '';
  }

  public clearCoordinates() {
    this.client.latitudeMap = '';
    this.client.lengthMap = '';
    $('#latInput').focus();
    this.updateProgress();
  }

  // Validar formulario
  public clear() {
    this.camposCompletados = 0;
    this.progressTab1 = 0;
    this.progressTab2 = 0;
    this.progressTab3 = 0;
    this.progressTab4 = 0;
    this.progressTab5 = 0;
    this.filter = '';
    this.changeCustomerErrorMessage = '';
    this.changeCustomerMessage = '';
  }
}
