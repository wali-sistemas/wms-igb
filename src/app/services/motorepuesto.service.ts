import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class MotorepuestoService {
    public urlManager: string;

    constructor(private _http: Http) {
        this.urlManager = GLOBAL.urlManager;
    }

    public postCreatePurchaseInvoice(docNum) {
        return this._http.get(this.urlManager + 'motorepuesto/purchase/create-invoice?docnum=' + docNum, { headers: new IGBHeaders().loadHeaders() })
            .map(res => res.json());
    }
}