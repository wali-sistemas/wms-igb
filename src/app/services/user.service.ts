import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { GLOBAL, IGBHeaders, CONTENT_TYPE_JSON } from './global';

@Injectable()
export class UserService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  public signIn(userToLogin, selectedCompany) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    let params = '{"username":"' + userToLogin.username + '","password":"' + userToLogin.password + '", "selectedCompany":"' + selectedCompany + '"}';
    return this._http.post(this.url + 'user/login', params, { headers: CONTENT_TYPE_JSON })
      .map(res => res.json());
  }

  public getItentity() {
    return JSON.parse(localStorage.getItem('igb.identity'));
  }

  public getWarehouseCode() {
    return JSON.parse(localStorage.getItem('igb.identity')).warehouseCode;
  }

  public listUsersByGroup(groupName) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.get(this.url + 'user/list/' + groupName, { headers: igbHeaders })
      .map(res => res.json());
  }

  private validateToken(igbHeaders) {
    return this._http.get(this.url + 'user/validate', { headers: igbHeaders }).map(res => res.json());
  }

  public validateUserAdmin(user) {
    let igbHeaders = new IGBHeaders().loadHeaders();

    return this._http.get(this.url + 'user/validate-user-admin/' + user, { headers: igbHeaders })
      .map(res => res.json());
  }
}
