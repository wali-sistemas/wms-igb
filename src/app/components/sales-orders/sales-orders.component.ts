import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../services/user.service';
import { SalesOrdersService } from '../../services/sales-orders.service';
import { SalesOrder, SalesOrderLine } from '../../models/sales-order';

declare var $: any;

@Component({
  templateUrl: './sales-orders.component.html',
  styleUrls: ['./sales-orders.component.css'],
  providers: [UserService, SalesOrdersService]
})
export class SalesOrdersComponent implements OnInit {
  public identity;
  public token;
  public orders: Array<SalesOrder>;
  public filteredOrders: Array<SalesOrder>;
  public filter: string = '';
  public searchFilter: string;
  public showApprovedOnly: boolean = true;
  public selectedOrders: Map<String, String>;
  public assignableUsers: Array<any>;
  public selectedUser: string = '';

  constructor(private _userService: UserService,
    private _salesOrdersService: SalesOrdersService,
    private _route: ActivatedRoute, private _router: Router) {
    this.orders = new Array<SalesOrder>();
    this.filteredOrders = new Array<SalesOrder>();
    this.selectedOrders = new Map<String, String>();
  }

  ngOnInit() {
    console.log('iniciando componente de ordenes de compra');
    //TODO: validar vigencia del token/identity
    this.identity = this._userService.getItentity();
    if (this.identity === null) {
      this._router.navigate(['/']);
    }
    console.log(this.identity);
    this.listOpenOrders();
  }

  private listOpenOrders() {
    this.orders = new Array<SalesOrder>();
    this.filteredOrders = new Array<SalesOrder>();
    this.selectedOrders = new Map<String, any>();

    this._salesOrdersService.listOpenOrders(this.showApprovedOnly).subscribe(
      response => {
        this.orders = response;
        console.log('loaded orders: ', this.orders);
        //TODO: validar ordenes asignadas
        this.filterOrders(true);
      },
      error => {
        console.error(error);
      }
    );
  }

  public selectOrder(order: SalesOrder) {
    //this._router.navigate(['/sale-order/', docNum]);
    if (order.confirmed === 'N') {
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
        $('#modal_users').modal('show');
      }, error => { console.error(error); }
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

    let assignment = {
      "assignedBy": this.identity.username,
      "employeeId": this.selectedUser,
      "orders": Array.from(this.selectedOrders.entries())//.map(Number)
    };

    console.log(assignment);

    this._salesOrdersService.assignOrders(assignment).subscribe(
      result => {
        $('#modal_users').modal('hide');
        this.listOpenOrders();
        this.selectedUser = '';
      }, error => { console.error(error); }
    );
  }

  public filterOrders(force) {
    if (this.filter != this.searchFilter || force) {
      this.searchFilter = this.filter.toLowerCase();
      this.filteredOrders = new Array<SalesOrder>();
      for (let i = 0; i < this.orders.length; i++) {
        let ord = this.orders[i];
        if (ord.docNum.toLowerCase().includes(this.searchFilter)
          || ord.cardCode.toLowerCase().includes(this.searchFilter)
          || ord.cardName.toLowerCase().includes(this.searchFilter)) {
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
  }
}
