import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { GLOBAL, HEADERS } from './global';

@Injectable()
export class PurchaseOrdersService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  public listOpenOrders() {
    return this._http.get(this.url + 'reception/list/orders', { headers: HEADERS })
      .map(res => res.json());
  }

  public loadOrder(docNum) {
    return this._http.get(this.url + 'reception/load/order/' + docNum, { headers: HEADERS })
      .map(res => res.json());
  }

  public createDocument(document) {
    return this._http.post(this.url + 'reception/receive-items', JSON.stringify(document), { headers: HEADERS })
      .map(res => res.json());
  }
}
