import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class CubicService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  public addOrder(docNum) {
    return this._http.get(this.url + 'cubic/add-order/' + docNum, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }
}