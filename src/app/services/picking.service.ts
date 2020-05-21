import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class PickingService {
    public url: string;

    constructor(private _http: Http) {
        this.url = GLOBAL.url;
    }

    public getNextPickingItem(username, orderNumber) {
        let igbHeaders = new IGBHeaders().loadHeaders();
        let orderNumberFilter = '';
        let positionOrder = '';
        
        if (orderNumber) {
            orderNumberFilter = '?orderNumber=' + orderNumber;
        }
        return this._http.get(this.url + 'picking/v2/nextitem/' + username +'/' + orderNumberFilter, { headers: igbHeaders })
            .map(res => res.json());
    }

    public finishPicking(username, orderNumber) {
        let igbHeaders = new IGBHeaders().loadHeaders();
        let orderNumberFilter = '';
        if (orderNumber) {
            orderNumberFilter = '?orderNumber=' + orderNumber;
        }
        return this._http.put(this.url + 'picking/v2/close/' + username + orderNumberFilter, null, { headers: igbHeaders })
            .map(res => res.json());
    }
}
