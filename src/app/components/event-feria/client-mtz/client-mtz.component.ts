import { Component, OnInit } from '@angular/core';
import { User } from '../../../models/user.model';
import { EventService } from '../../../services/event.service';

declare var $: any;

@Component({
    templateUrl: './client-mtz.component.html',
    styleUrls: ['./client-mtz.component.css'],
    providers: [EventService]
})
export class ClientMtzComponent implements OnInit {
    public identity;
    public contact: string;
    public whsName: string;
    public document: string;
    public selectedRegion: string = "";
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
    public validSelectRegion: boolean = true;
    public authorizeData: boolean = false;

    constructor(private _eventService: EventService) {
        this.selected = new Map<number, string>();
    }

    ngOnInit() { }

    public selectedInteres(key: number, interes: string) {
        this.errorMessage = "";
        console.log('Selecciono el interes: ' + interes);
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
        if (this.selectedRegion == null || this.selectedRegion.length <= 0) {
            this.validSelectRegion = false;
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
            "almacen": this.whsName.toUpperCase(),
            "interes": interes.trim(),
            "regional": this.selectedRegion,
            "ciudad": this.city,
            "companyName": "VARROC"
        }
        console.log(clientFeriaDTO);

        this._eventService.captureClient(clientFeriaDTO).subscribe(
            response => {
                console.log(response);
                if (response.code === 0) {
                    this.clearForm();
                    this.exitMessage = response.content;
                } else {
                    this.errorMessage = response.content + "[" + this.document + "]."
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
        console.log('Autoriza el habeas data', this.authorizeData);
    }

    public clearForm() {
        this.document = "";
        this.contact = "";
        this.phone = "";
        this.mail = "";
        this.whsName = "";
        this.selectedRegion = "";
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