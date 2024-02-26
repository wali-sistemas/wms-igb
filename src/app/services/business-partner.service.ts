import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class BusinessPartnerService {
  public url: string;
  public urlmanager: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
    this.urlmanager = GLOBAL.urlManager
  }

  public listAdvisors() {
    return this._http.get(this.url + 'businesspartners/sales-person', { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public listDepartments() {
    return this._http.get(this.url + 'businesspartners/departamentos', { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  };

  public listMunicipalities() {
    return this._http.get(this.url + 'businesspartners/municipios', { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  };

  public createClient(clientData) {
    return this._http.post(this.urlmanager + 'pedbox/create-customer', clientData, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public searchClient(company: string, customer: string) {
    return this._http.get(this.urlmanager + 'pedbox/customer-data/' + company + '?cardcode=' + customer, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }
}
