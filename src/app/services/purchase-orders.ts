import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { GLOBAL } from './global';

@Injectable()
export class PurchaseOrdersService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  listOpenOrders() {
    //TODO: enviar token para validar permisos
    const headers = new Headers({ 'Content-Type': 'application/json' });
    return this._http.get(this.url + 'reception/list/orders', { headers: headers })
      .map(res => res.json());
  }

  loadOrder(docNum) {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    return this._http.get(this.url + 'reception/load/order/' + docNum, { headers: headers })
      .map(res => res.json());
  }

  createDocument(document) {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    return this._http.post(this.url + 'reception/receive-items', JSON.stringify(document), { headers: headers })
      .map(res => res.json());
  }
}
