import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class StockConsultService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  public stockConsult(itemCode) {
    return this._http.get(this.url + 'stockitem/find/' + itemCode, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }
}