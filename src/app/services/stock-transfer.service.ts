import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class StockTransferService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  public cleanLocation(warehouse: string, location: string) {
    return this._http.get(this.url + 'stocktransfer/clean-location' + '/' + warehouse + '/' + location, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public finishInventory(idInventory: number) {
    return this._http.get(this.url + 'stocktransfer/finish-inventory/' + idInventory, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public transferSingleItem(itemTransfer: any) {
    return this._http.post(this.url + 'stocktransfer/picking', itemTransfer, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public transferResupply(itemTransfer: any) {
    return this._http.post(this.url + 'stocktransfer/resupply-location', itemTransfer, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public stockTransfer(stockTransfer: any) {
    return this._http.post(this.url + 'stocktransfer/stock-transfer', stockTransfer, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public stockTransferBetweenWarehouse(stockTransfer: any) {
    return this._http.post(this.url + 'stocktransfer/stock-transfer/between-warehouses', stockTransfer, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }
}
