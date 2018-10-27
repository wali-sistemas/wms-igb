import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class StockConsultService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  public stockConsult(stockConsult) {
    return this._http.post(this.url + 'stockConsult/stock-Consult', stockConsult, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }
}