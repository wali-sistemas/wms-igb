import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class DeliveryService {
    public url: string;

    constructor(private _http: Http) {
        this.url = GLOBAL.url;
    }

    public createPickingExpress(pickingExpressOrderDTO) {
        return this._http.post(this.url + 'delivery/express', pickingExpressOrderDTO, { headers: new IGBHeaders().loadHeaders() })
            .map(res => res.json());
    }

    public createDeliveryModula(orderMDL: String) {
        return this._http.post(this.url + 'delivery/modula', orderMDL, { headers: new IGBHeaders().loadHeaders() })
            .map(res => res.json());
    }
}