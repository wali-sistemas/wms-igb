import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';
import { PackingRecord } from '../models/packing-record';

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

    public listCustomers() {
        let igbHeaders = new IGBHeaders().loadHeaders();
        return this._http.get(this.url + 'packing/customers', { headers: igbHeaders })
            .map(res => res.json());
    }

    public listCustomerOrders(customerId: string) {
        let igbHeaders = new IGBHeaders().loadHeaders();
        return this._http.get(this.url + 'packing/orders/' + customerId, { headers: igbHeaders })
            .map(res => res.json());
    }

    public validateBinCode(binCode: string, orderNumber: number) {
        let igbHeaders = new IGBHeaders().loadHeaders();
        return this._http.get(this.url + 'packing/bin/' + orderNumber + '/' + binCode, { headers: igbHeaders })
            .map(res => res.json());
    }

    public validateItem(itemCode: string, binCode: string, orderNumber: number) {
        let igbHeaders = new IGBHeaders().loadHeaders();
        return this._http.get(this.url + 'packing/item/' + orderNumber + '/' + binCode + '/' + itemCode, { headers: igbHeaders })
            .map(res => res.json());
    }

    public createPackingRecord(packingRecord: PackingRecord) {
        let igbHeaders = new IGBHeaders().loadHeaders();
        return this._http.post(this.url + 'packing/pack', packingRecord, { headers: igbHeaders })
            .map(res => res.json());
    }

    public listOpenJobRecords(username: string) {
        let igbHeaders = new IGBHeaders().loadHeaders();
        return this._http.get(this.url + 'packing/list/' + username, { headers: igbHeaders })
            .map(res => res.json());
    }

    public listOrderItems(idPackingOrder: number) {
        let igbHeaders = new IGBHeaders().loadHeaders();
        return this._http.get(this.url + 'packing/items/' + idPackingOrder, { headers: igbHeaders })
            .map(res => res.json());
    }

    public createDelivery(idPackingOrder: number) {
        let igbHeaders = new IGBHeaders().loadHeaders();
        return this._http.post(this.url + 'packing/delivery', idPackingOrder, { headers: igbHeaders })
            .map(res => res.json());
    }

    public closePackingOrder(idPackingOrder: number, username: string) {
        let igbHeaders = new IGBHeaders().loadHeaders();
        return this._http.put(this.url + 'packing/close/' + username + '/' + idPackingOrder, null, { headers: igbHeaders })
            .map(res => res.json());
    }

    public closeOrder(idPackingOrder) {
        let igbHeaders = new IGBHeaders().loadHeaders();
        return this._http.put(this.url + 'salesorder/close/', idPackingOrder, { headers: igbHeaders })
            .map(res => res.json());
    }

    public arePackingOrdersComplete() {
        let igbHeaders = new IGBHeaders().loadHeaders();
        return this._http.get(this.url + 'packing/status', { headers: igbHeaders })
            .map(res => res.json());
    }
}
