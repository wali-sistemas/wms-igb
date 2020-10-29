import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { GLOBAL } from './global';

@Injectable()
export class HealthchekService {
  public urlManager: string;

  constructor(private _http: Http) {
    this.urlManager = GLOBAL.urlManager;
  }

  public resetSessionId() {
    return this._http.get(this.urlManager + 'health/reset')
      .map(res => res.json());
  }
}