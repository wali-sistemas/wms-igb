import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class PackingService {
    public url: string;

    constructor(private _http: Http) {
        this.url = GLOBAL.url;
    }

    public listPackingRecords() {
        let igbHeaders = new IGBHeaders().loadHeaders();
        return this._http.get(this.url + 'packing', { headers: igbHeaders })
            .map(res => res.json());
    }
}
