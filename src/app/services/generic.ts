import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { GLOBAL, CONTENT_TYPE_JSON, IGBHeaders } from './global';

@Injectable()
export class GenericService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  public listAvailableCompanies() {
    return this._http.get(this.url + 'generic/companies', { headers: CONTENT_TYPE_JSON })
      .map(res => res.json());
  }

  public validateStatus() {
    return this._http.get(this.url + 'generic/status', { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public listAvailableWarehouses() {
    return this._http.get(this.url + 'generic/warehouses', { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public listActivesWarehouses() {
    return this._http.get(this.url + 'generic/warehouses/actives', { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public listActivesTransp() {
    return this._http.get(this.url + 'generic/companies/transports', { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }
}