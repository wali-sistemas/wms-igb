import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class CalculateInvoiceService {
  public urlSpring: string;

  constructor(private _http: Http) {
    this.urlSpring = GLOBAL.urlSpring;
  }

  public getInvoicesDetail(cardCode, companyName) {
    return this._http.get(this.urlSpring + '/calculatorInvoices?company=' + companyName + '&cardCode=C' + cardCode, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public sendInvoices(payload, companyName) {
    return this._http.post(this.urlSpring + '/reports/financial-discounts?schema=' + companyName, payload, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }
}
