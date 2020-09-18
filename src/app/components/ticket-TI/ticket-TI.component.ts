import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { GLOBAL } from '../../services/global';

import { UserService } from '../../services/user.service';
import { TicketTIService } from '../../services/ticket-TI.service';
import { TicketTI, TicketTINotes } from '../../models/ticket-ti';

import 'rxjs/Rx'
import { ResupplyComponent } from '../resupply/resupply.component';
import { from } from 'rxjs/observable/from';

declare var $: any;

@Component({
    templateUrl: './ticket-TI.component.html',
    styleUrls: ['./ticket-TI.component.css'],
    providers: [UserService, TicketTIService]
})
export class TicketTIComponent implements OnInit {
    public identity;
    public urlShared: String = GLOBAL.urlShared;
    public msjNotes: String = '';
    public msjTicket: String = '';
    public notes: String = '';
    public asunt: String = '';
    public statusTicket: String = '';
    public selectedDepartament: String = '';
    public selectedPriority: String = '';
    public selectedAssigned: String = '';
    public newNotes: String = '';
    public attached: String = '';
    public empAdd: String = '';
    public companyName: String = '';
    public filter: string = '';
    public idTicket: Number;
    public selectedIdTypeTicket: number = null;
    public validAsunt: boolean = true;
    public validTypeTicket: boolean = true;
    public validSelectDep: boolean = true;
    public validSelectPri: boolean = true;
    public validNewNotes: boolean = true;
    public validNotes: boolean = true;
    public validSelectedAssigned: boolean = true;
    public tickets: Array<TicketTI>;
    public filteredTicket: Array<TicketTI>;
    public ticketNotes: Array<TicketTINotes>;
    public ticketTypes: Array<any>;
    public fileToUpload: File;
    public nameUpload: string;
    public sizeUpload: number;

    constructor(private _ticketTIService: TicketTIService, private _userService: UserService, private _router: Router) {
        this.tickets = new Array<TicketTI>();
        this.ticketNotes = new Array<TicketTINotes>();
        this.ticketTypes = new Array<any>();
    }

    ngOnInit() {
        this.identity = this._userService.getItentity();
        if (this.identity === null) {
            this._router.navigate(['/']);
        }
        this.listTickets();
        this.listTypeTickets();
        $('#filter').focus();
    }

    private redirectIfSessionInvalid(error) {
        if (error && error.status && error.status == 401) {
            localStorage.removeItem('igb.identity');
            localStorage.removeItem('igb.selectedCompany');
            this._router.navigate(['/']);
        }
    }

    private listTickets() {
        this._ticketTIService.listTicket(this.identity.username).subscribe(
            response => {
                if (response.code < 0) {
                    this.msjTicket = response.content;
                } else {
                    this.tickets = response;
                    this.filteredTicket = this.tickets;
                }
                $('#modal_ticket_process').modal('hide');
            }, error => {
                $('#modal_ticket_process').modal('hide');
                console.error(error);
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    public listNotesTicket() {
        this.ticketNotes = new Array<TicketTINotes>();
        this.msjNotes = '';
        this.notes = '';
        this._ticketTIService.listNotesTicket(this.idTicket).subscribe(
            response => {
                this.ticketNotes = response;
                this.msjNotes = "No existe ninguna nota asociada para este ticket.";
            },
            error => {
                console.error(error);
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    public getTicketNotes(ticketDTO: TicketTI = new TicketTI()) {
        $('#modal_ticket_notes').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        this.idTicket = ticketDTO.idTicket;
        this.statusTicket = ticketDTO.status;  
           
        this.listNotesTicket();
    }

    public createNoteTicket(idTicket: Number) {
        if (this.notes == null || this.notes.length <= 0) {
            this.validNotes = false;
            $('#notes').focus();
            return;
        }

        $('#modal_ticket_notes').modal('hide');

        $('#modal_ticket_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        const ticketNotesDTO: TicketTINotes = new TicketTINotes();
        ticketNotesDTO.idTicket = idTicket;
        ticketNotesDTO.dateNote = null;
        ticketNotesDTO.empNote = this.identity.username;
        ticketNotesDTO.note = this.notes;

        this._ticketTIService.addNoteTicket(ticketNotesDTO).subscribe(
            response => {
                if (response.code >= 0) {
                    $('#modal_ticket_process').modal('hide');
                }
                this.notes = '';
            }, error => {
                console.error(error);
                $('#modal_ticket_process').modal('hide');
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    public createNewTicket() {
        if (this.asunt == null || this.asunt.length <= 0) {
            this.validAsunt = false;
            $('#txtAsunt').focus();
        } else if (this.selectedIdTypeTicket == null) {
            this.validTypeTicket = false;
        } else if (this.selectedDepartament == null || this.selectedDepartament.length <= 0) {
            this.validSelectDep = false;
        } else if (this.selectedPriority == null || this.selectedPriority.length <= 0) {
            this.validSelectPri = false;
        } else if (this.newNotes == null || this.newNotes.length <= 0) {
            this.validNewNotes = false;
        }

        $('#modal_new_ticket').modal('hide');

        $('#modal_ticket_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        const ticketDTO: TicketTI = new TicketTI();
        ticketDTO.asunt = this.asunt;
        ticketDTO.idTypeTicket = this.selectedIdTypeTicket;
        ticketDTO.department = this.selectedDepartament;
        ticketDTO.priority = this.selectedPriority;
        ticketDTO.urlAttached = this.attached;
        ticketDTO.empAdd = this.identity.username;
        ticketDTO.company = this.identity.selectedCompany;

        this._ticketTIService.addNewTicket(ticketDTO, this.newNotes).subscribe(
            response => {
                if (response.code == 0) {
                    this.idTicket = response.content;
                    //agregando adjunto
                    if (this.attached.length > 0) {
                        this._ticketTIService.addFile(this.nameUpload, this.sizeUpload, this.idTicket, this.fileToUpload).subscribe(
                            response => {
                                if (!response) {
                                    console.error("Lo sentimos. Se produjo un error interno.");
                                }
                            },
                            error => { console.error(error); }
                        );
                    }
                    //Agregando comentario al ticket
                    const ticketNotesDTO: TicketTINotes = new TicketTINotes();
                    ticketNotesDTO.idTicket = this.idTicket;
                    ticketNotesDTO.dateNote = null;
                    ticketNotesDTO.empNote = this.identity.username;
                    ticketNotesDTO.note = this.newNotes;

                    this._ticketTIService.addNoteTicket(ticketNotesDTO).subscribe(
                        response => {
                            if (response.code == 0) {
                                this.clearFrom();
                                this.listTickets();
                            }
                            $('#modal_ticket_process').modal('hide');
                        }, error => {
                            $('#modal_ticket_process').modal('hide');
                            console.error(error);
                        }
                    );
                }
            },
            error => {
                $('#modal_ticket_process').modal('hide');
                console.error(error);
                this.redirectIfSessionInvalid(error);
            }
        );

        this._ticketTIService.addFile(this.nameUpload, this.sizeUpload, this.idTicket, this.fileToUpload).subscribe(
            response => {
                if (!response) {
                    console.error("Lo sentimos. Se produjo un error interno.");
                }
            },
            error => { console.error(error); }
        );
    }

    public handleFileInput(event) {
        this.fileToUpload = <File>event.target.files[0];
        this.nameUpload = this.fileToUpload.name;
        this.sizeUpload = this.fileToUpload.size;
    }

    public selectTicket(ticketDTO: TicketTI = new TicketTI()) {
        //TODO: Se debe definir que usuarios pueden asignar y cambiar la prioridad.
        if (this.identity.username !== "jguisao" && this.identity.username !== "rzapata" && this.identity.username !== "pcolorado") {
            return;
        }
        $('#modal_assigned_ticket').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        this.selectedAssigned = '';
        this.selectedPriority = ticketDTO.priority;
        this.idTicket = ticketDTO.idTicket;
        this.asunt = ticketDTO.asunt;
        this.selectedDepartament = ticketDTO.department;
        this.empAdd = ticketDTO.empAdd;
        this.companyName = ticketDTO.company;
    }

    public assignTicket(idTicket: Number, selectedPriority: String) {
        if (this.selectedAssigned == null || this.selectedAssigned.length <= 0) {
            this.validSelectedAssigned = false;
            return;
        }

        const ticketDTO: TicketTI = new TicketTI();
        ticketDTO.idTicket = idTicket;
        ticketDTO.priority = selectedPriority;
        ticketDTO.empSet = this.selectedAssigned;
        ticketDTO.empAdd = this.empAdd;
        ticketDTO.company = this.companyName;
        ticketDTO.department = this.selectedDepartament;
        ticketDTO.asunt = this.asunt;

        $('#modal_assigned_ticket').modal('hide');

        $('#modal_ticket_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        this._ticketTIService.assignedTicket(ticketDTO, this.identity.username).subscribe(
            response => {
                if (response) {
                    this.listTickets();
                    $('#modal_ticket_process').modal('hide');
                } else {
                    $('#modal_assigned_ticket').modal({
                        backdrop: 'static',
                        keyboard: false,
                        show: true
                    });
                }
            }, error => {
                $('#modal_ticket_process').modal('hide');
                console.error(error)
            }
        );
    }

    public listTypeTickets() {
        this.ticketTypes = new Array<any>();
        this._ticketTIService.listTypeTickets().subscribe(
            response => {
                this.ticketTypes = response;
            }, error => { console.error(error) }
        );
    }

    public closedModalAssigned() {
        $('#modal_assigned_ticket').modal('hide');
    }

    public closeTicket(idTicket: Number) {
        if (this.notes == null || this.notes.length <= 0) {
            this.validNotes = false;
            $('#notes').focus();
            return;
        }

        $('#modal_ticket_notes').modal('hide');

        $('#modal_ticket_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        const ticketDTO: TicketTI = new TicketTI();
        for (let i = 0; i < this.tickets.length; i++) {
            if (this.tickets[i].idTicket == idTicket) {
                ticketDTO.idTicket = idTicket;
                ticketDTO.priority = this.tickets[i].priority;
                ticketDTO.empSet = this.tickets[i].empSet;
                ticketDTO.empAdd = this.tickets[i].empAdd;
                ticketDTO.company = this.tickets[i].company;
                ticketDTO.department = this.tickets[i].department;
                ticketDTO.asunt = this.tickets[i].asunt;
                ticketDTO.status = "CERRADO";
                break;
            }
        }

        this._ticketTIService.changeStatusTicket(ticketDTO, this.notes).subscribe(
            response => {
                if (response.code == 0) {
                    this.listTickets();
                }
                $('#modal_ticket_process').modal('hide');
                this.notes = '';
            },
            error => {
                console.error(error);
                $('#modal_ticket_process').modal('hide');
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    public canceledTicket() {
    }

    public filterTicket() {
        if (this.filter.length > 0) {
            this.tickets = new Array<TicketTI>();
            for (let i = 0; i < this.filteredTicket.length; i++) {
                const ticket = this.filteredTicket[i];
                if (ticket.empAdd.toLowerCase().includes(this.filter.toLowerCase()) ||
                    ticket.company.toLowerCase().includes(this.filter.toLowerCase()) ||
                    ticket.status.toLowerCase().includes(this.filter.toLowerCase()) ||
                    //ticket.empSet.toLowerCase().includes(this.filter.toLowerCase()) ||
                    ticket.priority.toLowerCase().includes(this.filter.toLowerCase()) ||
                    ticket.idTicket.toString().includes(this.filter)) {
                    this.tickets.push(ticket);
                }
            }
        } else {
            this.tickets = this.filteredTicket;
        }
    }

    private clearFrom() {
        this.asunt = '';
        this.selectedIdTypeTicket = null;
        this.selectedDepartament = '';
        this.selectedPriority = '';
        this.notes = '';
        this.attached = '';
        this.newNotes = '';
    }

    public getScrollTop() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }
}