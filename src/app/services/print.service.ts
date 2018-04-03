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

    public print(printData: PrintData) {
        let igbHeaders = new IGBHeaders().loadHeaders();
        return this._http.post(this.url + 'print', printData, { headers: igbHeaders })
            .map(res => res.json());
    }
}