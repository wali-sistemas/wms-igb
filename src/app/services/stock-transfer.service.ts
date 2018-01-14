import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL } from './global';

@Injectable()
export class StockTransferService {
    public url: string;

    constructor(private _http: Http) {
        this.url = GLOBAL.url;
    }

    public transferSingleItem(itemTransfer) {
        const headers = new Headers({
            'Content-Type': 'application/json',
            'X-Company-Name': localStorage.getItem('igb.selectedCompany')
        });
        return this._http.post(this.url + 'stocktransfer/picking', itemTransfer, { headers: headers })
            .map(res => res.json());
    }

}
