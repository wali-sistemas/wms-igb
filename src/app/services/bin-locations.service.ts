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
        return this._http.get(this.url + 'binlocation/picking-carts', { headers: new IGBHeaders().loadHeaders() })
            .map(res => res.json());
    }

    public transferSingleItem(itemTransfer) {
        return this._http.post(this.url + 'binlocation/pick-item', itemTransfer, { headers: new IGBHeaders().loadHeaders() })
            .map(res => res.json());
    }

    public listAvailablePackedCarts() {
        return this._http.get(this.url + 'binlocation/picking-carts', { headers: new IGBHeaders().loadHeaders() })
            .map(res => res.json());
    }

    public getBinAbs(binCode: string) {
        return this._http.get(this.url + 'binlocation/binabs/' + binCode, { headers: new IGBHeaders().loadHeaders() })
            .map(res => res.json());
    }
}
