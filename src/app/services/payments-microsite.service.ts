import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class PaymentsMicrositeService {
  public urlSpring: string;

  constructor(private _http: Http) {
    this.urlSpring = GLOBAL.urlSpring;
  }

  public getInvoicesDetail(cardCode, companyName) {
    return this._http.get(this.urlSpring + 'wallet/invoice?company=' + companyName + '&document=C' + cardCode, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public getPaymentReceipt(cardCode, companyName) {
    return this._http.get(this.urlSpring + 'wallet/receipts?company=' + companyName + '&document=C' + cardCode, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public getKeySHA256(input: string) {
    const body = { input: input };
    return this._http.post(this.urlSpring + 'wallet/generate', body, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public sendRequestPayment(paymentRequest, companyName) {
    return this._http.post(this.urlSpring + 'wallet/new-payment-wallet?companyName=' + companyName, paymentRequest, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public sendPaymentSession(paymentSession, companyName) {
    return this._http.post(this.urlSpring + 'wallet/hold-invoices?schema=' + companyName, paymentSession, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public getHoldInvoices(cardCode, companyName) {
    return this._http.get(this.urlSpring + 'wallet/hold-invoices?schema=' + companyName + '&userId=' + cardCode, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public releaseInvoices(companyName) {
    return this._http.get(this.urlSpring + 'wallet/release-expired-invoices?schema=' + companyName, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }
}
