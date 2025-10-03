import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';
import { PackingRecord } from '../models/packing-record';

@Injectable()
export class PackingService {
  public url: string;
  public urlSpring: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
    this.urlSpring = GLOBAL.urlSpring
  }

  public listPackingRecords() {
    return this._http.get(this.url + 'packing', { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public listCustomers() {
    return this._http.get(this.url + 'packing/customers', { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public listCustomerOrders(customerId: string) {
    return this._http.get(this.url + 'packing/orders/' + customerId, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public validateBinCode(binCode: string, orderNumber: number) {
    return this._http.get(this.url + 'packing/bin/' + orderNumber + '/' + binCode, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public validateItem(itemCode: string, binCode: string, orderNumber: number) {
    return this._http.get(this.url + 'packing/item/' + orderNumber + '/' + binCode + '/' + itemCode, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public createPackingRecord(packingRecord: PackingRecord) {
    return this._http.post(this.url + 'packing/pack', packingRecord, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public listOpenJobRecords(username: string) {
    return this._http.get(this.url + 'packing/list/' + username, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public listOrderItems(idPackingOrder: number, orderNumber: number) {
    return this._http.get(this.url + 'packing/items/' + idPackingOrder + '/' + orderNumber, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public createDelivery(idPackingOrder: number) {
    return this._http.post(this.url + 'packing/delivery', idPackingOrder, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public closePackingOrder(idPackingOrder: number, username: string) {
    return this._http.put(this.url + 'packing/close/' + username + '/' + idPackingOrder, null, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res);
  }

  public closeOrder(idPackingOrder) {
    return this._http.put(this.url + 'salesorder/close/', idPackingOrder, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public cleanPackingOrder(idPackingOrder) {
    return this._http.put(this.url + 'packing/cancel/' + idPackingOrder, null, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public arePackingOrdersComplete() {
    return this._http.get(this.url + 'packing/status', { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public getPackingOrders(customer: string) {
    return this._http.get(this.url + 'packing/get-packing-orders/' + customer, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public cancelPackingOrder(idPackingOrder: number) {
    return this._http.put(this.url + 'packing/cancel-packing-order/' + idPackingOrder, null, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public getUrlPackingList(idPackingOrder: number, username: string) {
    return this._http.get(this.url + 'packing/pdf/' + username + '/' + idPackingOrder, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res);
  }

  public getBoxPackingList(username: string) {
    return this._http.get(this.url + 'packing/list-boxes/' + username, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public getDetailDelivery(orderNumber: string) {
    return this._http.get(this.url + 'packing/get-detail-delivery/' + orderNumber, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public addCheckOutOrder(checkOutDTO) {
    return this._http.post(this.url + 'packing/add-checkout-order', checkOutDTO, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public findCheckOut(orderNumber: string) {
    return this._http.get(this.url + 'packing/find-checkout/' + orderNumber, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public findOrdersPendingByInvoice() {
    return this._http.get(this.url + 'packing/find-orders-pending', { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public getOrderDocs(company: string, order: number) {
    return this._http.get(this.urlSpring + 'public-orders/invoice-link?company=' + company + '&order=' + order, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }
}
