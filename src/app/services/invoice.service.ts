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
        return this._http.post(this.url + 'invoice/draft', deliveryDocEntry, { headers: igbHeaders })
            .map(res => res.json());
    }
}