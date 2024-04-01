import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class DeliveryService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  public listOpenDelivery() {
    return this._http.get(this.url + 'delivery/list-open-delivery', { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public getNextPickingItem(usernamaset: string, deliveryNumber: string, position: number) {
    return this._http.get(this.url + 'delivery/nextitem-pick-list-express/' + usernamaset + '?deliveryNumber=' + deliveryNumber + '&position=' + position, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public getAssignEmployeePickListExpress(usernamaset: string, deliveryNumber: string) {
    return this._http.get(this.url + 'delivery/assign-employee-pick-list-express/' + deliveryNumber + '/' + usernamaset, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public createPickingExpress(pickingExpressOrderDTO) {
    return this._http.post(this.url + 'delivery/express', pickingExpressOrderDTO, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public createDeliveryModula(orderMDL: string) {
    return this._http.post(this.url + 'delivery/modula', orderMDL, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public createDeliveryMagnum(deliveryNoteMagnumDTO) {
    return this._http.post(this.url + 'delivery/magnum', deliveryNoteMagnumDTO, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public checkItemPickListExpress(pickingListExpressDTO) {
    return this._http.post(this.url + 'delivery/checkitem-pick-list-express', pickingListExpressDTO, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }
}
