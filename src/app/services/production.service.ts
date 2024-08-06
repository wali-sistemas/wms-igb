import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class ProductionService {
  public urlSpring: string;

  constructor(private _http: Http) {
    this.urlSpring = GLOBAL.urlSpring;
  }

  public getAllOrders(company: string) {
    return this._http.get(this.urlSpring + 'orders?schema=' + company, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public getOrderDetails(company: string, docNum: string) {
    return this._http.get(this.urlSpring + 'orders/details?schema=' + company + '&docNum=' + docNum, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public printerLabel(labelData) {
    return this._http.post(this.urlSpring + 'label/print', labelData, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }
}
