import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { GLOBAL } from './global';

@Injectable()
export class UserService {
  public url: string;
  //public identity;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
  }

  signIn(userToLogin, selectedCompany) {
    let params = '{"username":"' + userToLogin.username + '","password":"' + userToLogin.password + '", "selectedCompany":"' + selectedCompany + '"}';
    const headers = new Headers({ 'Content-Type': 'application/json' });
    return this._http.post(this.url + 'user/login', params, { headers: headers })
      .map(res => res.json());
  }

  getItentity() {
    //this.identity = null;
    const identity = JSON.parse(localStorage.getItem('igb.identity'));
    if (typeof identity !== 'undefined') {
      //this.identity = identity;
    }
    return identity;
  }

  listUsersByGroup(groupName) {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    return this._http.get(this.url + 'user/list/' + groupName, { headers: headers })
      .map(res => res.json());
  }

}
