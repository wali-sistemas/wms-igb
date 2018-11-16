import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class StockTransferService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  public cleanLocation(warehouse, location) {
    return this._http.get(this.url + 'stocktransfer/clean-location' + '/' + warehouse + '/' + location, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public finishInventory(idInventory) {
    return this._http.get(this.url + 'stocktransfer/finish-inventory/' + idInventory, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public transferSingleItem(itemTransfer) {
    return this._http.post(this.url + 'stocktransfer/picking', itemTransfer, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public transferResupply(itemTransfer) {
    return this._http.post(this.url + 'stocktransfer/resupply-location', itemTransfer, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public stockTransfer(stockTransfer) {
    return this._http.post(this.url + 'stocktransfer/stock-transfer', stockTransfer, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public stockTransferBetweenWarehouse(stockTransfer) {
    return this._http.post(this.url + 'stocktransfer/stock-transfer/between-warehouses', stockTransfer, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }
}