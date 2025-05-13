import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GLOBAL } from '../../services/global';

import { UserService } from '../../services/user.service';
import { TicketTIService } from '../../services/ticket-TI.service';
import { TicketTI, TicketTINotes } from '../../models/ticket-ti';
import { BinLocationService } from '../../services/bin-locations.service';
import { OpenAIService } from '../../services/openai.service';

import 'rxjs/Rx'

declare var $: any;
declare var MediaRecorder: any;

@Component({
  templateUrl: './ticket-TI.component.html',
  styleUrls: ['./ticket-TI.component.css'],
  providers: [UserService, TicketTIService, BinLocationService, OpenAIService]
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
  //Variables OPEN IA
  public isRecording = false;
  public statusMessage = 'Presiona el botón para hablar';
  public transcribedText: string = '';
  public mediaRecorder: any;
  public transcript: string = '';
  public audioChunks: any[] = [];
  public email: string;
  public ticketSuggestion: string = '';
  public apiKey: string = "";
  public showVoicePanel: boolean;

  constructor(private _ticketTIService: TicketTIService, private _userService: UserService, private _router: Router, private _binLocationService: BinLocationService, private _openAIService: OpenAIService) {
    this.tickets = new Array<TicketTI>();
    this.ticketNotes = new Array<TicketTINotes>();
    this.ticketTypes = new Array<any>();
  }

  ngOnInit() {
    this.identity = this._userService.getItentity();
    this.email = this.identity.email;
    if (this.identity === null) {
      this._router.navigate(['/']);
    } else {
      //TODO: Se valida sesion inactiva invocando este servicio
      this.validateInactiveSession();
    }
    //TODO: Se debe definir que usuarios pueden asignar y cambiar la prioridad.
    if (this.identity.username !== "rmoncada" && this.identity.username !== "jguisao" && this.identity.username !== "rzapata" && this.identity.username !== "jlondonoc" && this.identity.username != "cperez") {
      this.authorizeAddProyect = false;
    } else {
      //Autorizados para crear proyectos y tickets.
      this.authorizeAddProyect = true;
    }

    this._openAIService.getApikeyOpenAI().subscribe(
      response => {
        this.apiKey = response.content;
      }, error => { console.error(error); }
    );

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
    this.transcribedText = '';
    this.validAsunt = true;
    this.validNewNotes = true;
    this.validNotes = true;
    this.validSelectDep = true;
    this.validSelectPri = true;
    this.validSelectedAssigned = true;
    this.validTypeTicket = true;
    this.clearTranscript();
  }

  public getScrollTop() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }

  //Sesión IA
  public ticket = {
    asunt: '',
    type: '',
    department: '',
    priority: '',
    comment: ''
  };

  public startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('🎤 Tu navegador no soporta grabación de voz.');
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder.start();
      this.isRecording = true;
      this.statusMessage = '🎙 Grabando...';

      this.mediaRecorder.addEventListener('dataavailable', event => {
        this.audioChunks.push(event.data);
      });

      this.mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        this.transcribeAudio(audioBlob);
      });
    }).catch(
      error => {
        alert('Error al acceder al micrófono');
        console.error('🎙️ Error al acceder al micrófono:', error);
      }
    );
  }

  public stopRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.statusMessage = '⏳ Procesando voz...';
    }
  }

  public cancelRecording() {
    this.audioChunks = [];
    this.transcript = '';
    this.isRecording = false;
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }
    this.statusMessage = '❌ Grabación cancelada';
  }

  private async transcribeAudio(audioBlob: Blob): Promise<void> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'whisper-1');
    formData.append('language', 'es');

    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + this.apiKey },
        body: formData
      });

      if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);

      const data = await response.json();
      this.transcript = data.text;
      this.transcribedText = data.text;
      this.statusMessage = 'Voz procesada correctamente';

      await this.interpretWithAI(data.text);
    } catch (error) {
      this.statusMessage = '❌ Error al procesar voz';
    }
  }

  private async interpretWithAI(text: string): Promise<void> {
    const prompt = `
    Actúa como un asistente experto en soporte técnico. Dado el siguiente mensaje de voz transcrito y el correo electrónico del usuario, necesito que clasifiques y devuelvas la siguiente información en un objeto JSON:

    1. "asunto": Un resumen breve del problema (máximo 10 palabras).
    2. "type": El ID numérico del tipo de ticket según esta lista:
      1 - SOPORTE SAP
      2 - SOPORTE TÉCNICO
      3 - CORREO
      4 - HARDWARE
      5 - SITIO WEB
      6 - WALI
      7 - IMPRESORA
      8 - PEDBOX
      9 - ECOMMERCE
      10 - OTRO
    3. "department": El departamento al que pertenece el usuario según el prefijo de su correo. Usa esta lista:
      ADMINISTRATIVA, BODEGA, COMEX, CONTABILIDAD, CARTERA, COMERCIAL, COMPRAS, FACTURACION, GERENCIA, LOGISTICA, MERCADEO, MOTOREPUESTOS, TESORERIA, TELEMERCADEO, TALENTO HUMANO, RECEPCION, REDPLAS, SISTEMAS.
    4. "priority": BAJA,MEDIA O ALTA SEGÚN LO CONSIDERES
    5. "comment": Todo el contenido del mensaje original.
    6. "suggestion": Una sugerencia breve para el usuario antes de abrir el ticket, basada en el problema descrito. (máximo 30 palabras).

    Responde únicamente con un objeto JSON válido. No expliques nada más.

    Ejemplo esperado:
    {
      "asunto": "No funciona SAP en bodega",
      "type": 1,
      "department": "BODEGA",
      "priority": "MEDIA",
      "comment": "Texto completo del mensaje...",
      "suggestion": "Reinicie su equipo y vuelva a intentar ingresar a SAP."
    }

    Mensaje transcrito: """${text}"""
    Correo del usuario: """${this.email}"""
    `;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2
        })
      });

      const data = await response.json();
      const aiResponse = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

      if (aiResponse) {
        const parsed = JSON.parse(aiResponse);
        this.ticket = parsed;
      } else {
        throw new Error('La respuesta de la IA está vacía o mal estructurada');
      }

      const parsed = JSON.parse(aiResponse);

      this.asunt = parsed.asunto || text;
      this.selectedIdTypeTicket = parsed.type || text;
      this.selectedDepartament = parsed.department || text;
      this.selectedPriority = parsed.priority || text;
      this.newNotes = parsed.comment || text;
      this.ticketSuggestion = parsed.suggestion;
    } catch (error) {
      console.error('❌ Error al interpretar con GPT-4:', error);
    }
  }

  public clearTranscript() {
    this.transcript = '';
    this.transcribedText = '';
    this.asunt = '';
    this.selectedIdTypeTicket = null;
    this.selectedDepartament = '';
    this.selectedPriority = '';
    this.newNotes = '';
    this.statusMessage = 'Presiona el botón para hablar';
    this.ticketSuggestion = '';
  }
}
