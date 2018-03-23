import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
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
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.get(this.url + 'generic/status', { headers: igbHeaders })
      .map(res => res.json());
  }

}
