import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class ModulaService {
    public urlManager: string;

    constructor(private _http: Http) {
        this.urlManager = GLOBAL.urlManager;
    }

    public getStockMissing() {
        let igbHeaders = new IGBHeaders().loadHeaders();
        console.log("*************");
        console.log(igbHeaders);
        console.log("*************");
        
        
        return this._http.get(this.urlManager + 'modula/stock-compare', { headers: new IGBHeaders().loadHeaders() })
            .map(res => res.json());
    }
}