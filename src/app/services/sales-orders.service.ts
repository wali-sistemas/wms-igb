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

  public listOpenOrders(showApprovedOnly, filterGroup) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.get(this.url + 'salesorder/list/orders/' + !showApprovedOnly + '/' + filterGroup, { headers: igbHeaders })
      .map(res => res.json());
  }

  public assignOrders(assignment) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.post(this.url + 'salesorder/assign', JSON.stringify(assignment), { headers: igbHeaders })
      .map(res => res.json());
  }

  public getNextPickingItem(username, orderNumber) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    let orderNumberFilter = '';
    if (orderNumber) {
      orderNumberFilter = '?orderNumber=' + orderNumber;
    }
    return this._http.get(this.url + 'salesorder/pick/' + username + orderNumberFilter, { headers: igbHeaders })
      .map(res => res.json());
  }

  public listUserOrders(username) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.get(this.url + 'salesorder/orders/' + username, { headers: igbHeaders })
      .map(res => res.json());
  }

  public listAvailableStock(orderNumber) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.get(this.url + 'salesorder/stock/' + orderNumber, { headers: igbHeaders })
      .map(res => res.json());
  }

  public enableAssignation(orderNumber) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.put(this.url + 'salesorder/enable', orderNumber, { headers: igbHeaders })
      .map(res => res.json());
  }

  public deleteAssignOrders(orderNumber) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.delete(this.url + 'salesorder/reset-assigned/' + orderNumber, { headers: igbHeaders })
      .map(res => res.json());
  }

  public validateOrderAuthorized(orderNumber) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.get(this.url + 'salesorder/validate-order/' + orderNumber, { headers: igbHeaders })
      .map(res => res.json());
  }
}