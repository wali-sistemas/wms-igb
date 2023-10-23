import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class CalidosoService {
  public urlManager: string;

  constructor(private _http: Http) {
    this.urlManager = GLOBAL.urlManager;
  }

  public redeemPointsClubVip(redemption) {
    return this._http.post(this.urlManager + 'calidosos/add-point/redeem-caps/UzEkdGVtYSRJZ2IyMDE1Kg==', redemption, { headers: new IGBHeaders().loadHeaders() })
    .map(res => res.json());
  }
}
