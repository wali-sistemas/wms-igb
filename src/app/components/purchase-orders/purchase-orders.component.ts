import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../services/user.service';
import { PurchaseOrdersService } from '../../services/purchase-orders.service';
import { PurchaseOrder } from '../../models/purchase-order';

declare var $: any;

@Component({
  templateUrl: './purchase-orders.component.html',
  styleUrls: ['./purchase-orders.component.css'],
  providers: [UserService, PurchaseOrdersService]
})
export class PurchaseOrdersComponent implements OnInit {
  public identity;
  public token;
  public orders: Array<PurchaseOrder>;
  public filteredOrders: Array<PurchaseOrder>;
  public filter: string;
  public searchFilter: string;

  constructor(private _userService: UserService,
    private _purchaseOrdersService: PurchaseOrdersService,
    private _route: ActivatedRoute, private _router: Router) {
    this.orders = new Array<PurchaseOrder>();
    this.filteredOrders = new Array<PurchaseOrder>();
  }

  ngOnInit() {
    $('#filter').focus();
    console.log('iniciando componente de ordenes de compra');
    //TODO: validar vigencia del token/identity
    this.identity = this._userService.getItentity();
    if (this.identity === null) {
      this._router.navigate(['/']);
    }
    this.listOpenOrders();
  }

  private listOpenOrders() {
    this._purchaseOrdersService.listOpenOrders().subscribe(
      response => {
        this.orders = response;
        this.filteredOrders = this.orders;
      },
      error => {
        console.error(error);
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  private redirectIfSessionInvalid(error) {
    if (error && error.status && error.status == 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

  public seleccionarOrden(docNum) {
    this._router.navigate(['/purchase-order/', docNum]);
  }

  public filterOrders() {
    console.log('filtrando');
    if (this.filter != this.searchFilter) {
      console.log(this.filter);
      this.searchFilter = this.filter.toLowerCase();
      this.filteredOrders = new Array<PurchaseOrder>();
      for (let i = 0; i < this.orders.length; i++) {
        const ord = this.orders[i];
        if (ord.docNum.toLowerCase().includes(this.searchFilter)
          || ord.cardCode.toLowerCase().includes(this.searchFilter)
          || ord.cardName.toLowerCase().includes(this.searchFilter)) {
          this.filteredOrders.push(ord);
        }
      }
    }
  }
}
