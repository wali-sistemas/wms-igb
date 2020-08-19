import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';
import { TicketTINotes, TicketTI } from 'app/models/ticket-ti';

@Injectable()
export class TicketTIService {
    public urlManager: string;

    constructor(private _http: Http) {
        this.urlManager = GLOBAL.urlManager;
    }

    public listTicket(empId: string) {
        return this._http.get(this.urlManager + 'ticket/list/' + empId)
            .map(res => res.json());
    }

    public listNotesTicket(idTicket: Number) {
        return this._http.get(this.urlManager + 'ticket/notes/' + idTicket)
            .map(res => res.json());
    }

    public listTypeTickets() {
        return this._http.get(this.urlManager + 'ticket/type-tickets')
            .map(res => res.json());
    }

    public addNoteTicket(ticketNotesDTO: TicketTINotes) {
        return this._http.post(this.urlManager + 'ticket/add-note', ticketNotesDTO)
            .map(res => res.json());
    }

    public addNewTicket(ticketDTO: TicketTI, newNotes: String) {
        return this._http.post(this.urlManager + 'ticket/add-new-ticket?newNote=' + newNotes, ticketDTO)
            .map(res => res.json());
    }

    public assignedTicket(ticketDTO: TicketTI, username: String) {
        return this._http.post(this.urlManager + 'ticket/assign-ticket?username=' + username, ticketDTO)
            .map(res => res.json());
    }

    public changeStatusTicket(ticketDTO: TicketTI) {
        return this._http.post(this.urlManager + 'ticket/update-status-ticket', ticketDTO)
            .map(res => res.json());
    }
}