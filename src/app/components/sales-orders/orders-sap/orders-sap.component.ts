import { Component, OnInit } from '@angular/core';
import { GLOBAL } from '../../../services/global';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { SalesOrdersService } from '../../../services/sales-orders.service';
import { DeliveryService } from '../../../services/delivery.service';
import { SalesOrder, SalesOrderLine } from '../../../models/sales-order';
import { HealthchekService } from '../../../services/healthchek.service';
import { ReportService } from '../../../services/report.service';
import { ModulaService } from '../../../services/modula.service';

declare var $: any;

@Component({
  templateUrl: './orders-sap.component.html',
  styleUrls: ['./orders-sap.component.css'],
  providers: [UserService, SalesOrdersService, DeliveryService, HealthchekService, ReportService, ModulaService]
})
export class OrdersSapComponent implements OnInit {
  public urlShared: string = GLOBAL.urlShared;
  public identity;
  public token;
  public orders: Array<SalesOrder>;
  public filteredOrders: Array<SalesOrder>;
  public filter: string = '';
  public searchFilter: string;
  public showApprovedOnly: boolean = true;
  public filterGroup: boolean = false;
  public selectedOrders: Map<string, string>;
  public assignableUsers: Array<any>;
  public availableStock: Array<any>;
  public selectedUser: string = '';
  public allStockAvailable: boolean = true;
  public loadingAvailableStock: boolean = false;
  public pickingExpressModuleAccesible: boolean = false;
  public selectedOrder: number;
  public processDeliveryStatus: string = 'none';
  public processPrintLabelsStatus: string = 'none';
  public processPrintDeliveryStatus: string = 'none';
  public docNumDelivery: number;
  public orderPickingExpress: string = '';
  public orderPickingExpressMDL: string = '';
  public deliveryErrorMessage: string = '';
  public pickExpressErrorMessage: string = '';
  public multiPickingErrorMessage: string = '';
  public selectedCompany: string;

  constructor(private _userService: UserService,
    private _salesOrdersService: SalesOrdersService,
    private _deliveryService: DeliveryService,
    private _route: ActivatedRoute, private _router: Router,
    private _healthchekService: HealthchekService,
    private _reportService: ReportService,
    private _modulaService: ModulaService) {
    this.orders = new Array<SalesOrder>();
    this.filteredOrders = new Array<SalesOrder>();
    this.selectedOrders = new Map<string, string>();
  }

  ngOnInit() {
    this.identity = this._userService.getItentity();
    if (this.identity === null) {
      this._router.navigate(['/']);
    }
    this.listOpenOrders();
    this.pickingExpressModuleAccesible = JSON.parse(localStorage.getItem('igb.user.access')).pickingExpressModuleAccesible;
    this.selectedCompany = this.identity.selectedCompany;
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
    this.selectedOrders = new Map<string, string>();
    this.assignableUsers = new Array<any>();
    this.availableStock = new Array<any>();

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
    this.pickExpressErrorMessage = '';
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
      this.selectedOrders.set(order.docNum, order.docNumMDL.length == 0 ? "" + order.cardCode : order.cardCode + "-" + order.docNumMDL);
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
      }, error => {
        console.error(error);
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public assignOrders() {
    if (!this.selectedUser) {
      console.error('debes seleccionar un empleado');
      return;
    }
    if (this.selectedOrders.size === 0) {
      console.error('debes seleccionar al menos una orden para asignar');
      return;
    }

    const assignment = {
      'assignedBy': this.identity.username,
      'employeeId': this.selectedUser,
      'orders': Array.from(this.selectedOrders.entries())
    };

    this._salesOrdersService.assignOrders(assignment).subscribe(
      response => {
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
        error => {
          console.error(error);
          this.redirectIfSessionInvalid(error);
        }
      );
    }
  }

  public filterOrders(force) {
    if (this.filter.length > 0) {
      this.searchFilter = this.filter.toLowerCase();
      this.filteredOrders = new Array<SalesOrder>();
      for (let i = 0; i < this.orders.length; i++) {
        const ord = this.orders[i];
        if (ord.docNum.toLowerCase().includes(this.searchFilter)
          || ord.docNumMDL.toLowerCase().includes(this.searchFilter)
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
      response => {
        this.loadingAvailableStock = false;
        for (let i = 0; i < response.content.length; i++) {
          if (response.content[i][6] < response.content[i][1]) {
            this.allStockAvailable = false;
            break;
          }
        }
        this.availableStock = response.content;
      },
      error => {
        this.loadingAvailableStock = false;
        console.error(error);
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public enableOrder() {
    this._salesOrdersService.enableAssignation(this.selectedOrder).subscribe(
      response => {
        $('#order_status').modal('hide');
        this.listOpenOrders();
        this.selectedOrder = null;
      },
      error => {
        console.error(error);
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public printPickingExpressDocument(isGroup: boolean) {
    this.multiPickingErrorMessage = '';
    this.processPrintLabelsStatus = 'inprogress';

    let printReportDTO = {
      "id": isGroup ? 0 : this.docNumDelivery,
      "copias": 1,
      "documento": isGroup ? "pickingExpressGroup" : "pickingExpress",
      "companyName": this.identity.selectedCompany,
      "origen": "S",
      "filtro": isGroup ? this.docNumDelivery : null,
      "imprimir": true
    }

    this._reportService.generateReport(printReportDTO).subscribe(
      response => {
        if (response.code == 0) {
          this.processPrintLabelsStatus = 'done';
        } else if (response.code == -2) {
          this.multiPickingErrorMessage = response.content;
          this.processPrintLabelsStatus = 'error';
        } else {
          this.processPrintLabelsStatus = 'error';
        }
        this.printDeliveryDocument(this.docNumDelivery);
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

  public printDeliveryDocument(docNum: number) {
    this.processPrintDeliveryStatus = 'inprogress';
    let printReportDTO = {
      "id": docNum,
      "copias": 0,
      "documento": "delivery",
      "companyName": this.identity.selectedCompany,
      "origen": "S",
      "imprimir": true,
      "filtro": "Entrega"
    }
    this._reportService.generateReport(printReportDTO).subscribe(
      response => {
        if (response.code == 0) {
          this.processPrintDeliveryStatus = 'done';
        } else if (response.code == -2) {
          this.multiPickingErrorMessage = response.content;
          this.processPrintDeliveryStatus = 'error';
        } else {
          this.processPrintDeliveryStatus = 'error';
        }
        $('#modal_transfer_process').modal('hide');
      },
      error => {
        console.error('Ocurrio un error al guardar el documento de entrega.', error);
        $('#modal_transfer_process').modal('hide');
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public getModalPickingExpress() {
    this.pickExpressErrorMessage = '';
    this.orderPickingExpress = '';
    this.orderPickingExpressMDL = '';

    $('#confirmation_picking').modal('hide');
    this.processDeliveryStatus = 'inprogress';
    $('#process_picking_express').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });

    for (let i = 0; i < Array.from(this.selectedOrders.entries()).length; i++) {
      this.orderPickingExpress = Array.from(this.selectedOrders.entries())[i][0];
      if (Array.from(this.selectedOrders.entries())[0][1].includes("-")) {
        this.orderPickingExpressMDL = Array.from(this.selectedOrders.entries())[0][1].slice(-6);
      }
      //Validar si la orden de modula esta aprobada y autorizada por el area administrativa.
      if (this.orderPickingExpressMDL.length > 0) {
        this._salesOrdersService.validateOrderAuthorized(this.orderPickingExpressMDL).subscribe(
          response => {
            if (!response) {
              $('#process_picking_express').modal('hide');
              this.getScrollTop();
              this.selectedOrders.delete(this.orderPickingExpress);
              this.pickExpressErrorMessage = "La orden " + this.orderPickingExpressMDL + " no esta autorizada o aprobada por comercial.";
            } else {
              //Validar si la orden ya esta completada en el wms Modula.
              this._modulaService.getValidateOrderCompleted(this.orderPickingExpressMDL).subscribe(
                response => {
                  if (!response) {
                    $('#process_picking_express').modal('hide');
                    this.getScrollTop();
                    this.selectedOrders.delete(this.orderPickingExpress);
                    this.pickExpressErrorMessage = "La orden " + this.orderPickingExpressMDL + " no esta completada en wms-modula.";
                  } else {
                    this.addPickingExpress();
                  }
                }, error => {
                  $('#process_picking_express').modal('hide');
                  this.getScrollTop();
                  this.selectedOrders.delete(this.orderPickingExpress);
                  this.pickExpressErrorMessage = "Lo sentimos. Se produjo un error interno en wms-modula";
                  console.error(error);
                }
              );
            }
          }, error => {
            $('#process_picking_express').modal('hide');
            this.getScrollTop();
            this.pickExpressErrorMessage = "Lo sentimos. Se produjo un error interno.";
            console.error(error);
            this.redirectIfSessionInvalid(error);
          }
        );
      } else {
        this.addPickingExpress();
      }
      break;
    }
  }

  private addPickingExpress() {
    const pickingExpressOrderDTO = {
      "orderSAP": this.orderPickingExpress,
      "orderMDL": this.orderPickingExpressMDL
    }

    this._deliveryService.createPickingExpress(pickingExpressOrderDTO).subscribe(
      response => {
        if (response.code == 0) {
          this.docNumDelivery = response.content;
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
    this.processDeliveryStatus = 'none';
    this.processPrintLabelsStatus = 'none';
    this.pickExpressErrorMessage = '';
    this.searchFilter = '';
    this.showApprovedOnly = true;
    this.filterGroup = false;
    this.selectedUser = '';
    this.allStockAvailable = true;
    this.loadingAvailableStock = false;
    this.selectedOrder = 0;
    this.docNumDelivery = 0;
    this.orderPickingExpress = '';
    this.orderPickingExpressMDL = '';
    this.deliveryErrorMessage = '';
    this.multiPickingErrorMessage = '';
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
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public getScrollTop() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }
}
