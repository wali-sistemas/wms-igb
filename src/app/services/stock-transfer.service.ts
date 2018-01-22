import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { GLOBAL } from './global';

@Injectable()
export class StockTransferService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  public openInventory(warehouse, location) {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Company-Name': localStorage.getItem('igb.selectedCompany')
    });

    return this._http.get(this.url + 'stocktransfer/clean-location' + '/' + warehouse + '/' + location, { headers: headers })
      .map(res => res.json());
  }
}
