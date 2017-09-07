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

  listOpenOrders(showApprovedOnly) {
    //TODO: enviar token para validar permisos
    const headers = new Headers({ 'Content-Type': 'application/json' });
    return this._http.get(this.url + 'picking/list/orders?showAll=' + !showApprovedOnly, { headers: headers })
      .map(res => res.json());
  }

  assignOrders(assignment) {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    return this._http.post(this.url + 'picking/assign', JSON.stringify(assignment), { headers: headers })
      .map(res => res.json());
  }
}
