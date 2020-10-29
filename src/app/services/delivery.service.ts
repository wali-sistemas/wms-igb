import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class DeliveryService {
    public url: string;

    constructor(private _http: Http) {
        this.url = GLOBAL.url;
    }

    public createPickingExpress(order: String) {
        return this._http.post(this.url + 'delivery/express', order, { headers: new IGBHeaders().loadHeaders() })
            .map(res => res.json());
    }
}