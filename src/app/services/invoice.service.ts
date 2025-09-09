import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class InvoiceService {
  public url: string;
  public urlSpring: string

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
    this.urlSpring = GLOBAL.urlSpring;
  }

  public createInvoice(invoiceExpressDTO) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.post(this.url + 'invoice', invoiceExpressDTO, { headers: igbHeaders })
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

  public getPrinterSessions(docNum: number, companyName: string) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.get(this.urlSpring + 'printer-sessions?schema=' + companyName + '&orderNum=' + docNum, { headers: igbHeaders })
      .map(res => res.json());
  }

  public insertPrinterSession(companyName, printerSession) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.post(this.urlSpring + 'printer-sessions?schema=' + companyName, printerSession, { headers: igbHeaders })
      .map(res => res.json());
  }
}
