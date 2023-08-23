import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SalesOrdersService } from '../../../services/sales-orders.service';
import { AuthorizedOrder } from '../../../models/authorized-order';
import { Observable } from 'rxjs';

declare var $: any;

@Component({
  templateUrl: './authorized.component.html',
  styleUrls: ['./authorized.component.css'],
  providers: [SalesOrdersService]
})
export class AuthorizedComponent implements OnInit {
  public filter: string = '';
  public searchOrder: string;
  public sales: Array<AuthorizedOrder>;
  public filteredOrders: Array<AuthorizedOrder>;
  public changeOrderErrorMessage: string = null;
  public changeOrderMessage: string = null;
  public region: string;
  public regions: Array<string>;
  public filteredRegions: Array<string>;
  public condition: string;
  public conditions: Array<string>;
  public filteredConditions: Array<string>;
  public stade: string;
  public stades: Array<string>;
  public filteredStades: Array<string>;
  public selects: string[] = [];
  public groupedData: { client: AuthorizedOrder, orders: AuthorizedOrder[] }[] = [];
  public selectedGroup: { client: AuthorizedOrder, orders: AuthorizedOrder[] } = null;
  public selectedDocNumSAPs: number[] = [];

  constructor(private _SalesOrdersService: SalesOrdersService, private _router: Router) {
  }

  ngOnInit() {
    this.listOrdersAuthorized();
  }

  public showOrderNumbers(group: { client: AuthorizedOrder, orders: AuthorizedOrder[] }): void {
    this.selectedGroup = group;
    $('#ver_Docs').modal('show');
  }

  public listOrdersAuthorized() {
    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });
    this._SalesOrdersService.listOrdersAuthorized().subscribe(
      response => {
        this.sales = response.content;
        this.filteredOrders = response.content;
        this.regions = this.sales.map((item, i) => { return item.region }); this.filteredRegions = Array.from(new Set(this.regions));
        this.conditions = this.sales.map((item, i) => { return item.payCond }); this.filteredConditions = Array.from(new Set(this.conditions));
        this.stades = this.sales.map((item, i) => { return item.status }); this.filteredStades = Array.from(new Set(this.stades));
        this.groupedData = [];
        this.filteredOrders.forEach(order => {
          const existingGroup = this.groupedData.find(group => group.client.cardName === order.cardName);

          if (existingGroup) {
            existingGroup.orders.push(order);
          } else {
            this.groupedData.push({ client: order, orders: [order] });
          }
        });
        $('#modal_transfer_process').modal('hide');
      },
      error => {
        $('#modal_transfer_process').modal('hide');
        console.error(error);
        this.redirectIfSessionInvalid(error);
      }
    );
    this.clear();
  }

  private redirectIfSessionInvalid(error): void {
    if (error && error.status && error.status == 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

  public getTotalOrderValue(orders: AuthorizedOrder[]): number {
    return orders.reduce((total, order) => total + order.docTotal, 0);
  }

  public updateOrder(action: string): void {
    let updateMethod: Observable<any>;
    let successMessage: string;

    switch (action) {
      case 'approved':
        updateMethod = this._SalesOrdersService.updateOrders('APROBADO', this.selects);
        successMessage = 'Ordenes autorizadas exitosamente.';
        break;
      case 'prepaid':
        updateMethod = this._SalesOrdersService.updateOrders('PREPAGO', this.selects);
        successMessage = 'Ordenes actualizadas a prepago exitosamente.';
        break;
      case 'collect':
        updateMethod = this._SalesOrdersService.updateOrders('CARTERA', this.selects);
        successMessage = 'Ordenes actualizadas a cartera exitosamente.';
        break;
      default:
        return;
    }

    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });

    updateMethod.subscribe(
      response => {
        $('#modal_transfer_process').modal('hide');
        this.listOrdersAuthorized();
        this.changeOrderMessage = response.code === 0 ? successMessage : response.content;
      },
      error => {
        $('#modal_transfer_process').modal('hide');
        this.changeOrderErrorMessage = 'Ha ocurrido un error de conexión';
        this.redirectIfSessionInvalid(error);
        this.clear();
      }
    );
  }

  public filterOrders() {
    this.searchOrder = this.filter.toLowerCase();
    if (this.filter.length > 0) {
      const filteredData: { client: AuthorizedOrder, orders: AuthorizedOrder[] }[] = [];
      this.groupedData.forEach(group => {
        const matchingOrders = group.orders.filter(order =>
          order.cardName.toLowerCase().includes(this.searchOrder)
          || order.cardCode.toLowerCase().includes(this.searchOrder)
          || order.region.includes(this.searchOrder)
        );
        if (matchingOrders.length > 0
          || group.client.cardName.toLowerCase().includes(this.searchOrder)
          || group.client.cardCode.toLowerCase().includes(this.searchOrder)
          || group.client.region.includes(this.searchOrder)
        ) {
          filteredData.push({ client: group.client, orders: matchingOrders });
        }
      });
      this.groupedData = filteredData;
    } else {
      this.groupData();
    }
  }

  public applyFilters(): void {
    this.filteredOrders = this.sales.filter(order =>
      (!this.region || order.region === this.region) &&
      (!this.condition || order.payCond === this.condition) &&
      (!this.stade || order.status === this.stade)
    );
    this.groupData();
  }

  public groupData(): void {
    this.groupedData = [];
    this.filteredOrders.forEach(order => {
      const existingGroup = this.groupedData.find(group => group.client.cardName === order.cardName);

      if (existingGroup) {
        existingGroup.orders.push(order);
      } else {
        this.groupedData.push({ client: order, orders: [order] });
      }
    });
  }

  public handleCheckedForAction(group: { client: AuthorizedOrder, orders: AuthorizedOrder[] }, modalId: string): void {
    for (const order of group.orders) {
      if (!this.selects.includes(order.docNumSAP)) {
        this.selects.push(order.docNumSAP);
      }
      $(modalId).modal('show');
    }
  }

  public handleCheckedForAutorized(group: { client: AuthorizedOrder, orders: AuthorizedOrder[] }): void {
    this.handleCheckedForAction(group, '#confirmed_Modal');
  }

  public handleCheckedForNotAutorized(group: { client: AuthorizedOrder, orders: AuthorizedOrder[] }): void {
    this.handleCheckedForAction(group, '#change_Modal_Credit');
  }

  public handleCheckedForCounted(group: { client: AuthorizedOrder, orders: AuthorizedOrder[] }): void {
    this.handleCheckedForAction(group, '#change_Modal_Counted');
  }

  public getScrollTop(): void {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }

  public clear() {
    this.filter = '';
    this.region = '';
    this.stade = '';
    this.condition = '';
    this.changeOrderMessage = '';
    $('#filter').focus();
    this.selects = new Array<string>();
  }
}
