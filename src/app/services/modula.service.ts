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
        return this._http.get(this.urlManager + 'modula/stock-compare', { headers: new IGBHeaders().loadHeaders() })
            .map(res => res.json());
    }

    public getValidateItem(itemCode: String) {
        return this._http.get(this.urlManager + 'modula/validate-item/' + itemCode, { headers: new IGBHeaders().loadHeaders() })
            .map(res => res.json());
    }

    public postStockDeposit(orderModulaDTO) {
        return this._http.post(this.urlManager + 'modula/stock-deposit', orderModulaDTO, { headers: new IGBHeaders().loadHeaders() })
            .map(res => res.json());
    }

    public postStockInvenatory(orderModulaDTO) {
        return this._http.post(this.urlManager + 'modula/stock-inventory', orderModulaDTO, { headers: new IGBHeaders().loadHeaders() })
            .map(res => res.json());
    }

    public getValidateOrderCompleted(order: String) {
        return this._http.get(this.urlManager + 'modula/orders-completed/' + order, { headers: new IGBHeaders().loadHeaders() })
            .map(res => res.json());
    }

    public getReplicateItemModula(itemCode: string, minStock: number, maxStock: number) {
        return this._http.get(this.urlManager + 'modula/replicate-item/' + itemCode + '/' + minStock + '/' + maxStock, { headers: new IGBHeaders().loadHeaders() })
            .map(res => res.json());
    }
}