import { Component, OnInit } from '@angular/core';
import { EventService } from '../../../services/event.service';

declare var $: any;

@Component({
  templateUrl: './client-redplas.component.html',
  styleUrls: ['./client-redplas.component.css'],
  providers: [EventService]
})
export class ClientRedplasComponent implements OnInit {
  public identity;
  public contact: string;
  public whsName: string;
  public document: string;
  public selectedTipoCliente: string = "";
  public selectedAsesor: string = "";
  public city: string;
  public phone: string;
  public mail: string;
  public warningMessage: string;
  public exitMessage: string;
  public errorMessage: string;
  public selected: Map<number, string>;
  public validContact: boolean = true;
  public validPhone: boolean = true;
  public validDocument: boolean = true;
  public validMail: boolean = true;
  public validSelectedTipoCliente: boolean = true;
  public validSelectedAsesor: boolean = true;
  public authorizeData: boolean = false;

  constructor(private _eventService: EventService) {
    this.selected = new Map<number, string>();
  }

  ngOnInit() { }

  public selectedInteres(key: number, interes: string) {
    this.errorMessage = "";
    if (this.selected.has(key)) {
      this.selected.delete(key);
    } else {
      this.selected.set(key, interes);
    }
  }

  public captureClient() {
    this.errorMessage = "";
    this.exitMessage = "";
    let interes = "";

    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });

    if (this.contact == null || this.contact.length <= 0) {
      this.validContact = false;
      this.getScrollTop();
      $('#modal_transfer_process').modal('hide');
      return;
    }
    if (this.document == null || this.document.length <= 0) {
      this.validDocument = false;
      this.getScrollTop();
      $('#modal_transfer_process').modal('hide');
      return;
    }
    if (this.selectedTipoCliente == null || this.selectedTipoCliente.length <= 0) {
      this.validSelectedTipoCliente = false;
      this.getScrollTop();
      $('#modal_transfer_process').modal('hide');
      return;
    }
    if (this.phone == null || this.phone.length <= 0) {
      this.validPhone = false;
      this.getScrollTop();
      $('#modal_transfer_process').modal('hide');
      return;
    }
    if (this.mail == null || this.mail.length <= 0) {
      this.validMail = false;
      this.getScrollTop();
      $('#modal_transfer_process').modal('hide');
      return;
    }
    if (this.selectedAsesor == null || this.selectedAsesor.length <= 0) {
      this.validSelectedAsesor = false;
      this.getScrollTop();
      $('#modal_transfer_process').modal('hide');
      return;
    }

    for (let key of Array.from(this.selected.keys())) {
      interes += this.selected.get(key) + " ";
    }
    if (interes.length <= 0) {
      this.errorMessage = "Seleccione un interes.";
      this.getScrollTop();
      $('#modal_transfer_process').modal('hide');
      return;
    }

    let clientFeriaDTO = {
      "documento": this.document,
      "nombreCompleto": this.contact.toUpperCase(),
      "telefono": this.phone,
      "correo": this.mail.toUpperCase(),
      "almacen": this.whsName,
      "interes": interes.trim(),
      "regional": this.selectedTipoCliente,
      "ciudad": this.city,
      "companyName": "REDPLAS",
      "asesor": this.selectedAsesor
    }

    this._eventService.captureClient(clientFeriaDTO).subscribe(
      response => {
        if (response.code === 0) {
          this.clearForm();
          this.exitMessage = response.content;
        } else {
          this.errorMessage = response.content;
        }
        this.getScrollTop();
        $('#modal_transfer_process').modal('hide');
      },
      error => {
        console.error('Ocurrio un error capturando los datos', error);
        this.getScrollTop();
        this.errorMessage = "Lo sentimos. Se produjo un error interno.";
        $('#modal_transfer_process').modal('hide');
      }
    );
  }

  public getData() {
    this.errorMessage = "";
    this.exitMessage = "";
  }

  public clearForm() {
    this.document = "";
    this.contact = "";
    this.phone = "";
    this.mail = "";
    this.whsName = "";
    this.selectedTipoCliente = "";
    this.authorizeData = false;
    this.selected = new Map<number, string>();
    this.errorMessage = "";
    this.exitMessage = "";
    this.city = "";
  }

  public getScrollTop() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }
}
