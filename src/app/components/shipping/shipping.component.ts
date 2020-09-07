import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { GLOBAL } from '../../services/global';

import { UserService } from '../../services/user.service';
import { ShippingService } from '../../services/shipping.service';
import { ReportService } from '../../services/report.service';

import { ShippingInvoice } from '../../models/shipping-invoice';

import 'rxjs/Rx'
import { ResupplyComponent } from '../resupply/resupply.component';
import { from } from 'rxjs/observable/from';

declare var $: any;

@Component({
    templateUrl: './shipping.component.html',
    styleUrls: ['./shipping.component.css'],
    providers: [UserService, ShippingService, ReportService]
})
export class ShippingComponent implements OnInit {
    public identity;
    public urlShared: string = GLOBAL.urlShared;

    public warningMessage: string = '';
    public errorMessage: string = '';
    public selectedTransp: string = '';
    public selectInvoice: String = '';
    public filter: string = '';
    public idContainer: string = '';
    public docNumPayroll: string = '';
    public transportPayroll: string = '';
    public selectBox: number = 0;
    public fullShipping: boolean = false;
    public validQtyPack: boolean = false;
    public validPesoPack: boolean = false;
    public validValorDeclPack: boolean = false;
    public validAddressReceive: boolean = false;
    public validCityReceive: boolean = false;
    public validCommetPack: boolean = false;
    public invoicesShipping: Array<ShippingInvoice>;
    public selectedInvoices: Map<String, ShippingInvoice>;
    public transports: Array<any>;
    public transPayroll: Array<any>;
    public detailContainer: Array<any>;
    public listContainers: Array<String>;
    public selectInvoicesPack: Array<ShippingInvoice>;
    //Datos para crear guia
    public selectedTypePack: String = '';
    public qtyPack: number;
    public pesoPack: number = 25;
    public valorDeclPack: number = 20000;
    public addressReceive: String = '';
    public cityReceive: String = '';
    public commetPack: String = '';
    public idReceive: String = '';
    public nameReceive: String = '';

    constructor(private _userService: UserService, private _router: Router, private _shippingService: ShippingService, private _reportService: ReportService) {
        this.invoicesShipping = new Array<ShippingInvoice>();
        this.transports = new Array<any>();
        this.transPayroll = new Array<any>();
        this.listContainers = new Array<String>();
        this.selectInvoicesPack = new Array<ShippingInvoice>();
    }

    ngOnInit() {
        this.identity = this._userService.getItentity();
        if (this.identity === null) {
            this._router.navigate(['/']);
        }
        this.listInvoices();
        this.listTransport();
    }

    private redirectIfSessionInvalid(error) {
        if (error && error.status && error.status == 401) {
            localStorage.removeItem('igb.identity');
            localStorage.removeItem('igb.selectedCompany');
            this._router.navigate(['/']);
        }
    }

    public listInvoices() {
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        this.errorMessage = '';
        this.warningMessage = '';
        this.invoicesShipping = new Array<ShippingInvoice>();
        this.selectedInvoices = new Map<String, any>();

        //TODO: serie de facturación electronica sobrepasa la cantidad de caracteres 
        let invoice = this.filter.trim();
        if (this.filter.includes('-')) {
            if (this.identity.selectedCompany.includes('VARROC')) {
                invoice = this.filter.trim().substr(0, 5);
            } else {
                invoice = this.filter.trim().substr(0, 6);
            }
        }

        let InvoiceDTO = { 'transport': this.selectedTransp.length <= 0 ? "*" : this.selectedTransp, 'docNum': invoice }

        this._shippingService.listInvoiceShipping(InvoiceDTO).subscribe(
            response => {
                if (response.code == 0) {
                    this.invoicesShipping = response.content;
                    if (this.invoicesShipping.length <= 0) {
                        this.warningMessage = 'No se encontraron facturas para despachar.';
                    }
                    $('#modal_transfer_process').modal('hide');
                    $('#filter').focus();
                } else {
                    $('#modal_transfer_process').modal('hide');
                    $('#filter').focus();
                    this.warningMessage = response.content;
                }
            },
            error => {
                $('#modal_transfer_process').modal('hide');
                console.error('Ocurrio un error al listar las facturas para shipping.', error);
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    public selectShippingInvoice(invoice: ShippingInvoice) {
        if (this.selectedInvoices.has(invoice.docNum)) {
            this.selectedInvoices.delete(invoice.docNum);
            this.selectInvoicesPack.splice(this.selectedInvoices.size, 1);
        } else {
            if (this.selectInvoicesPack.length <= 0) {
                //Agreguelo a la creación de guia
                this.selectedInvoices.set(invoice.docNum, invoice);
                this.selectInvoicesPack.push(invoice);
            } else {
                //valide si son misma transportadora para agregar a la creación de guia
                for (let i = 0; i < this.selectInvoicesPack.length; i++) {
                    if (this.selectInvoicesPack[i].transport === invoice.transport) {
                        this.selectedInvoices.set(invoice.docNum, invoice);
                        this.selectInvoicesPack.push(invoice);
                        return;
                    }
                }
            }
        }
    }

    public listTransport() {
        this.transports = new Array<any>();
        this._shippingService.listTransport().subscribe(
            response => {
                if (response.code == 0) {
                    this.transports = response.content;
                }
            },
            error => {
                console.error('Ocurrio un error listando las transportadoras.', error);
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    public addShipping() {
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        let ShippingDTO = { 'invoice_number': this.selectInvoice, 'box_sum_shipping': this.selectBox }

        this._shippingService.addShipping(ShippingDTO).subscribe(
            response => {
                if (response.code < 0) {
                    this.warningMessage = response.content;
                }
                $('#close_confirmation').modal('hide');
                this.listInvoices();
                this.clean();
            },
            error => {
                console.error("Ocurrio un error al crear el shipping.", error);
                $('#modal_transfer_process').modal('hide');
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    public openInvoice(invoice: string, box: number) {
        this.selectInvoice = invoice;
        this.selectBox = box;
        $('#modal_select_invoice').modal('show');
        $('#idContainer').focus();
    }

    public addContainer() {
        this.errorMessage = '';
        //TODO: serie de facturación electronica sobrepasa la cantidad de caracteres 
        let invoice;
        let caracteres;

        if (this.identity.selectedCompany.includes('VARROC')) {
            invoice = this.idContainer.trim().substr(0, 5);
            caracteres = 9;
        } else {
            invoice = this.idContainer.trim().substr(0, 6);
            caracteres = 10;
        }

        if (this.selectInvoice === invoice) {
            for (let i = 0; i < this.listContainers.length; i++) {
                if (this.listContainers[i] === this.idContainer.trim()) {
                    this.errorMessage = 'Código de caja ya escaneado.';
                    return;
                }
            }

            if (this.idContainer.trim().length < caracteres || this.idContainer.trim().length >= caracteres + 1) {
                this.errorMessage = 'Código de caja errado.';
                return;
            }

            this.listContainers.push(this.idContainer.trim());
            this.idContainer = '';

            if (this.listContainers.length === this.selectBox) {
                this.fullShipping = true;
            }
        } else {
            this.errorMessage = 'Código de caja no corresponde al # de factura seleccionada.';
        }
    }

    public deleteContainer(idContainer: string) {
        this.errorMessage = '';
        for (let i = 0; i < this.listContainers.length; i++) {
            if (this.listContainers[i] === idContainer) {
                this.listContainers.splice(i, 1);
                break;
            }
        }

        if (this.listContainers.length === this.selectBox) {
            this.fullShipping = true;
        } else {
            this.fullShipping = false;
        }
        $('#idContainer').focus();
    }

    public listDetailContainer(container: string) {
        this.errorMessage = '';
        this.idContainer = container;
        let pullContainer = container.split("-");
        this._shippingService.listDetailContainer(pullContainer[0], +pullContainer[1]).subscribe(
            response => {
                if (response.code == 0) {
                    this.detailContainer = response.content;
                    $('#modal_detail_container').modal('show');
                } else {
                    this.errorMessage = 'No encontro registro de check-out.'
                    this.idContainer = '';
                }
            },
            error => {
                console.error("Ocurrio un error listando el detalle del contenedor.", error);
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    public generatePayroll() {
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        if (this.docNumPayroll.length > 0 || this.transportPayroll.length > 0) {
            let printReportDTO = {
                "id": this.docNumPayroll, "copias": 0, "documento": "shipping", "companyName": this.identity.selectedCompany, "origen": 'W', "imprimir": false, "filtro": this.transportPayroll
            }
            this._reportService.generateReport(printReportDTO).subscribe(
                response => {
                    if (response.code == 0) {
                        let landingUrl = this.urlShared + this.identity.selectedCompany + "/" + printReportDTO.documento + "/payroll/" + printReportDTO.id + ".pdf";
                        window.open(landingUrl);
                    }
                    $('#modal_transfer_process').modal('hide');
                },
                error => {
                    console.error('Ocurrio un error al generar la planilla de transporte.', error);
                    this.redirectIfSessionInvalid(error);
                    $('#modal_transfer_process').modal('hide');
                }
            );
        }
        this.clean();
    }

    public openModalPayroll() {
        this.transPayroll = new Array<any>();
        this._shippingService.listTransPayroll().subscribe(
            response => {
                if (response.code == 0) {
                    this.transPayroll = response.content;
                }
            },
            error => {
                console.error("Ocurrio un error listando las transportadoras planilladas.", error);
                this.redirectIfSessionInvalid(error);
            }
        );
        $('#modal_select_planilla').modal('show');
        $('#docNumPayroll').focus();
    }

    public clean() {
        this.listContainers = new Array<string>();
        this.transportPayroll = '';
        this.docNumPayroll = '';
        this.selectBox = 0;
        this.selectInvoice = '';
        this.selectedTransp = '';
        this.idContainer = '';
        this.warningMessage = '';
        this.errorMessage = '';
        this.fullShipping = false;
    }

    public setIdContainer() {
        this.idContainer = '';
    }

    public getModalGuia() {
        for (let i = 0; i < this.selectInvoicesPack.length; i++) {
            this.addressReceive = this.selectInvoicesPack[i].street;
            this.cityReceive = this.selectInvoicesPack[i].city + "-" + this.selectInvoicesPack[i].depart + "-" + this.selectInvoicesPack[i].codCity + "000";
            this.idReceive = this.selectInvoicesPack[i].cardCode;
            this.nameReceive = this.selectInvoicesPack[i].cardName;
            if (this.selectInvoicesPack.length == 1) {
                this.selectInvoice = this.selectInvoicesPack[i].docNum;
            }
            break;
        }
        $('#modal_crear_guia').modal('show');
    }

    public generateGuia() {
        if (this.selectInvoicesPack.length > 1) {
            for (let i = 0; i < this.selectInvoicesPack.length; i++) {
                this.selectInvoice += this.selectInvoicesPack[i].docNum + ',';
            }
        }
        const apiSaferboDTO = {
            //Datos del Remitente
            "identificacionRemitente": "900011909",
            "nombreRemitente": "IGB MOTORCYCLE PARTS S.A.S",
            "telefonoRemitente": "4442025",
            "direccionRemitente": "CALLE 98 SUR # 48-225 BOD 114",
            "ciudadRemitente": "LA ESTRELLA-ANTIOQUIA-05380000",
            //Datos del Destinatario
            "codigoDestinatario": "",
            "identificacionDestinatario": this.idReceive,
            "nombreDestinatario": this.nameReceive,
            "telefonoDestinatario": "0",
            "direccionDestinatario": this.addressReceive,
            "ciudadDestinatario": this.cityReceive,
            //Datos guia
            "largo": "0",
            "peso": this.pesoPack,
            "ancho": "0",
            "alto": "0",
            "volumen": this.qtyPack,
            "valorDeclarado": this.valorDeclPack,
            "observacion": this.commetPack + '-Total en ' + this.selectedTypePack + ': ' + this.qtyPack + ' Factura(s): ' + this.selectInvoice,
            //Entorno pruebas
            "codigoCliente": "999997",
            //Estandar de SAFERBO
            "tipoEnvio": "1",
            "tipoLiquidacion": "1",
            "tipoNegociacion": "1",
            "tipoDato": "2",
            "tipoAcceso": "1",
            "tarifaXTrayecto": "2",
            "pagoContraentrega": "0",
            "dsUnidad": "0",
            "dsKilos": "0",
            "dsConsec": "0",
            "valorRecaudar": "125000",
            "arUnidades": "1-2",
            "facturas": this.selectInvoice
        }
        //console.log(apiSaferboDTO);

        console.log(this.selectInvoice);


        /*this._shippingService.createGuiaTransport(apiSaferboDTO).subscribe(
            response => {
                console.log(response);
            },
            error => {
                console.error(error);
            }
        );*/
    }

    public getScrollTop() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }
}