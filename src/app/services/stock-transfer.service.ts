import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, HEADERS } from './global';

@Injectable()
export class StockTransferService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  public openInventory(warehouse, location) {
    return this._http.get(this.url + 'stocktransfer/clean-location' + '/' + warehouse + '/' + location, { headers: HEADERS })
      .map(res => res.json());
  }

  public finishInventory(idInventory) {
    return this._http.get(this.url + 'stocktransfer/finishInventory/' + idInventory, { headers: HEADERS })
      .map(res => res.json());
  }
  
  public transferSingleItem(itemTransfer) {
    return this._http.post(this.url + 'stocktransfer/picking', itemTransfer, { headers: HEADERS })
      .map(res => res.json());
  }

}
