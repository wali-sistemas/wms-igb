import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class EmployeeService {
  public urlManager: string;

  constructor(private _http: Http) {
    this.urlManager = GLOBAL.urlManager;
  }

  public listCustodyByEmployeeOrAsset(filtre: string) {
    return this._http.get(this.urlManager + 'employee/list-custody?filtre=' + filtre, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public findEmployee(cardCode: string) {
    return this._http.get(this.urlManager + 'employee/find-employee/' + cardCode, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public addOrRefrescEmployee(employeeDTO, bottonAction: string) {
    return this._http.post(this.urlManager + 'employee/add-refresh-employee?bottonAction=' + bottonAction, employeeDTO, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public listEmployeesActives() {
    return this._http.get(this.urlManager + 'employee/list-actives-employee', { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public findAsset(idAsset: string) {
    return this._http.get(this.urlManager + 'employee/find-asset/' + idAsset, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public addOrRefrescAsset(assetMasterDTO, bottonAction: string) {
    return this._http.post(this.urlManager + 'employee/add-refresh-asset?bottonAction=' + bottonAction, assetMasterDTO, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public validateEmployeeExistence(idEmployee: string, birthdate: string) {
    return this._http.get(this.urlManager + 'employee/validate-employee-existence?id=' + idEmployee + '&birthdate=' + birthdate, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }
}
