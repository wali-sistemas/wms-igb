import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { GLOBAL } from './global';

@Injectable()
export class SalesOrdersService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  public listOpenOrders(showApprovedOnly) {
    //TODO: enviar token para validar permisos
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Company-Name': localStorage.getItem('igb.selectedCompany')
    });
    return this._http.get(this.url + 'picking/list/orders?showAll=' + !showApprovedOnly, { headers: headers })
      .map(res => res.json());
  }

  public assignOrders(assignment) {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Company-Name': localStorage.getItem('igb.selectedCompany')
    });
    return this._http.post(this.url + 'picking/assign', JSON.stringify(assignment), { headers: headers })
      .map(res => res.json());
  }

  public getNextPickingItem(username, orderNumber) {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Company-Name': localStorage.getItem('igb.selectedCompany')
    });
    let orderNumberFilter = '';
    if (orderNumber) {
      orderNumberFilter = '?orderNumber=' + orderNumber;
    }
    return this._http.get(this.url + 'picking/pick/' + username + orderNumberFilter, { headers: headers })
      .map(res => res.json());
  }

  public listUserOrders(username) {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Company-Name': localStorage.getItem('igb.selectedCompany')
    });
    return this._http.get(this.url + 'picking/orders/' + username, { headers: headers })
      .map(res => res.json());
  }
}
