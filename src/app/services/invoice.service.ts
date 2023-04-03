import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class InvoiceService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  public createInvoice(deliveryDocEntry) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.post(this.url + 'invoice', deliveryDocEntry, { headers: igbHeaders })
      .map(res => res.json());
  }

  public listCashInvoices() {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.get(this.url + 'invoice/cash-invoices', { headers: igbHeaders })
      .map(res => res.json());
  }

  public updateStatusCashInvoice(docNum: number, status: string) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.put(this.url + 'invoice/cash-invoice/update-status/?docnum=' + docNum + '&status=' + status, null, { headers: igbHeaders })
      .map(res => res.json());
  }
}
