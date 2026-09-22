import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';
import { PackingRecord } from '../models/packing-record';

@Injectable()
export class ShippingService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  public addShipping(shippingDTO: any) {
    return this._http.post(this.url + 'shipping/add', shippingDTO, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public listInvoiceShipping(invoiceDTO: any) {
    return this._http.post(this.url + 'shipping/list-invoices', invoiceDTO, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public createGuiaSaferbo(apiSaferboDTO: any, invoices: string) {
    return this._http.post(this.url + 'shipping/add-guia-saferbo/' + invoices, apiSaferboDTO, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public listTransport() {
    return this._http.get(this.url + 'shipping/list-transport', { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public listDetailContainer(invoice: String, box: number) {
    return this._http.get(this.url + 'shipping/detail-container/' + invoice + '/' + box, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public listTransPayroll() {
    return this._http.get(this.url + 'shipping/list-transp-payroll', { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public createGuiaRapidoochoa(apiRapidoochoaDTO: any, invoices: string) {
    return this._http.post(this.url + 'shipping/add-guia-rapidoochoa/' + invoices, apiRapidoochoaDTO, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public createGuiaOla(apiOlaDTO: any, invoices: string) {
    return this._http.post(this.url + 'shipping/add-guia-ola/' + invoices, apiOlaDTO, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public listCitiesDestinationsOla() {
    return this._http.get(this.url + 'shipping/list-destination-ola', { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public createGuiaCoordinadora(apiCoordinadoraDTO: any, invoices: string) {
    return this._http.post(this.url + 'shipping/add-guia-coordinadora/' + invoices, apiCoordinadoraDTO, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public createGuiaTransprensa(apiTransprensaDTO: any, invoices: string) {
    return this._http.post(this.url + 'shipping/add-guia-transprensa/' + invoices, apiTransprensaDTO, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public printStickerGuiaOla(guia: String) {
    return this._http.get(this.url + 'shipping/print-sticker-ola/' + guia, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public createGuiaGoPack(apiGoPackDTO: any, invoices: string) {
    return this._http.post(this.url + 'shipping/add-guia-gopack/' + invoices, apiGoPackDTO, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public createGuiaAldia(apiAldiaDTO: any, invoices: string) {
    return this._http.post(this.url + 'shipping/add-guia-aldia/' + invoices, apiAldiaDTO, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public createGuiaExxe(apiExxeDTO: any, invoices: string) {
    return this._http.post(this.url + 'shipping/add-guia-exxe/' + invoices, apiExxeDTO, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public createGuiaEnvia(apiEnviaDTO: any, invoices: string) {
    return this._http.post(this.url + 'shipping/add-guia-envia/' + invoices, apiEnviaDTO, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }
}
