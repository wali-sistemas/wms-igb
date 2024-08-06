import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { ProductionService } from '../../../services/production.service';
import { OrderProduction } from '../../../models/production/order-production';
import { OrderProductionDetail } from '../../../models/production/order-production-detail';
import { OrderProductionLabel } from '../../../models/production/order-production-label';
import { GLOBAL } from 'app/services/global';

declare var $: any;

@Component({
  selector: 'app-production-labels',
  templateUrl: './production-labels.component.html',
  styleUrls: ['./production-labels.component.css'],
  providers: [ProductionService, UserService]
})

export class ProductionLabelsComponent implements OnInit {
  public urlShared: string = GLOBAL.urlShared;
  public identity: any;
  public selectedCompany: string;
  public selectedOrder: any;
  public orders: OrderProduction[] = [];
  public ordersDetails: OrderProductionDetail[] = [];
  public filter: string = '';
  public filteredOrders: OrderProduction[] = [];
  public filterDetail: string = '';
  public filteredOrdersDetails: OrderProductionDetail[] = [];
  public changeOrderErrorMessage: string = null;
  public changeOrderMessage: string = null;

  constructor(private _router: Router, private _orderService: ProductionService, private _userService: UserService) { }

  ngOnInit() {
    const identity = this._userService.getItentity();
    if (identity) {
      this.selectedCompany = identity.selectedCompany;
    }
    this.listOrders();
  }

  private redirectIfSessionInvalid(error) {
    if (error && error.status && error.status == 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

  public listOrders() {
    this.changeOrderErrorMessage = '';
    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });
    this._orderService.getAllOrders(this.selectedCompany).subscribe(
      response => {
        response.content;
        this.orders = response.content;
        this.filteredOrders = this.orders;
        $('#modal_transfer_process').modal('hide');
      }, error => {
        $('#modal_transfer_process').modal('hide');
        this.changeOrderErrorMessage = 'Ha ocurrido un error de conexión.';
        console.error(error);
      }
    );
  }

  public getOrdersDetail(docNum) {
    $('#orderModal').modal('show');
    this._orderService.getOrderDetails(this.selectedCompany, docNum).subscribe(
      response => {
        this.ordersDetails = response.content
        this.filteredOrdersDetails = this.ordersDetails;
      }, error => {
        this.changeOrderErrorMessage = 'Ha ocurrido un error de conexión.';
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public sendLabel(orderDetail: OrderProductionDetail) {
    const quantityAsString: string = orderDetail.quantity.toString();
    const currentDate = new Date().toLocaleDateString('en-GB');
    //TODO: Solo nit de redplas se si da check en campo logo
    const nitValue = orderDetail.checked ? "C900690999" : orderDetail.cardCode;
    const objetToPrint: OrderProductionLabel = {
      "sku": orderDetail.article,
      "quantity": quantityAsString,
      "description": orderDetail.description,
      "nit": nitValue,
      "date": currentDate
    };
    this._orderService.printerLabel(objetToPrint).subscribe(response => {
      this.changeOrderMessage = 'Etiqueta impresa correctamente.';
    }, error => {
      this.redirectIfSessionInvalid(error);
    });
  }

  public selectOrder(order: any) {
    this.selectedOrder = order;
    this.getOrdersDetail(order.docNum);
    $('#orderModal').modal('show');
  }

  public openImage(articulo: string) {
    const url = this.urlShared + "images/mtz/" + articulo + ".jpg";
    window.open(url, '_blank');
  }

  public filterOrders() {
    const filterValue = this.filter.toLowerCase();
    this.filteredOrders = this.orders.filter(order =>
      order.cardCode.toLowerCase().includes(filterValue) ||
      order.cardName.toLowerCase().includes(filterValue)
    );
  }

  public filterOrdersDetail() {
    const filterValue = this.filterDetail.toLowerCase();
    this.filteredOrdersDetails = this.ordersDetails.filter(orderDetail =>
      orderDetail.article.toLowerCase().includes(filterValue) ||
      orderDetail.description.toLowerCase().includes(filterValue)
    );
  }

  public getScrollTop(): void {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }
}
