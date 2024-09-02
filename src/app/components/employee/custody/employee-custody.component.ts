import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { EmployeeService } from '../../../services/employee.service';
import { BinLocationService } from '../../../services/bin-locations.service';
import { CustodyEmployee } from '../../../models/custody-employee';
import { GLOBAL } from '../../../services/global';
import { Employee } from 'app/models/employee';
import { ReportService } from '../../../services/report.service';

declare var $: any;

@Component({
  templateUrl: './employee-custody.component.html',
  styleUrls: ['./employee-custody.component.css'],
  providers: [UserService, EmployeeService, BinLocationService, ReportService]
})

export class EmployeeCustodyComponent {
  public identity;
  public selectedCompany: string;
  public filter: string;
  public custodys: Array<CustodyEmployee>;
  public employees: Array<Employee>;
  public idAsset: string;
  public typeAsset: string;
  public brandAsset: string;
  public refAsset: string;
  public serialAsset: string;
  public selectedCompanyAsset: string;
  public datePurchaseAsset: Date;
  public ccostoAsset: string;
  public selectedStatusAsset: string;
  public noteAsset: string;
  public urlAsset: string;
  public selectedIdEmployee: string;
  public messageEmployee: string;
  public urlShared: string = GLOBAL.urlShared;
  public userAssign: string;
  public document: string;
  public fullName: string;
  public selectedDepartament: string;
  public selectedCompanyEmpl: string;
  public ccosto: string;
  public selectedStatusEmpl: string;
  public messageNewEmployee: string;
  public validDoc: boolean = true;
  public validFullName: boolean = true;
  public validSelectDep: boolean = true;
  public validSelectCompanyEmpl: boolean = true;
  public validCcosto: boolean = true;
  public validSelectStatusEmpl: boolean = true;
  public validIdAsset: boolean = true;
  public validTypeAsset: boolean = true;
  public validBrandAsset: boolean = true;
  public validRefAsset: boolean = true;
  public validSerialAsset: boolean = true;
  public validSelectedCompanyAsset: boolean = true;
  public validSelectStatusAsset: boolean = true;
  public validNoteAsset: boolean = true;
  public validUrlAsset: boolean = true;
  public validSelectIdEmployee: boolean = true;
  public bottonAction: string = 'Crear';
  public messageNewAsset: string = '';
  public datePurchase: string;
  public companyPurchase: string;
  public messageCustodyPrint: string;

  constructor(private _router: Router, private _userService: UserService, private _employeeService: EmployeeService, private _binLocationService: BinLocationService, private _reportService: ReportService) {
  }

  ngOnInit() {
    this.identity = this._userService.getItentity();
    if (this.identity === null) {
      this._router.navigate(['/']);
    } else {
      //TODO: Se valida sesion inactiva invocando este servicio
      this.validateInactiveSession();
      this.listEmployeesActive();
    }
  }

  private redirectIfSessionInvalid(error) {
    if (error && error.status && error.status == 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

  private validateInactiveSession() {
    $('#modal_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });

    this._binLocationService.getBinAbs("01INVENTARIO").subscribe(
      response => {
        if (response.code == 0) {
          $('#modal_process').modal('hide');
          $('#filter').focus();
        } else {
          this.messageEmployee = 'Lo sentimos. Se produjo un error interno.'
        }
      },
      error => {
        $('#modal_process').modal('hide');
        console.error(error);
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public getCustodyByEmployeeOrAsset(filter: string) {
    //TODO: Se valida sesion inactiva invocando este servicio
    this.validateInactiveSession();

    this.clean();
    $('#modal_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });

    this._employeeService.listCustodyByEmployeeOrAsset(filter).subscribe(
      response => {
        if (response.code < 0) {
          this.messageEmployee = response.content;
        } else {
          this.custodys = response;
        }
        $('#modal_process').modal('hide');
      }, error => {
        console.error(error);
        $('#modal_process').modal('hide');
      }
    );
  }

  public findEmployee() {
    this._employeeService.findEmployee(this.document).subscribe(
      response => {
        if (response.code == 0) {
          this.document = response.content.cardCode;
          this.fullName = response.content.cardName;
          this.selectedDepartament = response.content.department;
          this.selectedCompanyEmpl = response.content.companyName;
          this.ccosto = response.content.ccosto;
          this.selectedStatusEmpl = response.content.status;
          this.bottonAction = 'Actualizar';
        } else {
          this.fullName = '';
          this.selectedDepartament = '';
          this.selectedCompanyEmpl = '';
          this.ccosto = '';
          this.selectedStatusEmpl = '';
          this.bottonAction = 'Crear';
        }
      },
      error => { console.error(error); }
    );
  }

  public listEmployeesActive() {
    this._employeeService.listEmployeesActives().subscribe(
      response => {
        this.employees = response;
      }, error => {
        console.error(error);
      }
    );
  }

  public findAsset() {
    this._employeeService.findAsset(this.idAsset).subscribe(
      response => {
        if (response.code == 0) {
          this.idAsset = response.content.idAsset;
          this.typeAsset = response.content.type;
          this.brandAsset = response.content.brand;
          this.refAsset = response.content.reference;
          this.serialAsset = response.content.serial;
          this.selectedCompanyAsset = response.content.company;
          this.datePurchaseAsset = response.content.datePurchase;
          this.ccostoAsset = response.content.ccosto;
          this.selectedStatusAsset = response.content.status;
          this.noteAsset = response.content.comment;
          this.urlAsset = response.content.pictureAssetUrl;
          this.selectedIdEmployee = response.content.employeeDTO.cardCode;
          this.bottonAction = 'Actualizar';
        } else {
          this.typeAsset = '';
          this.brandAsset = '';
          this.refAsset = '';
          this.serialAsset = '';
          this.selectedCompanyAsset = '';
          this.datePurchaseAsset = null;
          this.ccostoAsset = '';
          this.selectedStatusAsset = '';
          this.noteAsset = '';
          this.urlAsset = '';
          this.selectedIdEmployee = '';
          this.bottonAction = 'Crear';
        }
      }, error => { console.error(error); }
    );
  }

  public addOrRefrescAsset() {
    const assetMaster = {
      "idAsset": this.idAsset,
      "type": this.typeAsset,
      "brand": this.brandAsset,
      "reference": this.refAsset,
      "serial": this.serialAsset,
      "company": this.selectedCompanyAsset,
      "datePurchase": this.datePurchaseAsset,
      "ccosto": this.ccostoAsset,
      "status": this.selectedStatusAsset,
      "comment": this.noteAsset,
      "pictureAssetUrl": this.urlAsset,
      "employeeDTO": {
        "cardCode": this.selectedIdEmployee
      }
    }

    this._employeeService.addOrRefrescAsset(assetMaster, this.bottonAction).subscribe(
      response => {
        if (response.code == 0) {
          $('#modal_new_asset').modal('hide');
        } else {
          this.messageNewEmployee = response.content;
        }
        this.clean();
      }, error => { console.error(error); }
    );
  }

  public addOrRefrescEmployee() {
    this.messageNewEmployee = '';

    const employeeDTO = {
      "cardCode": this.document,
      "cardName": this.fullName.toUpperCase(),
      "department": this.selectedDepartament,
      "companyName": this.selectedCompanyEmpl,
      "ccosto": this.ccosto,
      "status": this.selectedStatusEmpl
    }

    this._employeeService.addOrRefrescEmployee(employeeDTO, this.bottonAction).subscribe(
      response => {
        if (response.code == 0) {
          $('#modal_add_employee').modal('hide');
          this.listEmployeesActive();
        } else {
          this.messageNewEmployee = response.content;
        }
        this.clean();
      }, error => { console.error(error); }
    );
  }

  public generateCustodyPrint() {
    let printReportDTO = {
      "id": this.document,
      "copias": 0,
      "documento": "custodyPrint",
      "companyName": this.identity.selectedCompany,
      "origen": 'W',
      "imprimir": false,
    };

    this._reportService.generateReport(printReportDTO).subscribe(
      response => {
        if (response.code == 0) {
          window.open(this.urlShared + this.identity.selectedCompany + '/employee/custodyPrint/' + this.document + '.pdf');
          this.clean();
          $('#modal_print').modal('hide');
          $('#modal_process').modal('hide');
        } else {
          this.messageCustodyPrint = response.content;
          $('#modal_process').modal('hide');
        }
      },
      error => {
        this.redirectIfSessionInvalid(error);
        console.error(error);
        $('#modal_process').modal('hide');
      }
    );
  }

  public clean() {
    this.messageEmployee = '';
    this.messageNewEmployee = '';
    this.custodys = new Array<CustodyEmployee>();
    this.document = '';
    this.fullName = '';
    this.selectedDepartament = '';
    this.selectedCompanyEmpl = '';
    this.ccosto = '';
    this.selectedStatusEmpl = '';
    this.idAsset = '';
    this.typeAsset = '';
    this.brandAsset = '';
    this.refAsset = '';
    this.serialAsset = '';
    this.selectedCompanyAsset = '';
    this.datePurchaseAsset = null;
    this.ccostoAsset = '';
    this.selectedStatusAsset = '';
    this.noteAsset = '';
    this.urlAsset = '';
    this.selectedIdEmployee = '';
    this.bottonAction = 'Crear';
    this.filter = '';
    this.document = '';
    this.messageCustodyPrint = '';
  }

  public showModalInfo(custody) {
    this.idAsset = custody.idAsset;
    this.userAssign = custody.userAssign;
    this.datePurchase = custody.datePurchase == null ? "SIN DEFINIR" : custody.datePurchase;
    this.companyPurchase = custody.companyPurchase;
    $('#modal_info_custody').modal('show');
  }

  public editModalAsset(custody) {
    this.idAsset = custody.idAsset;
    this.typeAsset = custody.type;
    this.brandAsset = custody.brand;
    this.refAsset = custody.referencia;
    this.serialAsset = custody.serial;
    this.selectedCompanyAsset = custody.company;
    this.datePurchaseAsset = custody.datePurchase;
    this.ccostoAsset = custody.ccAsset;
    this.selectedStatusAsset = custody.statusAsset;
    this.noteAsset = custody.comment;
    this.urlAsset = custody.pictureAssetUrl;
    this.selectedIdEmployee = custody.cardCode;
    this.urlAsset = custody.pictAsset;
    this.bottonAction = 'Actualizar';
    $('#modal_new_asset').modal('show');
  }

  public getScrollTop() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }
}
