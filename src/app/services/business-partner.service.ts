import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class BusinessPartnerService {
  public url: string;
  public urlmanager: string;
  public urlSpring: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
    this.urlmanager = GLOBAL.urlManager;
    this.urlSpring = GLOBAL.urlSpring;
  }

  public listAdvisors(email: string) {
    return this._http.get(email != '*' ? this.url + 'businesspartners/sales-person?email=' + email : this.url + 'businesspartners/sales-person/', { headers: new IGBHeaders().loadHeaders() })
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

  public listDailyMarks(selectedCompany: string) {
    return this._http.get(this.urlmanager + 'app/list-activity-report/' + selectedCompany, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public createClient(clientData) {
    return this._http.post(this.urlmanager + 'pedbox/create-customer', clientData, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public createClientPn(clientData) {
    return this._http.post(this.urlmanager + 'motorepuesto/create-customer', clientData, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public searchClient(company: string, customer: string) {
    return this._http.get(this.urlmanager + 'pedbox/customer-data/' + company + '?cardcode=' + customer, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public getGeoLocation(selectedCompany: string, selectedAdvisor: string, year: string, month: string, day: string) {
    return this._http.get(this.urlmanager + 'app/get-geo-location/' + selectedCompany + '?slpcode=' + selectedAdvisor + '&year=' + year + '&month=' + month + '&day=' + day, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public getGeoLocationSalesData(selectedCompany: string, year: string, month: string, day: string, selectedAdvisor: string) {
    return this._http.get(this.urlSpring + 'location/salesData?schema=' + selectedCompany + '&date=' + year + '/' + month + '/' + day + '&advisor=' + selectedAdvisor, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }
}
