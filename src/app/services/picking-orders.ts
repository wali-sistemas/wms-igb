import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { GLOBAL } from './global';

@Injectable()
export class PickingOrders{
    public url: string;

    constructor(private _http: Http) {
        this.url = GLOBAL.url;
    }

    public listAvailableCostumerOrders() {
        //TODO: enviar token para validar permisos
        const headers = new Headers({
          'Content-Type': 'application/json',
          'X-Company-Name': localStorage.getItem('igb.selectedCompany')
        });
        return this._http.get(this.url + 'packing/list/orders' , { headers: headers })
          .map(res => res.json());
    }
}