import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { GLOBAL, IGBHeaders, CONTENT_TYPE_JSON } from './global';

@Injectable()
export class UserService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  public signIn(userToLogin: any, selectedCompany: string) {
    const params = '{"username":"' + userToLogin.username + '","password":"' + userToLogin.password + '", "selectedCompany":"' + selectedCompany + '"}';
    return this._http.post(this.url + 'user/login', params, { headers: CONTENT_TYPE_JSON })
      .map(res => res.json());
  }

  public getItentity() {
    const identity = localStorage.getItem('igb.identity');
    return identity ? JSON.parse(identity) : null;
  }

  public getWarehouseCode() {
    const identity = localStorage.getItem('igb.identity');
    return identity ? JSON.parse(identity).warehouseCode : null;
  }

  public listUsersByGroup(groupName: string) {
    return this._http.get(this.url + 'user/list/' + groupName, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  /*private validateToken(igbHeaders: IGBHeaders) {
    return this._http.get(this.url + 'user/validate', { headers: igbHeaders }).map(res => res.json());
  }*/

  public validateUserAdmin(user: string) {
    return this._http.get(this.url + 'user/validate-user-admin/' + user, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public canAccess(user: string, module: string) {
    return this._http.get(this.url + 'user/access/' + user + '/' + module, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public listUsers() {
    return this._http.get(this.url + "user/list-wali", { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public createUserWali(user: any) {
    return this._http.post(this.url + "user/create-wali", JSON.stringify(user), { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public updateUserWali(user: any) {
    return this._http.put(this.url + 'user/update-wali', JSON.stringify(user), { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }
}
