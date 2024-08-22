import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class PurchaseOrdersService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  public listOpenOrders() {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.get(this.url + 'reception/list/orders', { headers: igbHeaders })
      .map(res => res.json());
  }

  public loadOrder(docNum) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.get(this.url + 'reception/load/order/' + docNum, { headers: igbHeaders })
      .map(res => res.json());
  }

  public createDocument(document) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.post(this.url + 'reception/receive-items', JSON.stringify(document), { headers: igbHeaders })
      .map(res => res.json());
  }

  public loadOrderUDF(docNum) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.get(this.url + 'reception/load/order/udf/' + docNum, { headers: igbHeaders })
      .map(res => res.json());
  }

  public updateOrderUDF(userFieldDTO) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.put(this.url + 'reception/update/order/udf', userFieldDTO, { headers: igbHeaders })
      .map(res => res.json());
  }
}
