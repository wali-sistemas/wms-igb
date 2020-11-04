import { Component, OnInit } from '@angular/core';
import { GLOBAL } from '../../services/global';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../services/user.service';
import { SalesOrdersService } from '../../services/sales-orders.service';
import { DeliveryService } from '../../services/delivery.service';
import { SalesOrder, SalesOrderLine } from '../../models/sales-order';
import { HealthchekService } from '../../services/healthchek.service';
import { ReportService } from '../../services/report.service';

declare var $: any;

@Component({
  templateUrl: './sales-orders.component.html',
  styleUrls: ['./sales-orders.component.css'],
  providers: [UserService, SalesOrdersService, DeliveryService, HealthchekService, ReportService]
})
export class SalesOrdersComponent implements OnInit {
  public urlShared: string = GLOBAL.urlShared;
  public identity;
  public token;
  public orders: Array<SalesOrder>;
  public filteredOrders: Array<SalesOrder>;
  public filter: string = '';
  public searchFilter: string;
  public showApprovedOnly: boolean = true;
  public filterGroup: boolean = false;
  public selectedOrders: Map<String, String>;
  public assignableUsers: Array<any>;
  public availableStock: Array<any>;
  public selectedUser: string = '';
  public allStockAvailable: boolean = true;
  public loadingAvailableStock: boolean = false;
  public selectedOrder: number;
  public processDeliveryStatus: string = 'none';
  public processPrintLabelsStatus: string = 'none';
  public docEntryDelivery: number;
  public orderPickingExpress: String;
  public deliveryErrorMessage: string = '';
  public orderNumber: string = '';

  constructor(private _userService: UserService,
    private _salesOrdersService: SalesOrdersService,
    private _deliveryService: DeliveryService,
    private _route: ActivatedRoute, private _router: Router,
    private _healthchekService: HealthchekService,
    private _reportService: ReportService) {
    this.orders = new Array<SalesOrder>();
    this.filteredOrders = new Array<SalesOrder>();
    this.selectedOrders = new Map<String, String>();
  }

  ngOnInit() {
    this.identity = this._userService.getItentity();
    if (this.identity === null) {
      this._router.navigate(['/']);
    }
    this.listOpenOrders();
  }

  private redirectIfSessionInvalid(error) {
    if (error && error.status && error.status === 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

  private listOpenOrders() {
    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });

    this.orders = new Array<SalesOrder>();
    this.filteredOrders = new Array<SalesOrder>();
    this.selectedOrders = new Map<String, any>();

    this._salesOrdersService.listOpenOrders(this.showApprovedOnly, this.filterGroup).subscribe(
      response => {
        this.orders = response;
        $('#modal_transfer_process').modal('hide');
        $('#filter').focus();
        //TODO: validar ordenes asignadas
        this.filterOrders(true);
      },
      error => {
        $('#modal_transfer_process').modal('hide');
        $('#filter').focus();
        console.error(error);
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public selectOrder(order: SalesOrder) {
    if (order.confirmed === 'N' || order.address.length === 0 || order.transp.length === 0) {
      return;
    }
    if (order.status === 'warning') {
      this.listAvailableStock(order.docNum);
      return;
    }
    if (this.selectedOrders.has(order.docNum)) {
      this.selectedOrders.delete(order.docNum);
    } else {
      this.selectedOrders.set(order.docNum, order.cardCode);
    }
  }

  public listAssignableEmployees() {
    this.assignableUsers = new Array<any>();
    this._userService.listUsersByGroup('WMS').subscribe(
      response => {
        this.assignableUsers = response;
        if (this.assignableUsers.length > 0) {
          $('#modal_users').modal('show');
        } else {
          console.error('No se encontraron empleados en el directorio activo para asignar la orden');
        }
      }, error => { console.error(error); this.redirectIfSessionInvalid(error); }
    );
  }

  public assignOrders() {
    if (!this.selectedUser) {
      //TODO: show error message
      console.error('debes seleccionar un empleado');
      return;
    }
    if (this.selectedOrders.size === 0) {
      //TODO: show error message
      console.error('debes seleccionar al menos una orden para asignar');
      return;
    }

    const assignment = {
      'assignedBy': this.identity.username,
      'employeeId': this.selectedUser,
      'orders': Array.from(this.selectedOrders.entries())//.map(Number)
    };

    this._salesOrdersService.assignOrders(assignment).subscribe(
      result => {
        $('#modal_users').modal('hide');
        this.listOpenOrders();
        this.selectedUser = '';
      }, error => {
        console.error(error);
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public resetAssignOrder() {
    let orders = Array.from(this.selectedOrders.entries());
    for (let i = 0; i < orders.length; i++) {
      this._salesOrdersService.deleteAssignOrders(orders[i][0]).subscribe(
        response => {
          $('#modal_users').modal('hide');
          this.listOpenOrders();
          this.selectedUser = '';
        },
        error => { console.error(error); }
      );
    }
  }

  public filterOrders(force) {
    if (this.filter.length > 0/*this.filter !== this.searchFilter || force*/) {
      this.searchFilter = this.filter.toLowerCase();
      this.filteredOrders = new Array<SalesOrder>();
      for (let i = 0; i < this.orders.length; i++) {
        const ord = this.orders[i];
        if (ord.docNum.toLowerCase().includes(this.searchFilter)
          || ord.cardCode.toLowerCase().includes(this.searchFilter)
          || ord.cardName.toLowerCase().includes(this.searchFilter)
          || (ord.assignedPickingEmployee && ord.assignedPickingEmployee.toLowerCase().includes(this.searchFilter))) {
          this.filteredOrders.push(ord);
        }
      }
    } else {
      this.filteredOrders = this.orders;
    }
  }

  public toggleEye() {
    this.showApprovedOnly = !this.showApprovedOnly;
    this.listOpenOrders();
    $('#filter').focus();
  }

  public filterGroupOrders() {
    this.filterGroup = !this.filterGroup;
    this.listOpenOrders();
    $('#filter').focus();
  }

  public listAvailableStock(orderNumber) {
    this.selectedOrder = orderNumber;
    this.loadingAvailableStock = true;
    this.allStockAvailable = true;
    this.availableStock = new Array<any>();
    $('#order_status').modal('show');
    this._salesOrdersService.listAvailableStock(orderNumber).subscribe(
      result => {
        this.loadingAvailableStock = false;
        for (let i = 0; i < result.content.length; i++) {
          if (result.content[i][6] < result.content[i][1]) {
            this.allStockAvailable = false;
            break;
          }
        }
        this.availableStock = result.content;
      },
      error => {
        this.loadingAvailableStock = false;
        console.error(error);
      }
    );
  }

  public enableOrder() {
    this._salesOrdersService.enableAssignation(this.selectedOrder).subscribe(
      result => {
        $('#order_status').modal('hide');
        this.listOpenOrders();
        this.selectedOrder = null;
      },
      error => { console.error(error); }
    );
  }

  public printerPick(isGroup) {
    this.processPrintLabelsStatus = 'inprogress';

    let printReportDTO = {
      "id": isGroup ? 0 : this.docEntryDelivery,
      "copias": 1,
      "documento": isGroup ? "pickingExpressGroup" : "pickingExpress",
      "companyName": this.identity.selectedCompany,
      "origen": "S",
      "filtro": isGroup ? this.orderNumber : null,
      "imprimir": true
    }

    this._reportService.generateReport(printReportDTO).subscribe(
      response => {
        if (response.code == 0) {
          this.processPrintLabelsStatus = 'done';
        } else {
          this.processPrintLabelsStatus = 'error';
        }
        $('#modal_transfer_process').modal('hide');
      },
      error => {
        this.processPrintLabelsStatus = 'error';
        console.error('Ocurrio un error al generar el doc de pickinExpress.', error);
        this.redirectIfSessionInvalid(error);
        $('#modal_transfer_process').modal('hide');
      }
    );
  }

  public getModalPickingExpress() {
    $('#confirmation_picking').modal('hide');
    this.processDeliveryStatus = 'inprogress';
    $('#process_picking_express').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });

    for (let i = 0; i < Array.from(this.selectedOrders.entries()).length; i++) {
      this.orderPickingExpress = Array.from(this.selectedOrders.entries())[i][0];
      break;
    }

    this._deliveryService.createPickingExpress(this.orderPickingExpress).subscribe(
      response => {
        if (response.code == 0) {
          this.docEntryDelivery = response.content;
          this.processDeliveryStatus = 'done';
        } else {
          this.processDeliveryStatus = 'error';
          this.deliveryErrorMessage = response.content;
        }
      },
      error => {
        console.error(error);
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public clearOrder() {
    this.filter = '';
    this.orderNumber = '';
    this.processDeliveryStatus = 'none';
    this.processPrintLabelsStatus = 'none';
    this.listOpenOrders();
  }

  public resetSesionId() {
    $('#process_status').modal('hide');
    this.deliveryErrorMessage = "";
    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });
    this._healthchekService.resetSessionId().subscribe(
      response => {
        $('#modal_transfer_process').modal('hide');
        this.getModalPickingExpress();
      },
      error => {
        $('#modal_transfer_process').modal('hide');
        console.error("Ocurrio un error al reiniciar los sesion Id", error);
        this.deliveryErrorMessage = "Ocurrio un error al reiniciar los sesion Id";
      }
    );
  }

  public getScrollTop() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }
}