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
  templateUrl: './orders-modula.component.html',
  styleUrls: ['./orders-modula.component.css'],
  providers: [UserService, SalesOrdersService, DeliveryService, HealthchekService, ReportService, ModulaService]
})
export class OrdersModulaComponent implements OnInit {
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
  public docEntryDelivery: number;
  public orderPickingExpressMDL: string = '';
  public salesOrderMessage: string = '';
  public deliveryErrorMessage: string = '';
  public pickExpressErrorMessage: string = '';
  public multiPickingErrorMessage: string = '';
  public orderNumber: string = '';

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
  }

  private redirectIfSessionInvalid(error) {
    if (error && error.status && error.status === 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

  private listOpenOrders() {
    this.salesOrderMessage = '';
    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });

    this.orders = new Array<SalesOrder>();
    this.filteredOrders = new Array<SalesOrder>();
    this.selectedOrders = new Map<string, string>();

    this._salesOrdersService.listOpenOrdersModula(this.showApprovedOnly, this.filterGroup).subscribe(
      response => {
        if (response.length <= 0) {
          this.salesOrderMessage = 'No se encontraron ordenes pendientes.';
        } else {
          this.orders = response;
        }
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
      this.selectedOrders.set(order.docNum, order.docNumMDL.length === 0 ? "" + order.cardCode : order.cardCode + "-" + order.docNumMDL);
    }
  }

  public filterOrders(force) {
    if (this.filter.length > 0) {
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
      response => {
        $('#order_status').modal('hide');
        this.listOpenOrders();
        this.selectedOrder = null;
      },
      error => { console.error(error); }
    );
  }

  public getModalPickingExpress() {
    this.pickExpressErrorMessage = '';
    this.orderPickingExpressMDL = '';

    $('#confirmation_picking').modal('hide');
    this.processDeliveryStatus = 'inprogress';
    $('#process_picking_express').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });

    for (let i = 0; i < Array.from(this.selectedOrders.entries()).length; i++) {
      this.orderPickingExpressMDL = Array.from(this.selectedOrders.entries())[i][0];
      //Validar si la orden de modula esta aprobada y autorizada por el area administrativa.
      if (this.orderPickingExpressMDL != null) {
        this._salesOrdersService.validateOrderAuthorized(this.orderPickingExpressMDL).subscribe(
          response => {
            if (!response) {
              $('#process_picking_express').modal('hide');
              this.getScrollTop();
              this.selectedOrders.delete(this.orderPickingExpressMDL);
              this.pickExpressErrorMessage = "La orden " + this.orderPickingExpressMDL + " no esta autorizada o aprobada por comercial.";
            } else {
              //Validar si la orden ya esta completada en el wms Modula.
              this._modulaService.getValidateOrderCompleted(this.orderPickingExpressMDL).subscribe(
                response => {
                  if (!response) {
                    $('#process_picking_express').modal('hide');
                    this.getScrollTop();
                    this.selectedOrders.delete(this.orderPickingExpressMDL);
                    this.pickExpressErrorMessage = "La orden " + this.orderPickingExpressMDL + " no esta completada en wms-modula.";
                  } else {
                    this.addPickingExpress();
                  }
                }, error => {
                  $('#process_picking_express').modal('hide');
                  this.getScrollTop();
                  this.selectedOrders.delete(this.orderPickingExpressMDL);
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
    this._deliveryService.createDeliveryModula(this.orderPickingExpressMDL).subscribe(
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
    this.pickExpressErrorMessage = '';
    this.searchFilter = '';
    this.showApprovedOnly = true;
    this.filterGroup = false;
    this.selectedUser = '';
    this.allStockAvailable = true;
    this.loadingAvailableStock = false;
    this.selectedOrder = 0;
    this.docEntryDelivery = 0;
    this.orderPickingExpressMDL = '';
    this.deliveryErrorMessage = '';
    this.multiPickingErrorMessage = '';
    this.orderNumber = '';
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