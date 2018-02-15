import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class InventoryService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  public inventoryOpen(warehouse) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.get(this.url + 'inventory/inventoryopen/' + warehouse, { headers: igbHeaders })
      .map(res => res.json());
  }

  public addItem(inventory) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.post(this.url + 'inventory/addItem', JSON.stringify(inventory), { headers: igbHeaders })
      .map(res => res.json());
  }

  public inventoryHistory(warehouse, idInventory) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.get(this.url + 'inventory/inventoryhistory/' + warehouse + "/" + idInventory, { headers: igbHeaders })
      .map(res => res.json());
  }
}
