import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class PaymentsMicrositeService {
  public urlSpring: string;
  public urlMeta: string;

  constructor(private _http: Http) {
    this.urlSpring = GLOBAL.urlSpring;
    this.urlMeta = GLOBAL.urlMeta;
  }

  public getInvoicesDetail(cardCode: string, companyName: string) {
    return this._http.get(this.urlSpring + 'wallet/invoice?company=' + companyName + '&document=C' + cardCode, { headers: new IGBHeaders().loadHeaders() }
    ).map(res => res.json());
  }

  public getPaymentReceipt(cardCode: string, companyName: string) {
    return this._http.get(this.urlSpring + 'wallet/receipts?company=' + companyName + '&document=C' + cardCode, { headers: new IGBHeaders().loadHeaders() }
    ).map(res => res.json());
  }

  public getKeySHA256(input: string) {
    const body = { input: input };
    return this._http.post(this.urlSpring + 'wallet/generate', body, { headers: new IGBHeaders().loadHeaders() }
    ).map(res => res.json());
  }

  public sendRequestPayment(paymentRequest: any, companyName: string) {
    return this._http.post(this.urlSpring + 'wallet/new-payment-wallet?companyName=' + companyName, paymentRequest, { headers: new IGBHeaders().loadHeaders() }
    ).map(res => res.json());
  }

  public sendPaymentSession(paymentSession: any, companyName: string) {
    return this._http.post(this.urlSpring + 'wallet/hold-invoices?schema=' + companyName, paymentSession, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public getHoldInvoices(cardCode: string, companyName: string) {
    return this._http.get(this.urlSpring + 'wallet/hold-invoices?schema=' + companyName + '&userId=' + cardCode, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public releaseInvoices(companyName: string) {
    return this._http.get(this.urlSpring + 'wallet/release-expired-invoices?schema=' + companyName, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public getMotorepuestosOrders(document: string) {
    return this._http.get(this.urlMeta + 'motorepuestos/payment/orders/' + document, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public getMotorepuestosCheckout(document: string) {
    return this._http.get(this.urlMeta + 'motorepuestos/payment/checkout/' + document, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public createMotorepuestosPaymentSession(paymentRequest: any) {
    return this._http.post(this.urlMeta + 'motorepuestos/payment/session', paymentRequest, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public createMotorepuestosWompiPaymentSession(paymentRequest: any) {
    return this._http.post(this.urlMeta + 'motorepuestos/wompi/payment/session', paymentRequest, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public registerMotorepuestosWompiTransaction(reference: string, transactionId: string) {
    const body = { reference: reference, transactionId: transactionId };
    return this._http.post(this.urlMeta + 'motorepuestos/wompi/payment/transaction', body, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public getMotorepuestosWompiStatus(transactionId: string) {
    return this._http.get(this.urlMeta + 'motorepuestos/wompi/payment/status/' + transactionId, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }
}
