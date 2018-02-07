import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { HttpHeaders } from '@angular/common/http';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { GLOBAL, HEADERS } from './global';

@Injectable()
export class SalesOrdersService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  public listOpenOrders(showApprovedOnly) {
    console.log('listing open orders with headers: ', HEADERS);
    return this._http.get(this.url + 'picking/list/orders?showAll=' + !showApprovedOnly, { headers: HEADERS })
      .map(res => res.json());
  }

  public assignOrders(assignment) {
    return this._http.post(this.url + 'picking/assign', JSON.stringify(assignment), { headers: HEADERS })
      .map(res => res.json());
  }

  public getNextPickingItem(username, orderNumber) {
    let orderNumberFilter = '';
    if (orderNumber) {
      orderNumberFilter = '?orderNumber=' + orderNumber;
    }
    return this._http.get(this.url + 'picking/pick/' + username + orderNumberFilter, { headers: HEADERS })
      .map(res => res.json());
  }

  public listUserOrders(username) {
    return this._http.get(this.url + 'picking/orders/' + username, { headers: HEADERS })
      .map(res => res.json());
  }
}
