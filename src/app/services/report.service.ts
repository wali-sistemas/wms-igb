import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

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

    public obtainReportsEmployeeAssigned(groupName) {
        let igbHeaders = new IGBHeaders().loadHeaders();

        return this._http.get(this.url + 'report/reports-employee-assigned/' + groupName, { headers: igbHeaders })
            .map(res => res.json());
    }

    public listPickingProgress() {
        let igbHeaders = new IGBHeaders().loadHeaders();

        return this._http.get(this.url + 'report/reports-picking-progress', { headers: igbHeaders })
            .map(res => res.json());
    }
}
