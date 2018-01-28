import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, HEADERS } from './global';

@Injectable()
export class PickingService {
    public url: string;

    constructor(private _http: Http) {
        this.url = GLOBAL.url;
    }

    public getNextPickingItem(username, orderNumber) {
        let orderNumberFilter = '';
        if (orderNumber) {
            orderNumberFilter = '?orderNumber=' + orderNumber;
        }
        return this._http.get(this.url + 'picking/v2/nextitem/' + username + orderNumberFilter, { headers: HEADERS })
            .map(res => res.json());
    }

    public finishPicking(username, orderNumber){
        let orderNumberFilter = '';
        if (orderNumber) {
            orderNumberFilter = '?orderNumber=' + orderNumber;
        }
        return this._http.get(this.url + 'picking/v2/close/' + username + orderNumberFilter, { headers: HEADERS })
            .map(res => res.json());
    }
}
