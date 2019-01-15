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
  public filterGroup: boolean = false;
  public selectedOrders: Map<String, String>;
  public assignableUsers: Array<any>;
  public availableStock: Array<any>;
  public selectedUser: string = '';
  public allStockAvailable: boolean = true;
  public loadingAvailableStock: boolean = false;
  public selectedOrder: number;

  constructor(private _userService: UserService,
    private _salesOrdersService: SalesOrdersService,
    private _route: ActivatedRoute, private _router: Router) {
    this.orders = new Array<SalesOrder>();
    this.filteredOrders = new Array<SalesOrder>();
    this.selectedOrders = new Map<String, String>();
  }

  ngOnInit() {
    $('#filter').focus();
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
    this.orders = new Array<SalesOrder>();
    this.filteredOrders = new Array<SalesOrder>();
    this.selectedOrders = new Map<String, any>();

    this._salesOrdersService.listOpenOrders(this.showApprovedOnly, this.filterGroup).subscribe(
      response => { 
        this.orders = response;
        console.log('loaded orders: ', this.orders);
        //TODO: validar ordenes asignadas
        this.filterOrders(true);
      },
      error => {
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

    console.log(assignment);

    this._salesOrdersService.assignOrders(assignment).subscribe(
      result => {
        $('#modal_users').modal('hide');
        this.listOpenOrders();
        this.selectedUser = '';
      }, error => { console.error(error); this.redirectIfSessionInvalid(error); }
    );
  }

  public filterOrders(force) {
    if (this.filter !== this.searchFilter || force) {
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
        console.log(result);
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
      error => {
        console.error(error);
      }
    );
  }
}
