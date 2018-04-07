import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class ResupplyService {
    public url: string;

    constructor(private _http: Http) {
        this.url = GLOBAL.url;
    }

    public listLocationsResupply() {
        let igbHeaders = new IGBHeaders().loadHeaders();

        return this._http.get(this.url + 'resupply/list-locations-resupply', { headers: igbHeaders })
            .map(res => res.json());
    }

    public listItemsLocation(location: string) {
        let igbHeaders = new IGBHeaders().loadHeaders();

        return this._http.get(this.url + 'resupply/list-items-location/' + location, { headers: igbHeaders })
            .map(res => res.json());
    }

    public listUbicationsStorage(itemCode: string) {
        let igbHeaders = new IGBHeaders().loadHeaders();

        return this._http.get(this.url + 'resupply/list-ubications-storage/' + itemCode, { headers: igbHeaders })
            .map(res => res.json());
    }
}
