import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class SoulService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  public stockFind() {
    return this._http.get(this.url + 'soul/find-stock', { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }
}