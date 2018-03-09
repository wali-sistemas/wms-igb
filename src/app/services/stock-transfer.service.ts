import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class StockTransferService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  public openInventory(warehouse, location) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.get(this.url + 'stocktransfer/clean-location' + '/' + warehouse + '/' + location, { headers: igbHeaders })
      .map(res => res.json());
  }

  public finishInventory(idInventory) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.get(this.url + 'stocktransfer/finishInventory/' + idInventory, { headers: igbHeaders })
      .map(res => res.json());
  }

  public transferSingleItem(itemTransfer) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.post(this.url + 'stocktransfer/picking', itemTransfer, { headers: igbHeaders })
      .map(res => res.json());
  }

}
