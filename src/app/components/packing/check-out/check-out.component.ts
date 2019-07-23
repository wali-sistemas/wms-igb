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
import { ReportService } from '../../../services/report.service';
import { from } from 'rxjs/observable/from';


declare var $: any;

@Component({
    templateUrl: './check-out.component.html',
    styleUrls: ['./check-out.component.css'],
    providers: [PackingService, UserService, PrintService, ReportService]
})
export class CheckOutComponent implements OnInit {

    public urlShared: string = GLOBAL.urlShared;
    public identity;

    public qtyEdit: number;
    public newBox: number;
    public selectedBox: number;
    public orderNumber: string;
    public itemCode: string;
    public exitMessage: string;
    public errorMessage: string;
    public selectedPrinter: string;
    public existCheckOut: boolean = false;
    public checkOutDTO: PackingCheckOut;
    public detailDelivery: Array<PackingDetail>;
    public listScaners: Array<PackingDetail>;
    public printersList: Array<Printer>;
    //TODO: variables cronometro
    public minutes: number;
    public seconds: number;
    public isPaused: boolean;
    public buttonLabel: string;
    public disabledTime: boolean;
    public timerStart: number;

    constructor(private _packingService: PackingService, private _router: Router, private _userService: UserService, private _printerService: PrintService, private _reportService: ReportService) {
        this.start();
        //TODO: Inicializando cronometro
        this.resetTimer();
        setInterval(() => this.tick(), 1000);
        this.disabledTime = false;
    }

    ngOnInit() {
        this.identity = this._userService.getItentity();
        if (this.identity === null) {
            this._router.navigate(['/']);
        }
        $('#orderNumber').focus();
        //TODO: bloqueo de actualizacion de pagina.
        window.onbeforeunload = function () {
            return "¿Desea recargar la página web?";
        };
    }

    private tick() {
        if (!this.isPaused) {
            this.buttonLabel = 'Pause';

            if (--this.seconds < 0) {
                this.seconds = 59;
                if (--this.minutes < 0) {
                    //this.resetTimer();
                }
            }
        }
    }

    private redirectIfSessionInvalid(error) {
        if (error && error.status && error.status === 401) {
            localStorage.removeItem('igb.identity');
            localStorage.removeItem('igb.selectedCompany');
            this._router.navigate(['/']);
        }
    }

    private start() {
        this.detailDelivery = new Array<PackingDetail>();
        this.listScaners = new Array<PackingDetail>();
        this.newBox = 1;
        this.exitMessage = "";
        this.errorMessage = "";
        this.selectedPrinter = "";
    }

    private compareDifferences() {
        for (let i = 0; i < this.detailDelivery.length; i++) {
            let qtyAcumulada = 0;
            for (let j = 0; j < this.listScaners.length; j++) {
                if (this.listScaners[j].item.trim() == this.detailDelivery[i].item.trim()) {
                    qtyAcumulada += this.listScaners[j].qty;
                }

                if (this.listScaners[j].item.trim() == this.detailDelivery[i].item.trim() && qtyAcumulada == this.detailDelivery[i].qty) {
                    this.detailDelivery[i].status = 'A';
                    qtyAcumulada = 0;
                    break;
                }

                if (this.listScaners[j].item.trim() == this.detailDelivery[i].item.trim() && qtyAcumulada > this.detailDelivery[i].qty) {
                    this.detailDelivery[i].status = 'E';
                    qtyAcumulada = 0;
                    break;
                } else {
                    this.detailDelivery[i].status = 'C';
                }
            }

            if (this.listScaners.length <= 0) {
                this.detailDelivery[i].status = 'C';
                break;
            }
        }
    }

    //TODO: reset conometro
    public resetTimer() {
        this.isPaused = true;
        this.minutes = this.timerStart;
        this.seconds = 0;
        this.buttonLabel = 'Start';
        this.disabledTime = true;
        this.togglePause();
    }

    //TODO: Metodo cronometro
    public togglePause() {
        this.isPaused = !this.isPaused;
        if (this.minutes < 24 || this.seconds < 59) {
            this.buttonLabel = this.isPaused ? 'Resume' : 'Pause';
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

        if (this.orderNumber.trim() != null || this.orderNumber.trim().length > 0) {
            //TODO: validando si check-out existe en base de datos.
            this._packingService.findCheckOut(this.orderNumber.trim()).subscribe(
                response => {
                    if (response.code === 0) {
                        $('#modal_transfer_process').modal('hide');
                        this.errorMessage = 'Ya existe un check-out para la orden #' + this.orderNumber.trim();
                        return;
                    } else {
                        this._packingService.getDetailDelivery(this.orderNumber.trim()).subscribe(
                            response => {
                                if (response.code < 0) {
                                    this.errorMessage = response.content;
                                    $('#modal_transfer_process').modal('hide');
                                    return;
                                }

                                if (response.lines.length > 0) {
                                    for (let i = 0; i < response.lines.length; i++) {
                                        const detail = new PackingDetail();
                                        detail.row = i + 1;
                                        detail.item = response.lines[i].itemCode.trim();
                                        detail.qty = response.lines[i].quantity;
                                        detail.status = 'C';
                                        detail.box = null;
                                        detail.orderNumber = +this.orderNumber.trim();
                                        detail.deliveryNumber = response.docNum;
                                        this.detailDelivery.push(detail);
                                    }
                                }

                                $('#modal_transfer_process').modal('hide');
                                document.getElementById("item").style.display = "inline";
                                $('#itemCode').focus();
                                this.timerStart = Math.ceil(((this.detailDelivery.length * 42) / 60));
                                this.resetTimer();
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
                    this.redirectIfSessionInvalid(error);
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
                if (this.detailDelivery[i].item.trim() != item.trim().toUpperCase()) {
                    aux++;
                }
            }
            if (aux >= this.detailDelivery.length) {
                return;
            }
        }

        for (let i = 0; i < this.listScaners.length; i++) {
            if (this.listScaners[i].item.trim() == item.trim().toUpperCase() && this.listScaners[i].box == this.newBox) {
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
            orderNumber: this.detailDelivery[0].orderNumber,
            deliveryNumber: this.detailDelivery[0].deliveryNumber
        };
        this.listScaners.unshift(newItem);
        this.itemCode = "";
        $('#itemCode').focus();
        this.compareDifferences();
    }

    public reset() {
        this.start();
        document.getElementById("item").style.display = "none";
        this.orderNumber = "";
        this.itemCode = "";
        this.resetTimer();
        this.disabledTime = false;
        $('#orderNumber').focus();
    }

    public openModalEditCant(item: string, box: number) {
        this.qtyEdit = null;
        this.itemCode = item;
        this.selectedBox = box;
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
                let endTime = this.minutes + ":" + this.seconds;
                if (this.listScaners[j].item.trim() == this.detailDelivery[i].item.trim()) {
                    this.checkOutDTO = new PackingCheckOut(this.detailDelivery[i].orderNumber, this.detailDelivery[i].deliveryNumber, this.detailDelivery[i].item.trim(), this.detailDelivery[i].qty, this.listScaners[j].qty,
                        null, this.identity.username, null, this.listScaners[j].box, this.identity.selectedCompany, this.timerStart.toString(), endTime);
                    break;
                } else {
                    this.checkOutDTO = new PackingCheckOut(this.detailDelivery[i].orderNumber, this.detailDelivery[i].deliveryNumber, this.detailDelivery[i].item.trim(), this.detailDelivery[i].qty, 0, null,
                        this.identity.username, null, 0, this.identity.selectedCompany, this.timerStart.toString(), endTime);
                }
            }

            this._packingService.addCheckOutOrder(this.checkOutDTO).subscribe(
                response => {
                    if (response.code == 0) {
                        this.reset();
                        this.openReport(this.checkOutDTO.orderNumber, 'W');
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

    public getTimer() {
        console.log("Tiempo inicial: " + this.timerStart);
        console.log("Tiempo Final: " + this.minutes + ":" + this.seconds);
    }

    public editQtyItem(item: string) {
        for (let i = 0; i < this.listScaners.length; i++) {
            if (this.listScaners[i].item.trim() == item.trim().toUpperCase() && this.listScaners[i].box == this.selectedBox) {
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
        this.exitMessage = "";
        this.errorMessage = "";
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
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        let box = this.listScaners[0].box;
        let orderNumber = this.listScaners[0].orderNumber;

        if (orderNumber == null || orderNumber <= 0 || box == null || box <= 0 || this.selectedPrinter == null || this.selectedPrinter.length <= 0) {
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
                    this.confirmCheckOut();
                },
                error => {
                    $('#modal_transfer_process').modal('hide');
                    this.errorMessage = "Lo sentimos. Se produjo un error interno."
                    console.error('Ocurrio un error imprimiendo etiquetas de empaque.', error);
                }
            );
        }
    }

    public openReport(orderNumber: number, origen: string) {
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        if (orderNumber != null) {
            let printReportDTO = {
                "id": orderNumber, "copias": 0, "documento": "checkOut", "companyName": this.identity.selectedCompany, "origen": origen, "imprimir": true
            }

            this._reportService.generateReport(printReportDTO).subscribe(
                response => {
                    if (response.code == 0) {
                        let landingUrl = this.urlShared + this.identity.selectedCompany + "/" + printReportDTO.documento + "/" + printReportDTO.id + ".pdf";
                        window.open(landingUrl);
                    }
                    $('#modal_transfer_process').modal('hide');
                },
                error => {
                    console.error('Ocurrio un error al guardar la lista de empaque.', error);
                    $('#modal_transfer_process').modal('hide');
                }
            );
        }
        $('#modal_transfer_process').modal('hide');
    }

    public getScrollTop() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }
}