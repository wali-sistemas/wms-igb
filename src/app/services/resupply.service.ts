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
        return this._http.get(this.url + 'resupply/list-locations-resupply', { headers: new IGBHeaders().loadHeaders() })
            .map(res => res.json());
    }

    public listItemsLocation(location: string) {
        return this._http.get(this.url + 'resupply/list-items-location/' + location, { headers: new IGBHeaders().loadHeaders() })
            .map(res => res.json());
    }

    public listUbicationsStorage(itemCode: string) {
        return this._http.get(this.url + 'resupply/list-location-storage/' + itemCode, { headers: new IGBHeaders().loadHeaders() })
            .map(res => res.json());
    }

    public listLocationLimits(location: string) {
        return this._http.get(this.url + 'resupply/list-location-limits/' + location, { headers: new IGBHeaders().loadHeaders() })
            .map(res => res.json());
    }

    public saveLocationLimit(locationLimit) {
        return this._http.post(this.url + 'resupply/save-location-limit', locationLimit, { headers: new IGBHeaders().loadHeaders() })
            .map(res => res.json());
    }

    public deleteLocationLimit(code) {
        return this._http.delete(this.url + 'resupply/delete-location-limit/' + code, { headers: new IGBHeaders().loadHeaders() })
            .map(res => res.json());
    }
}
