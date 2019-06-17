import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { GLOBAL } from '../../../services/global';

import { UserService } from '../../../services/user.service';
import { PrintService } from '../../../services/print.service';

import 'rxjs/Rx'
import { ResupplyComponent } from '../../resupply/resupply.component';
import { PackingDetail } from 'app/models/packing-detail';
import { PackingCheckOut } from 'app/models/packing-check-out';
import { Printer } from 'app/models/printer';

import { PackingService } from '../../../services/packing.service';
import { from } from 'rxjs/observable/from';


declare var $: any;

@Component({
    templateUrl: './check-out.component.html',
    styleUrls: ['./check-out.component.css'],
    providers: [PackingService, UserService, PrintService]
})
export class CheckOutComponent implements OnInit {

    public urlShared: string = GLOBAL.urlShared;
    public identity;

    public qtyEdit: number;
    public newBox: number;
    public delivery: string;
    public itemCode: string;
    public exitMessage: string;
    public errorMessage: string;
    public selectedPrinter: string;
    public existCheckOut: boolean = false;
    public checkOutDTO: PackingCheckOut;
    public detailDelivery: Array<PackingDetail>;
    public listScaners: Array<PackingDetail>;
    public printersList: Array<Printer>;

    constructor(private _packingService: PackingService, private _router: Router, private _userService: UserService, private _printerService: PrintService) {
        this.start();
    }

    ngOnInit() {
        this.identity = this._userService.getItentity();
        if (this.identity === null) {
            this._router.navigate(['/']);
        }
        $('#delivery').focus();
        //TODO: bloqueo de actualizacion de pagina.
        window.onbeforeunload = function() {
            return "¿Desea recargar la página web?";
        };
    }

    private start() {
        this.detailDelivery = new Array<PackingDetail>();
        this.listScaners = new Array<PackingDetail>();
        this.newBox = 1;
        this.exitMessage = '';
        this.errorMessage = '';
        this.selectedPrinter = '';
    }

    private compareDifferences() {
        for (let i = 0; i < this.detailDelivery.length; i++) {
            for (let j = 0; j < this.listScaners.length; j++) {
                if ((this.listScaners[j].item == this.detailDelivery[i].item) && (this.listScaners[j].qty == this.detailDelivery[i].qty)) {
                    this.detailDelivery[i].status = 'A';
                    break;
                } else if ((this.listScaners[j].item == this.detailDelivery[i].item) && (this.listScaners[j].qty > this.detailDelivery[i].qty)) {
                    this.detailDelivery[i].status = 'E';
                    break;
                } else {
                    this.detailDelivery[i].status = 'C';
                }
            }
        }
    }

    public getDetailDelivery() {
        if (this.identity === null) {
            this._router.navigate(['/']);
            return;
        }
        this.start();

        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        if (this.delivery != null || this.delivery.length > 0) {
            //TODO: validando si check-out existe en base de datos.
            this._packingService.findCheckOut(this.delivery).subscribe(
                response => {
                    if (response.code === 0) {
                        $('#modal_transfer_process').modal('hide');
                        this.errorMessage = 'Ya existe un check-out para la entrega #' + this.delivery;
                        return;
                    } else {
                        this._packingService.getDetailDelivery(this.delivery).subscribe(
                            response => {
                                if (response.length > 0) {
                                    for (let i = 0; i < response.length; i++) {
                                        const detail = new PackingDetail();
                                        detail.row = i + 1;
                                        detail.item = response[i].itemCode;
                                        detail.qty = response[i].quantity;
                                        detail.status = 'C';
                                        detail.orderNumber = response[i].orderNumber;
                                        this.detailDelivery.push(detail);
                                    }
                                    $('#modal_transfer_process').modal('hide');
                                    document.getElementById("item").style.display = "inline";
                                    $('#itemCode').focus();
                                }
                            },
                            error => {
                                $('#modal_transfer_process').modal('hide');
                                console.error('Ocurrio un error al consultar el detalle de la entrega', error);
                            }
                        );
                    }
                },
                error => {
                    $('#modal_transfer_process').modal('hide');
                    console.error('Ocurrio un error validando check-out', error);
                }
            );
        }
    }

    public validateItem() {
        let item;
        if (this.itemCode == null || this.itemCode.length <= 0) {
            return;
        } else {
            //TODO: Homologar item, codigo de barras errado Baterias.(igb #item)
            if (this.itemCode.trim().substr(0, 3) === "igb") {
                item = this.itemCode.trim().substr(3, this.itemCode.length)
            } else {
                item = this.itemCode.trim();
            }
            let aux = 0;
            for (let i = 0; i < this.detailDelivery.length; i++) {
                if (this.detailDelivery[i].item != item.trim().toUpperCase()) {
                    aux++;
                }
            }
            if (aux >= this.detailDelivery.length) {
                return;
            }
        }

        for (let i = 0; i < this.listScaners.length; i++) {
            if (this.listScaners[i].item == item.trim().toUpperCase()) {
                this.listScaners[i].qty++;
                this.itemCode = "";
                $('#itemCode').focus();
                this.compareDifferences();
                return;
            }
        }
        const newItem = {
            row: this.listScaners.length + 1,
            item: item.toUpperCase(),
            qty: 1,
            status: 'C',
            box: this.newBox,
            orderNumber: this.detailDelivery[0].orderNumber
        };
        this.listScaners.unshift(newItem);
        this.itemCode = "";
        $('#itemCode').focus();
        this.compareDifferences();
    }

    public reset() {
        this.start();
        document.getElementById("item").style.display = "none";
        this.delivery = "";
        $('#delivery').focus();
    }

    public openModalEditCant(item: string) {
        this.qtyEdit = null;
        this.itemCode = item;
        $('#modal_editar_cant').modal('show');
        $('#qtyEdit').focus();
    }

    public closedModal() {
        $('#modal_editar_cant').modal('hide');
        this.itemCode = "";
        $('#itemCode').focus();
    }

    public confirmCheckOut() {
        for (let i = 0; i < this.detailDelivery.length; i++) {
            for (let j = 0; j < this.listScaners.length; j++) {
                if (this.listScaners[j].item == this.detailDelivery[i].item) {
                    this.checkOutDTO = new PackingCheckOut(this.detailDelivery[i].orderNumber, +this.delivery, this.detailDelivery[i].item.trim(), this.detailDelivery[i].qty, this.listScaners[j].qty,
                        null, this.identity.username, null, this.listScaners[j].box, this.identity.selectedCompany);
                    break;
                } else {
                    this.checkOutDTO = new PackingCheckOut(this.detailDelivery[i].orderNumber, +this.delivery, this.detailDelivery[i].item.trim(), this.detailDelivery[i].qty, 0, null,
                        this.identity.username, null, 0, this.identity.selectedCompany);
                }
            }

            this._packingService.addCheckOutOrder(this.checkOutDTO).subscribe(
                response => {
                    if (response.code == 0) {
                        this.reset();
                        this._router.navigate(['/packing']);
                    }
                    $('#modal_transfer_process').modal('hide');
                },
                error => {
                    $('#modal_transfer_process').modal('hide');
                    console.error('Ocurrio un error al registrar el checkout', error);
                }
            );
        }
    }

    public editQtyItem(item: string) {
        for (let i = 0; i < this.listScaners.length; i++) {
            if (this.listScaners[i].item == item.trim().toUpperCase()) {
                if (this.qtyEdit <= 0) {
                    this.listScaners.splice(i, 1);
                }
                for (let j = 0; j < this.qtyEdit; j++) {
                    this.listScaners[i].qty = 0;
                    this.listScaners[i].qty = this.qtyEdit;
                }
            }
        }
        this.closedModal();
        this.itemCode = "";
        $('#itemCode').focus();
        this.compareDifferences();
    }

    public addNewBox() {
        this.newBox++;
        $('#modal_confirmar_newBox').modal('hide');
        $('#itemCode').focus();
    }

    public loadPrinters() {
        console.log('listando impresoras habilitadas...');
        this._printerService.listEnabledPrinters().subscribe(
            response => {
                if (response.code == 0) {
                    this.printersList = response.content;
                    $('#modal_printer_selection').modal('show');
                }
            }, error => { console.error(error); }
        );
    }

    public printOrder() {
        //$("#modal_printer_selection").modal('hide');
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        let box = this.listScaners[0].box;
        let orderNumber = this.listScaners[0].orderNumber;

        if (orderNumber == null || orderNumber <= 0 || box == null || box <= 0 || this.selectedPrinter == null || this.selectedPrinter.length <= 0) {
            //$("#reimprimir").modal('hide');
            $('#modal_transfer_process').modal('hide');
            this.errorMessage = 'Debe ingresar todos los datos obligatorios.'
        } else {
            let PrintDTO = {
                "orderNumber": orderNumber,
                "boxNumber": box,
                "printerName": this.selectedPrinter
            }
            this._printerService.reprintOrder(PrintDTO).subscribe(
                response => {
                    //$('#modal_transfer_process').modal('hide');
                    //$("#reimprimir").modal('hide');
                    this.confirmCheckOut();
                },
                error => {
                    $('#modal_transfer_process').modal('hide');
                    //$("#reimprimir").modal('hide');
                    this.errorMessage = "Lo sentimos. Se produjo un error interno."
                    console.error('Ocurrio un error imprimiendo etiquetas de empaque.', error);
                }
            );
        }
    }

    public getScrollTop() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }
}