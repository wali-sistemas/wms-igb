import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class TicketTIService {
    public urlManager: string;

    constructor(private _http: Http) {
        this.urlManager = GLOBAL.urlManager;
    }

    public ticketList() {
        return this._http.get(this.urlManager + 'ticket/list')
            .map(res => res.json());
    }
}