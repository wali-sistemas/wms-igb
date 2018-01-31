import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { GLOBAL, HEADERS, CONTENT_TYPE_JSON } from './global';

@Injectable()
export class UserService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  public signIn(userToLogin, selectedCompany) {
    let params = '{"username":"' + userToLogin.username + '","password":"' + userToLogin.password + '", "selectedCompany":"' + selectedCompany + '"}';
    return this._http.post(this.url + 'user/login', params, { headers: CONTENT_TYPE_JSON })
      .map(res => res.json());
  }

  public getItentity() {
    const identity = JSON.parse(localStorage.getItem('igb.identity'));
    return identity;
  }

  public listUsersByGroup(groupName) {
    return this._http.get(this.url + 'user/list/' + groupName, { headers: HEADERS })
      .map(res => res.json());
  }

}
