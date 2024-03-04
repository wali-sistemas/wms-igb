import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { GLOBAL } from '../../services/global';

import { UserService } from '../../services/user.service';
import { TicketTIService } from '../../services/ticket-TI.service';
import { TicketTI, TicketTINotes } from '../../models/ticket-ti';
import { BinLocationService } from '../../services/bin-locations.service';

import 'rxjs/Rx'
/*import { ResupplyComponent } from '../resupply/resupply.component';
import { from } from 'rxjs/observable/from';
import { error } from 'selenium-webdriver';*/

declare var $: any;

@Component({
  templateUrl: './ticket-TI.component.html',
  styleUrls: ['./ticket-TI.component.css'],
  providers: [UserService, TicketTIService, BinLocationService]
})
export class TicketTIComponent implements OnInit {
  public identity;
  public urlShared: string = GLOBAL.urlShared;
  public msjNotes: string = '';
  public msjTicket: string = '';
  public notes: string = '';
  public asunt: string = '';
  public statusTicket: string = '';
  public selectedDepartament: string = '';
  public selectedPriority: string = '';
  public selectedAssigned: string = '';
  public newNotes: string = '';
  public attached: string = '';
  public empAdd: string = '';
  public companyName: string = '';
  public filter: string = '';
  public idTicket: number;
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
  public dateEnd: Date;
  public authorizeAddProyect: boolean;

  constructor(private _ticketTIService: TicketTIService, private _userService: UserService, private _router: Router, private _binLocationService: BinLocationService) {
    this.tickets = new Array<TicketTI>();
    this.ticketNotes = new Array<TicketTINotes>();
    this.ticketTypes = new Array<any>();
  }

  ngOnInit() {
    this.identity = this._userService.getItentity();
    if (this.identity === null) {
      this._router.navigate(['/']);
    } else {
      //TODO: Se valida sesion inactiva invocando este servicio
      this.validateInactiveSession();
    }
    //TODO: Se debe definir que usuarios pueden asignar y cambiar la prioridad.
    if (this.identity.username !== "rmoncada" && this.identity.username !== "jguisao" && this.identity.username !== "rzapata" && this.identity.username !== "jlondonoc" && this.identity.username !== "mjimenez") {
      this.authorizeAddProyect = false;
    } else {
      //Autorizados para crear proyectos y tickets.
      this.authorizeAddProyect = true;
    }
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

  private validateInactiveSession() {
    $('#modal_ticket_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });
    this._binLocationService.getBinAbs("01INVENTARIO").subscribe(
      response => {
        console.log(response);
        this.listTickets();
        $('#modal_ticket_process').modal('hide');
      },
      error => {
        $('#modal_ticket_process').modal('hide');
        console.error(error);
        this.redirectIfSessionInvalid(error);
      }
    );
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

  public createNoteTicket(idTicket: number) {
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
    $('#modal_new_ticket').modal('hide');
    $('#modal_ticket_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });

    if (this.asunt == null || this.asunt.length <= 0) {
      $('#modal_ticket_process').modal('hide');
      this.validAsunt = false;
      $('#txtAsunt').focus();
      $('#modal_new_ticket').modal('show');
    } else if (this.selectedIdTypeTicket == null) {
      $('#modal_ticket_process').modal('hide');
      this.validTypeTicket = false;
      $('#modal_new_ticket').modal('show');
    } else if (this.selectedDepartament == null || this.selectedDepartament.length <= 0) {
      $('#modal_ticket_process').modal('hide');
      this.validSelectDep = false;
      $('#modal_new_ticket').modal('show');
    } else if (this.selectedPriority == null || this.selectedPriority.length <= 0) {
      $('#modal_ticket_process').modal('hide');
      this.validSelectPri = false;
      $('#modal_new_ticket').modal('show');
    } else if (this.newNotes == null || this.newNotes.length <= 0) {
      $('#modal_ticket_process').modal('hide');
      this.validNewNotes = false;
      $('#modal_new_ticket').modal('show');
    }

    const ticketDTO: TicketTI = new TicketTI();
    ticketDTO.asunt = this.asunt;
    ticketDTO.idTypeTicket = this.selectedIdTypeTicket;
    ticketDTO.department = this.selectedDepartament;
    ticketDTO.priority = this.selectedPriority;
    ticketDTO.urlAttached = this.attached;
    ticketDTO.empAdd = this.identity.username;
    ticketDTO.company = this.identity.selectedCompany;
    ticketDTO.type = 'TICKET';

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
                  $('#modal_ticket_process').modal('hide');
                }
              },
              error => {
                $('#modal_ticket_process').modal('hide');
                console.error(error);
              }
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
  }

  public createNewProyect() {
    $('#modal_new_proyect').modal('hide');
    $('#modal_ticket_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });

    if (this.asunt == null || this.asunt.length <= 0) {
      $('#modal_ticket_process').modal('hide');
      this.validAsunt = false;
      $('#txtAsunt').focus();
      $('#modal_new_proyect').modal('show');
    } else if (this.selectedDepartament == null || this.selectedDepartament.length <= 0) {
      $('#modal_ticket_process').modal('hide');
      this.validSelectDep = false;
      $('#modal_new_proyect').modal('show');
    } else if (this.selectedPriority == null || this.selectedPriority.length <= 0) {
      $('#modal_ticket_process').modal('hide');
      this.validSelectPri = false;
      $('#modal_new_proyect').modal('show');
    } else if (this.newNotes == null || this.newNotes.length <= 0) {
      $('#modal_ticket_process').modal('hide');
      this.validNewNotes = false;
      $('#modal_new_proyect').modal('show');
    }

    const ticketDTO: TicketTI = new TicketTI();
    ticketDTO.asunt = this.asunt;
    ticketDTO.idTypeTicket = 10;
    ticketDTO.department = this.selectedDepartament;
    ticketDTO.priority = this.selectedPriority;
    ticketDTO.urlAttached = this.attached;
    ticketDTO.empAdd = this.identity.username;
    ticketDTO.company = this.identity.selectedCompany;
    ticketDTO.type = 'PROYECTO';
    ticketDTO.dateEnd = this.dateEnd;

    this._ticketTIService.addNewTicket(ticketDTO, this.newNotes).subscribe(
      response => {
        if (response.code == 0) {
          this.idTicket = response.content;
          //Agregando comentario al proyecto
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
  }

  public handleFileInput(event) {
    this.fileToUpload = <File>event.target.files[0];
    this.nameUpload = this.fileToUpload.name;
    this.sizeUpload = this.fileToUpload.size;
  }

  public selectTicket(ticketDTO: TicketTI = new TicketTI()) {
    if (!this.authorizeAddProyect) {
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

  public assignTicket(idTicket: number, selectedPriority: string) {
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

  public closeTicket(idTicket: number) {
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
          ticket.type.toLowerCase().includes(this.filter.toLowerCase()) ||
          ticket.priority.toLowerCase().includes(this.filter.toLowerCase()) ||
          ticket.idTicket.toString().includes(this.filter)) {
          this.tickets.push(ticket);
        }
      }
    } else {
      this.tickets = this.filteredTicket;
    }
  }

  public clearFrom() {
    this.asunt = '';
    this.selectedIdTypeTicket = null;
    this.selectedDepartament = '';
    this.selectedPriority = '';
    this.notes = '';
    this.attached = '';
    this.newNotes = '';
    this.validAsunt = true;
    this.validNewNotes = true;
    this.validNotes = true;
    this.validSelectDep = true;
    this.validSelectPri = true;
    this.validSelectedAssigned = true;
    this.validTypeTicket = true;
  }

  public getScrollTop() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }
}
