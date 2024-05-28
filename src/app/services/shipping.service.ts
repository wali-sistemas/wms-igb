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

  public addShipping(ShippingDTO) {
    return this._http.post(this.url + 'shipping/add', ShippingDTO, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public listInvoiceShipping(InvoiceDTO) {
    return this._http.post(this.url + 'shipping/list-invoices', InvoiceDTO, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public createGuiaSaferbo(ApiSaferboDTO, invoices) {
    return this._http.post(this.url + 'shipping/add-guia-saferbo/' + invoices, ApiSaferboDTO, { headers: new IGBHeaders().loadHeaders() })
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

  public createGuiaRapidoochoa(GuiaDTO, invoices) {
    return this._http.post(this.url + 'shipping/add-guia-rapidoochoa/' + invoices, GuiaDTO, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public createGuiaOla(GuiaOlaDTO, invoices) {
    return this._http.post(this.url + 'shipping/add-guia-ola/' + invoices, GuiaOlaDTO, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public listCitiesDestinationsOla() {
    return this._http.get(this.url + 'shipping/list-destination-ola', { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public createGuiaCoordinadora(ApiCoordinadoraDTO, invoices) {
    return this._http.post(this.url + 'shipping/add-guia-coordinadora/' + invoices, ApiCoordinadoraDTO, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public createGuiaTransprensa(ApiTransprensaDTO, invoices) {
    return this._http.post(this.url + 'shipping/add-guia-transprensa/' + invoices, ApiTransprensaDTO, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public printStickerGuiaOla(guia: String) {
    return this._http.get(this.url + 'shipping/print-sticker-ola/' + guia, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public createGuiaGoPack(GuiaDTO, invoices) {
    return this._http.post(this.url + 'shipping/add-guia-gopack/' + invoices, GuiaDTO, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }
}
