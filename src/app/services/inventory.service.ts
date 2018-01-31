import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { GLOBAL } from './global';

@Injectable()
export class InventoryService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  public inventoryOpen(warehouse) {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Company-Name': localStorage.getItem('igb.selectedCompany')
    });

    return this._http.get(this.url + 'inventory/inventoryopen/' + warehouse, { headers: headers })
      .map(res => res.json());
  }

  public addItem(inventory) {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Company-Name': localStorage.getItem('igb.selectedCompany')
    });

    return this._http.post(this.url + 'inventory/addItem', JSON.stringify(inventory), { headers: headers })
      .map(res => res.json());
  }

  public inventoryHistory(warehouse, idInventory) {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Company-Name': localStorage.getItem('igb.selectedCompany')
    });

    return this._http.get(this.url + 'inventory/inventoryhistory/' + warehouse + "/" + idInventory, { headers: headers })
      .map(res => res.json());
  }
}
