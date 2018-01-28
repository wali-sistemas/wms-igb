import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, HEADERS } from './global';

@Injectable()
export class StockTransferService {
    public url: string;

    constructor(private _http: Http) {
        this.url = GLOBAL.url;
    }

    public transferSingleItem(itemTransfer) {
        return this._http.post(this.url + 'stocktransfer/picking', itemTransfer, { headers: HEADERS })
            .map(res => res.json());
    }

}
