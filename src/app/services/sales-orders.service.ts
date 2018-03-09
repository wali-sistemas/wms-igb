import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { HttpHeaders } from '@angular/common/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class SalesOrdersService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  public listOpenOrders(showApprovedOnly) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.get(this.url + 'picking/list/orders?showAll=' + !showApprovedOnly, { headers: igbHeaders })
      .map(res => res.json());
  }

  public assignOrders(assignment) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.post(this.url + 'picking/assign', JSON.stringify(assignment), { headers: igbHeaders })
      .map(res => res.json());
  }

  public getNextPickingItem(username, orderNumber) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    let orderNumberFilter = '';
    if (orderNumber) {
      orderNumberFilter = '?orderNumber=' + orderNumber;
    }
    return this._http.get(this.url + 'picking/pick/' + username + orderNumberFilter, { headers: igbHeaders })
      .map(res => res.json());
  }

  public listUserOrders(username) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.get(this.url + 'picking/orders/' + username, { headers: igbHeaders })
      .map(res => res.json());
  }
}
