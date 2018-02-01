import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, HEADERS } from './global';

@Injectable()
export class InventoryService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  public inventoryOpen(warehouse) {
    return this._http.get(this.url + 'inventory/inventoryopen/' + warehouse, { headers: HEADERS })
      .map(res => res.json());
  }

  public addItem(inventory) {
    return this._http.post(this.url + 'inventory/addItem', JSON.stringify(inventory), { headers: HEADERS })
      .map(res => res.json());
  }

  public inventoryHistory(warehouse, idInventory) {
    return this._http.get(this.url + 'inventory/inventoryhistory/' + warehouse + "/" + idInventory, { headers: HEADERS })
      .map(res => res.json());
  }
}
