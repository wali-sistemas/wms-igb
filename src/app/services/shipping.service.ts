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

    public createGuiaTransport(ApiSaferboDTO) {
        return this._http.post(this.url + 'shipping/add-guia-saferbo', ApiSaferboDTO, { headers: new IGBHeaders().loadHeaders() })
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
}