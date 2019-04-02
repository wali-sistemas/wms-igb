import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { GLOBAL } from './global';

@Injectable()
export class EventService {
  public urlManager: string;

  constructor(private _http: Http) {
    this.urlManager = GLOBAL.urlManager;
  }

  public captureClient(ClientFeriaDTO) {
    return this._http.post(this.urlManager + 'feria/add-client', ClientFeriaDTO)
      .map(res => res.json());
  }
}