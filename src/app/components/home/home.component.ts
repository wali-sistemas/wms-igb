import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { GenericService } from '../../services/generic';
import { Warehouse } from '../../models/warehouse';

@Component({
  // selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [UserService, GenericService]
})
export class HomeComponent implements OnInit {
  public errorMessage: string;
  public identity;
  public selectedWarehouse: string;
  public warehouses: Array<Warehouse>;

  constructor(private _userService: UserService,
    private _genericService: GenericService,
    private _router: Router) {
    this.warehouses = new Array<Warehouse>();
  }

  ngOnInit() {
    this.validateStatus();
    this.identity = this._userService.getItentity();
    if (this.identity === null) {
      this._router.navigate(['/']);
    }
    this.selectedWarehouse = this.identity.warehouseCode;
    this.listAvailableWarehouses();
  }

  private listAvailableWarehouses() {
    this._genericService.listAvailableWarehouses().subscribe(
      result => {
        this.warehouses = result.content;
      }, error => { console.error(error); }
    );
  }

  private validateStatus() {
    this._genericService.validateStatus().subscribe(
      response => {  },
      error => {
        console.error(error);
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  cerrarSesion() {
    localStorage.removeItem('igb.identity');
    localStorage.removeItem('igb.selectedCompany');
    localStorage.clear();
    this.identity = null;
    this._router.navigate(['/']);
  }

  private redirectIfSessionInvalid(error) {
    if (error && error.status && error.status == 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

  public updateWarehouseCode() {
    console.log(this.selectedWarehouse);
    this.identity.warehouseCode = this.selectedWarehouse;
    localStorage.setItem('igb.identity', JSON.stringify(this.identity));
  }

}
