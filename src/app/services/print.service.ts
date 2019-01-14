import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';
import { PrintData } from '../models/print-data';

@Injectable()
export class PrintService {
    public url: string;

    constructor(private _http: Http) {
        this.url = GLOBAL.url;
    }

    public list() {
        let igbHeaders = new IGBHeaders().loadHeaders();
        return this._http.get(this.url + 'print', { headers: igbHeaders })
            .map(res => res.json());
    }

    public listEnabledPrinters() {
        let igbHeaders = new IGBHeaders().loadHeaders();
        return this._http.get(this.url + 'print/enabled', { headers: igbHeaders })
            .map(res => res.json());
    }

    public print(printData: PrintData) {
        let igbHeaders = new IGBHeaders().loadHeaders();
        return this._http.post(this.url + 'print', printData, { headers: igbHeaders })
            .map(res => res.json());
    }

    public printLabels(idpackingList, printer) {
        let igbHeaders = new IGBHeaders().loadHeaders();
        return this._http.post(this.url + 'print/packinglist/' + printer, idpackingList, { headers: igbHeaders })
            .map(res => res.json());
    }

    public reprintOrder(RePrintDTO) {
        let igbHeaders = new IGBHeaders().loadHeaders();
        return this._http.post(this.url + 'print/Order/re-print', RePrintDTO, { headers: igbHeaders })
            .map(res => res.json());
    }
}