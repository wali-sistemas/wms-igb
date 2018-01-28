import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, HEADERS } from './global';

@Injectable()
export class BinLocationService {
    public url: string;

    constructor(private _http: Http) {
        this.url = GLOBAL.url;
    }

    public listAvailablePickingCarts() {
        return this._http.get(this.url + 'binlocation/picking-carts', { headers: HEADERS })
            .map(res => res.json());
    }
}
