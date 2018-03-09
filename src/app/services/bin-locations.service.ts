import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class BinLocationService {
    public url: string;

    constructor(private _http: Http) {
        this.url = GLOBAL.url;
    }

    public listAvailablePickingCarts() {
        let igbHeaders = new IGBHeaders().loadHeaders();
        return this._http.get(this.url + 'binlocation/picking-carts', { headers: igbHeaders })
            .map(res => res.json());
    }

    public transferSingleItem(itemTransfer) {
        let igbHeaders = new IGBHeaders().loadHeaders();
        return this._http.post(this.url + 'binlocation/pick-item', itemTransfer, { headers: igbHeaders })
            .map(res => res.json());
    }

    public listAvailablePackedCarts() {
        let igbHeaders = new IGBHeaders().loadHeaders();
        return this._http.get(this.url + 'binlocation/picking-carts', { headers: igbHeaders })
            .map(res => res.json());
    }
}
