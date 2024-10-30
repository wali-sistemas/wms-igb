import { Component, OnInit } from '@angular/core';
import { GLOBAL } from '../../../services/global';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { SalesOrdersService } from '../../../services/sales-orders.service';
import { DeliveryService } from '../../../services/delivery.service';
import { SalesOrder, SalesOrderLine } from '../../../models/sales-order';
import { HealthchekService } from '../../../services/healthchek.service';
import { ReportService } from '../../../services/report.service';
import { GenericService } from '../../../services/generic';
import { InvoiceService } from '../../../services/invoice.service';

declare var $: any;

@Component({
  templateUrl: './orders-magnum.component.html',
  styleUrls: ['./orders-magnum.component.css'],
  providers: [UserService, SalesOrdersService, DeliveryService, HealthchekService, ReportService, GenericService, InvoiceService]
})
export class OrdersMagnumComponent implements OnInit {
  public urlShared: string = GLOBAL.urlShared;
  public identity;
  public token;
  public orders: Array<SalesOrder>;
  public filteredOrders: Array<SalesOrder>;
  public selectedOrders: Map<string, string>;
  public pickingExpressModuleAccesible: boolean = false;
  public salesOrderMessage: string = '';
  public pickExpressErrorMessage: string = '';
  public filter: string = '';
  public searchFilter: string;
  public processDeliveryStatus: string = 'none';
  public processInvoiceStatus: string = 'none';
  public docEntryDelivery: number;
  public docEntryInvoice: number;
  public deliveryErrorMessage: string = '';
  public order: string;
  public transport: string;
  public whsName: string;
  public whsCode: string;
  public transports: Array<any>;
  public selectedTransp: string = '';
  public selectedStatusOrder: string = '';
  public subTotal: number;
  public address: string = '';
  public comments: string = '';
  public valorDeclPack: number;
  public pesoPack: number;
  public flete: number;
  public lio: number;
  public validTransp: boolean = true;
  public validLio: boolean = true;
  public validStatusOrder: boolean = true;
  public validFlete: boolean = true;
  public invoiceErrorMessage: string = '';
  public qtyUnd: number;

  constructor(private _userService: UserService, private _salesOrdersService: SalesOrdersService, private _deliveryService: DeliveryService, private _route: ActivatedRoute, private _router: Router, private _healthchekService: HealthchekService, private _genericService: GenericService, private _invoiceService: InvoiceService) {
    this.orders = new Array<SalesOrder>();
    this.filteredOrders = new Array<SalesOrder>();
    this.selectedOrders = new Map<string, string>();
    this.transports = new Array<any>();
  }

  ngOnInit() {
    this.identity = this._userService.getItentity();
    if (this.identity === null) {
      this._router.navigate(['/']);
    }
    this.listTransport();
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

  public listTransport() {
    this._genericService.listActivesTransp().subscribe(
      response => {
        this.transports = response;
      },
      error => {
        console.error('Ocurrio un error listando las transportadoras.', error);
        this.redirectIfSessionInvalid(error);
      }
    );
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

    this._salesOrdersService.listOpenOrdersMagnum().subscribe(
      response => {
        if (response.length <= 0) {
          this.salesOrderMessage = 'No se encontraron ordenes pendientes.';
        } else {
          this.orders = response;
        }
        $('#modal_transfer_process').modal('hide');
        $('#filter').focus();
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

  public calculateVrlDeclarad(order) {
    this.invoiceErrorMessage = '';
    if (this.lio === 0) {
      this.invoiceErrorMessage = 'Lios debe ser mayor a 0.';
      return;
    }

    for (let i = 0; i < this.orders.length; i++) {
      const ord = this.orders[i];
      if (ord.docNum == order) {
        this.pesoPack = (ord.undEmpStand * this.lio);
        this.valorDeclPack = (ord.vlrDeclarStand * this.lio);
        break;
      }
    }
  }

  public selectOrder(order: SalesOrder) {
    this.pickExpressErrorMessage = '';
    if (order.address.length === 0 || order.transp.length === 0) {
      return;
    }

    this.order = order.docNum;
    this.transport = order.transp;
    this.whsName = order.whsCode == '26' ? 'CARTAGENA' : 'CALI';
    this.whsCode = order.whsCode;
    this.subTotal = order.subTotal;
    this.address = order.address;
    this.comments = order.comments;
    this.selectedTransp = order.transp;
    this.qtyUnd = order.qty;
    if (this.qtyUnd <= 6) {
      this.lio = 1;
    } else {
      this.lio = Math.round(order.qty / 6);
    }
    this.flete = Math.round(order.subTotal * (order.porcFlet / 100));

    //Calculando peso y valor declarado
    for (let i = 0; i < this.orders.length; i++) {
      const ord = this.orders[i];
      if (ord.docNum == order.docNum) {
        this.pesoPack = (ord.undEmpStand * this.lio);
        this.valorDeclPack = (ord.vlrDeclarStand * this.lio);
        break;
      }
    }

    $('#modal_add_invoice').modal('show');
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
          || (ord.assignedPickingEmployee && ord.assignedPickingEmployee.toLowerCase().includes(this.searchFilter))
          || ord.address.toLocaleLowerCase().includes(this.searchFilter)) {
          this.filteredOrders.push(ord);
        }
      }
    } else {
      this.filteredOrders = this.orders;
    }
  }

  public getModalInvoiceExpress() {
    this.pickExpressErrorMessage = '';
    $('#confirmation_document').modal('hide');

    this.processDeliveryStatus = 'inprogress';
    this.processInvoiceStatus = 'none';

    $('#process_invoice_express').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });

    this._salesOrdersService.validateOrderAuthorized(this.order).subscribe(
      response => {
        if (!response) {
          $('#process_invoice_express').modal('hide');
          this.getScrollTop();
          this.selectedOrders.delete(this.order);
          this.pickExpressErrorMessage = "La orden " + this.order + " no esta autorizada o aprobada por comercial.";
        } else {
          this.addPickingExpress();
        }
      }, error => {
        $('#process_invoice_express').modal('hide');
        this.getScrollTop();
        this.pickExpressErrorMessage = "Lo sentimos. Se produjo un error interno.";
        console.error(error);
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public createInvoice() {
    this.deliveryErrorMessage = "";
    this.processInvoiceStatus = 'inprogress';

    this._invoiceService.createInvoice(this.docEntryDelivery).subscribe(
      response => {
        if (response.code == 0) {
          this.processInvoiceStatus = 'done';
          this.docEntryInvoice = response.content;
        } else {
          this.processInvoiceStatus = 'error';
          this.deliveryErrorMessage = response.content + ". Inténtelo creandola desde SAP.";
        }
      },
      error => {
        this.processInvoiceStatus = 'error';
        this.deliveryErrorMessage = "Error creando factura por favor inténtelo mas tarde.";
        console.error("Ocurrio un error al crear la factura.", error);
      }
    );
  }

  public validateParamenter() {
    this.invoiceErrorMessage = '';

    if (this.selectedTransp == null || this.selectedTransp.length <= 0) {
      !this.validTransp;
      return;
    }
    if (this.lio == null || this.lio.toString().length <= 0) {
      this.validLio = false;
      return;
    }
    if (this.selectedStatusOrder == null || this.selectedStatusOrder.length <= 0) {
      this.validStatusOrder = false;
      return;
    }
    if (this.flete == null || this.flete.toString().length <= 0) {
      this.validFlete = false;
      return;
    }
    if (this.lio <= 0) {
      this.invoiceErrorMessage = 'Lios debe ser mayor a 0.';
      return;
    }

    $('#modal_add_invoice').modal('hide');

    $('#confirmation_document').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });
  }

  private addPickingExpress() {
    let deliveryNoteMagnumDTO = {
      "docNum": this.order,
      "whsCode": this.whsCode,
      "transport": this.selectedTransp,
      "lioQty": this.lio,
      "pesoQty": this.pesoPack,
      "vrlDeclarad": this.valorDeclPack,
      "statusOrder": this.selectedStatusOrder,
      "vlrFlete": this.flete
    }

    this._deliveryService.createDeliveryMagnum(deliveryNoteMagnumDTO).subscribe(
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
    this.searchFilter = '';
    this.docEntryDelivery = 0;
    this.deliveryErrorMessage = '';
    this.transport = '';
    this.lio = 0;
    this.pesoPack = 0;
    this.valorDeclPack = 0;
    this.selectedStatusOrder = '';
    this.flete = 0;
    this.filter = '';
    this.processDeliveryStatus = 'none';
    this.pickExpressErrorMessage = '';
    this.invoiceErrorMessage = '';
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
        this.getModalInvoiceExpress();
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
