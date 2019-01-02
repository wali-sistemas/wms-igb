import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class StockItemService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  public stockFind(itemCode) {
    return this._http.get(this.url + 'stockitem/find/' + itemCode, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public checkOutStockItem(itemCode, location) {
    return this._http.get(this.url + 'stockitem/checkoutStock/' + itemCode + "/" + location, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }
}