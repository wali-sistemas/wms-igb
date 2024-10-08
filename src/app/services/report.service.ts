import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, IGBHeaders, CONTENT_TYPE_JSON } from './global';

@Injectable()
export class ReportService {
  public url: string;
  public urlManager: string;
  public urlSpring: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.url;
    this.urlManager = GLOBAL.urlManager;
    this.urlSpring = GLOBAL.urlSpring;
  }

  public obtainReportsOrders(companyName: string, warehouseCode: string, testing: boolean) {
    let igbHeaders = new Headers({
      'Content-Type': 'application/json',
      'X-Company-Name': companyName,
      'X-Warehouse-Code': warehouseCode,
      'X-Pruebas': testing
    });
    return this._http.get(this.url + 'report/reports-orders', { headers: igbHeaders })
      .map(res => res.json());
  }

  public obtainReportsEmployeeAssigned() {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.get(this.url + 'report/reports-employee-assigned', { headers: igbHeaders })
      .map(res => res.json());
  }

  public generateReport(printReportDTO) {
    let igbHeaders = new IGBHeaders().loadHeaders();
    return this._http.post(this.url + 'report/generate-report', printReportDTO, { headers: igbHeaders })
      .map(res => res.json());
  }

  public generateReportManager(printReportDTO) {
    return this._http.post(this.urlManager + 'report/generate-report', printReportDTO)
      .map(res => res.json());
  }

  public getSalesAnnual(companyName: string, testing: boolean) {
    let igbHeaders = new Headers({
      'Content-Type': 'application/json',
      'X-Company-Name': companyName,
      'X-Pruebas': testing
    });
    return this._http.get(this.url + 'report/sales-annual', { headers: igbHeaders })
      .map(res => res.json());
  }

  public getSalesMonthly(companyName: string, testing: boolean) {
    let igbHeaders = new Headers({
      'Content-Type': 'application/json',
      'X-Company-Name': companyName,
      'X-Pruebas': testing
    });
    return this._http.get(this.url + 'report/sales-monthly', { headers: igbHeaders })
      .map(res => res.json());
  }

  public getSalesCollectMonthly(companyName: string, testing: boolean) {
    let igbHeaders = new Headers({
      'Content-Type': 'application/json',
      'X-Company-Name': companyName,
      'X-Pruebas': testing
    });
    return this._http.get(this.url + 'report/sales-collect-monthly', { headers: igbHeaders })
      .map(res => res.json());
  }

  public getSalesByCollect(companyName: string, testing: boolean) {
    let igbHeaders = new Headers({
      'Content-Type': 'application/json',
      'X-Company-Name': companyName,
      'X-Pruebas': testing
    });
    return this._http.get(this.url + 'report/sales-by-collect', { headers: igbHeaders })
      .map(res => res.json());
  }

  public getStatesOrder(companyName: string, testing: boolean) {
    let igbHeaders = new Headers({
      'Content-Type': 'application/json',
      'X-Company-Name': companyName,
      'X-Pruebas': testing
    });
    return this._http.get(this.url + 'report/states-order', { headers: igbHeaders })
      .map(res => res.json());
  }

  public listOrdersOfDay(companyName: string, testing: boolean) {
    let igbHeaders = new Headers({
      'Content-Type': 'application/json',
      'X-Company-Name': companyName,
      'X-Pruebas': testing
    });
    return this._http.get(this.url + 'report/orders-of-day', { headers: igbHeaders })
      .map(res => res.json());
  }

  public getPurchaseCost(companyName: string, testing: boolean) {
    let igbHeaders = new Headers({
      'Content-Type': 'application/json',
      'X-Company-Name': companyName,
      'X-Pruebas': testing
    });
    return this._http.get(this.url + 'report/comex/purchase-costo', { headers: igbHeaders })
      .map(res => res.json());
  }

  public getImportCost(companyName: string, testing: boolean) {
    let igbHeaders = new Headers({
      'Content-Type': 'application/json',
      'X-Company-Name': companyName,
      'X-Pruebas': testing
    });
    return this._http.get(this.url + 'report/comex/import-costo', { headers: igbHeaders })
      .map(res => res.json());
  }

  public getPurchaseFactor(year: number, month: string, companyName: string, testing: boolean) {
    let igbHeaders = new Headers({
      'Content-Type': 'application/json',
      'X-Company-Name': companyName,
      'X-Pruebas': testing
    });
    return this._http.get(this.url + 'report/comex/purchase-factor?year=' + year + '&month=' + month, { headers: igbHeaders })
      .map(res => res.json());
  }

  public getTrackingOrder(order: string, companyName: string, testing: boolean) {
    let igbHeaders = new Headers({
      'Content-Type': 'application/json',
      'X-Company-Name': companyName,
      'X-Pruebas': testing
    });
    return this._http.get(this.url + 'report/comex/tracking-order/' + order, { headers: igbHeaders })
      .map(res => res.json());
  }

  public getTimeOperation(year: number, month: string, companyName: string, testing: boolean) {
    let igbHeaders = new Headers({
      'Content-Type': 'application/json',
      'X-Company-Name': companyName,
      'X-Pruebas': testing
    });
    return this._http.get(this.url + 'report/comex/time-operation?year=' + year + '&month=' + month, { headers: igbHeaders })
      .map(res => res.json());
  }

  public getTimeLiquid(year: number, month: string, companyName: string, testing: boolean) {
    let igbHeaders = new Headers({
      'Content-Type': 'application/json',
      'X-Company-Name': companyName,
      'X-Pruebas': testing
    });
    return this._http.get(this.url + 'report/comex/time-liquid?year=' + year + '&month=' + month, { headers: igbHeaders })
      .map(res => res.json());
  }

  public getBooking(year: number, month: string, companyName: string, testing: boolean) {
    let igbHeaders = new Headers({
      'Content-Type': 'application/json',
      'X-Company-Name': companyName,
      'X-Pruebas': testing
    });
    return this._http.get(this.url + 'report/comex/booking?year=' + year + '&month=' + month, { headers: igbHeaders })
      .map(res => res.json());
  }

  public generateVacation(vacationData, companyName) {
    return this._http.post(this.urlSpring + 'reports/vacation?schema=' + companyName, vacationData, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public generatePaystub(paystubData, companyName) {
    return this._http.post(this.urlSpring + 'reports/paystub?schema=' + companyName, paystubData, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }
}
