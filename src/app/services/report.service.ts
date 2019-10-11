import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, IGBHeaders, CONTENT_TYPE_JSON } from './global';

@Injectable()
export class ReportService {
    public url: string;

    constructor(private _http: Http) {
        this.url = GLOBAL.url;
    }

    public obtainReportsOrders() {
        let igbHeaders = new IGBHeaders().loadHeaders();
        return this._http.get(this.url + 'report/reports-orders', { headers: igbHeaders })
            .map(res => res.json());
    }

    public obtainReportsEmployeeAssigned() {
        let igbHeaders = new IGBHeaders().loadHeaders();
        return this._http.get(this.url + 'report/reports-employee-assigned', { headers: igbHeaders })
            .map(res => res.json());
    }

    public listPickingProgress() {
        let igbHeaders = new IGBHeaders().loadHeaders();
        return this._http.get(this.url + 'report/reports-picking-progress', { headers: igbHeaders })
            .map(res => res.json());
    }

    public listReportsOrdersClient() {
        let igbHeaders = new IGBHeaders().loadHeaders();
        return this._http.get(this.url + 'report/reports-orders-client', { headers: igbHeaders })
            .map(res => res.json());
    }

    public generateReport(printReportDTO) {
        let igbHeaders = new IGBHeaders().loadHeaders();
        return this._http.post(this.url + 'report/generate-report', printReportDTO, { headers: igbHeaders })
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

    public getStatesOrder(companyName: string, testing: boolean) {
        let igbHeaders = new Headers({
            'Content-Type': 'application/json',
            'X-Company-Name': companyName,
            'X-Pruebas': testing
        });
        return this._http.get(this.url + 'report/states-order', { headers: igbHeaders })
            .map(res => res.json());
    }
}