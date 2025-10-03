import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';
import 'rxjs/add/operator/map';

@Injectable()
export class PublicTrackingService {
  public urlSpring: string;

  constructor(private _http: Http) {
    this.urlSpring = GLOBAL.urlSpring;
  }

  public getClientInvoices(company: string, cardCode: string) {
    return this._http.get(this.urlSpring + 'public-tracking/invoices?company=' + company + '&cardCode=' + cardCode, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public getLatestTrackingByInvoice(company: string, invoice: string) {
    return this._http.get(this.urlSpring + 'public-tracking/guide?company=' + company + '&invoice=' + invoice, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }
}
