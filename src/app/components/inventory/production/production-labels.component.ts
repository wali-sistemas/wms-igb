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
  public selectedCompany: string = '';
  public selectedOrder: any;
  public orders: OrderProduction[] = [];
  public ordersDetails: OrderProductionDetail[] = [];
  public filter: string = '';
  public filteredOrders: OrderProduction[] = [];
  public filterDetail: string = '';
  public filteredOrdersDetails: OrderProductionDetail[] = [];
  public changeOrderErrorMessage: string = '';
  public changeOrderMessage: string = '';
  public printingAllLabels: boolean = false;

  constructor(private _router: Router, private _orderService: ProductionService, private _userService: UserService) { }

  ngOnInit() {
    const identity = this._userService.getItentity();
    if (identity) {
      this.selectedCompany = identity.selectedCompany;
    }
    this.listOrders();
  }

  private redirectIfSessionInvalid(error: any) {
    if (error && error.status && error.status == 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

  private isEmptyJsonSuccess(error: any): boolean {
    return error && error.message && error.message.indexOf('Unexpected end of JSON input') !== -1;
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
        this.orders = response.content;
        this.filteredOrders = this.orders;
        $('#modal_transfer_process').modal('hide');
      },
      error => {
        $('#modal_transfer_process').modal('hide');
        this.changeOrderErrorMessage = 'Ha ocurrido un error de conexión.';
        console.error(error);
      }
    );
  }

  public getOrdersDetail(docNum: any) {
    this.filterDetail = '';
    this.ordersDetails = [];
    this.filteredOrdersDetails = [];

    $('#orderModal').modal('show');

    this._orderService.getOrderDetails(this.selectedCompany, docNum).subscribe(
      response => {
        this.ordersDetails = response.content || [];
        this.ordersDetails.forEach(orderDetail => {
          orderDetail.quantity = this.normalizeQuantity(orderDetail.quantity);
          orderDetail.unitPackaging = this.normalizeQuantity(orderDetail.unitPackaging);
          (orderDetail as any).selectedToPrint = false;
        });
        this.filteredOrdersDetails = this.ordersDetails;
      },
      error => {
        this.changeOrderErrorMessage = 'Ha ocurrido un error de conexión.';
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  private normalizeQuantity(value: any): any {
    if (value === null || value === undefined || value === '') {
      return value;
    }

    const numericValue = Number(value);

    if (isNaN(numericValue)) {
      return value;
    }

    return numericValue % 1 === 0 ? parseInt(numericValue.toString(), 10) : numericValue;
  }

  public formatNumber(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const numericValue = Number(value);

    if (isNaN(numericValue)) {
      return value.toString();
    }

    return numericValue % 1 === 0 ? numericValue.toFixed(0) : numericValue.toString();
  }

  private buildLabelObject(orderDetail: OrderProductionDetail): OrderProductionLabel {
    const quantityAsString: string = this.formatNumber(orderDetail.quantity);
    const currentDate = new Date().toLocaleDateString('en-GB');
    const nitValue = orderDetail.checked ? 'C900690999' : orderDetail.cardCode;

    const objetToPrint: OrderProductionLabel = {
      sku: orderDetail.article,
      quantity: quantityAsString,
      description: orderDetail.description,
      nit: nitValue,
      date: currentDate
    };

    return objetToPrint;
  }

  public sendLabel(orderDetail: OrderProductionDetail) {
    this.changeOrderMessage = '';
    this.changeOrderErrorMessage = '';

    const objetToPrint: OrderProductionLabel = this.buildLabelObject(orderDetail);

    this._orderService.printerLabel(objetToPrint).subscribe(
      response => {
        this.changeOrderMessage = 'Etiqueta impresa correctamente.';
      },
      error => {
        if (this.isEmptyJsonSuccess(error)) {
          this.changeOrderMessage = 'Etiqueta impresa correctamente.';
          return;
        }

        this.changeOrderErrorMessage = 'No fue posible imprimir la etiqueta.';
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public hasSelectedDetails(): boolean {
    return this.ordersDetails && this.ordersDetails.some(orderDetail => (orderDetail as any).selectedToPrint);
  }

  public selectAllDetails() {
    if (!this.filteredOrdersDetails || this.filteredOrdersDetails.length === 0) {
      return;
    }

    this.filteredOrdersDetails.forEach(orderDetail => {
      (orderDetail as any).selectedToPrint = true;
    });
  }

  public unselectAllDetails() {
    if (!this.filteredOrdersDetails || this.filteredOrdersDetails.length === 0) {
      return;
    }

    this.filteredOrdersDetails.forEach(orderDetail => {
      (orderDetail as any).selectedToPrint = false;
    });
  }

  public sendSelectedLabels() {
    const selectedDetails = this.ordersDetails
      ? this.ordersDetails.filter(orderDetail => (orderDetail as any).selectedToPrint)
      : [];

    if (!selectedDetails || selectedDetails.length === 0) {
      this.changeOrderErrorMessage = 'Debes seleccionar al menos una referencia para imprimir.';
      return;
    }

    this.printingAllLabels = true;
    this.changeOrderMessage = '';
    this.changeOrderErrorMessage = '';

    let printed = 0;
    let errors = 0;
    const total = selectedDetails.length;

    selectedDetails.forEach(orderDetail => {
      const objetToPrint: OrderProductionLabel = this.buildLabelObject(orderDetail);

      this._orderService.printerLabel(objetToPrint).subscribe(
        response => {
          printed++;
          this.validateFinishPrintAll(printed, errors, total);
        },
        error => {
          if (this.isEmptyJsonSuccess(error)) {
            printed++;
          } else {
            errors++;
            this.redirectIfSessionInvalid(error);
          }

          this.validateFinishPrintAll(printed, errors, total);
        }
      );
    });
  }

  private validateFinishPrintAll(printed: number, errors: number, total: number) {
    if ((printed + errors) === total) {
      this.printingAllLabels = false;

      if (errors === 0) {
        this.changeOrderMessage = 'Las etiquetas seleccionadas fueron enviadas a impresión correctamente.';
      } else {
        this.changeOrderErrorMessage = 'Se imprimieron ' + printed + ' etiqueta(s), pero fallaron ' + errors + '.';
      }
    }
  }

  public selectOrder(order: any) {
    this.selectedOrder = order;
    this.getOrdersDetail(order.docNum);
  }

  public openImage(articulo: string) {
    const url = this.urlShared + 'images/mtz/' + articulo + '.jpg';
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
