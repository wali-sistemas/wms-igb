import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { GLOBAL } from '../../services/global';

import { PackingBox } from './../../models/packing-box';
import { PackingRecord } from '../../models/packing-record';
import { Printer } from '../../models/printer';

import { UserService } from '../../services/user.service';
import { PackingService } from '../../services/packing.service';
import { InvoiceService } from '../../services/invoice.service';
import { PrintService } from '../../services/print.service';
import { GenericService } from '../../services/generic';
import { ReportService } from '../../services/report.service';
import { Healthchek } from '../../services/healthchek.service';

import 'rxjs/Rx'
import { ResupplyComponent } from '../resupply/resupply.component';

declare var $: any;

@Component({
    templateUrl: './packing.component.html',
    styleUrls: ['./packing.component.css'],
    providers: [UserService, PackingService, InvoiceService, PrintService, GenericService, ReportService, Healthchek]
})
export class PackingComponent implements OnInit {

    public urlShared: string = GLOBAL.urlShared;
    public processDeliveryStatus: string = 'none';
    public processClosePackingOrderStatus: string = 'none';
    public processPrintLabelsStatus: string = 'none';
    public processInvoiceStatus: string = 'none';
    public selectedPrinter: string = '';
    public deliveryErrorMessage: string = '';
    public itemCodeErrorMessage: string = '';
    public quantityErrorMessage: string = '';
    public binErrorMessage: string = '';
    public binCode: string = '';
    public itemCode: string = '';
    public itemName: string = '';
    public dscripction: string = '';
    public selectedCustomer: string = '';
    public errorMessage: string;
    public errorMessageModal: string;
    public exitMessage: string;
    public selectedOrder: number = 0;
    public qtyBox: number = null;
    public boxTotal: number = 0;
    public expectedItemQuantity: number;
    public itemQuantity: number;
    public orderNumber: number;
    public idPackingList: number;
    public idPackingOrder: number;
    public picked: number;
    public docEntryDelivery: number;
    public docEntryInvoice: number;
    public isVisibleItemCode: boolean = false;
    public addNewBoxEnabled: boolean = false;
    public customersListDisabled: boolean = false;
    public packingOrdersComplete: boolean = false;
    public ordersList: Array<number>;
    public customersList: Array<any>;
    public orderItemsList: Array<any>;
    public specialPacking: Array<any>;
    public usedBoxesList: Array<PackingBox>;
    public boxes: Array<PackingBox>;
    public printersList: Array<Printer>;
    public selectedBox: PackingBox = new PackingBox();
    public selectedBoxItems: Map<string, number> = this.selectedBox.items;
    public identity;

    constructor(private _userService: UserService, private _packingService: PackingService, private _invoiceService: InvoiceService, private _printService: PrintService, private _router: Router, private _generic: GenericService, private _reportService: ReportService, private _healthchek: Healthchek) {
        this.start();
    }

    private start() {
        this.customersList = new Array<any>();
        this.ordersList = new Array<any>();
        this.orderItemsList = new Array<any>();
        this.boxes = new Array<PackingBox>();
        this.selectedBox = new PackingBox();
        this.selectedBoxItems = this.selectedBox.items;
        this.selectedCustomer = '';
        this.selectedOrder = 0;
        this.specialPacking = new Array<any>();
    }

    ngOnInit() {
        this.identity = this._userService.getItentity();
        if (this.identity === null) {
            this._router.navigate(['/']);
        }
        $('#modal_quantity').on('shown.bs.modal', function () {
            $('#quantity').focus();
        });
        this.loadCustomers();
        this.listOpenJobs();
        this.isPackingComplete();
    }

    private listOpenJobs() {
        this._packingService.listOpenJobRecords(this.identity.username).subscribe(
            response => {
                console.log('registros de packing abiertos: ', response);
                if (response.content.length > 0) {
                    console.log('procesando registros...');
                    this.customersListDisabled = true;
                    const firstRecord = response.content[0];
                    this.selectedOrder = firstRecord[2];
                    this.selectedCustomer = firstRecord[3];
                    this.idPackingList = firstRecord[1];
                    this.idPackingOrder = firstRecord[6];
                    for (let i = 0; i < response.content.length; i++) {
                        const record = response.content[i];
                        if (this.boxes.length < record[12]) {
                            //Si hay que agregar la caja
                            const box = new PackingBox();
                            box.boxDisplayName = 'Caja #' + record[12];
                            box.boxNumber = record[12];
                            box.addItem(record[7], record[9]);
                            this.boxes.push(box);
                        } /*else {
                            //Si hay que agregar la cantidad a una caja existente
                            //this.boxes[record[12] - 1].addItem(record[7], record[9]);
                        }*/
                    }
                    this.loadCustomerOrders();
                    console.log('termino de procesar los registros. ' + this.boxes.length + ' cajas agregadas');
                }
                this.showAllItems();
            }, error => { console.error('Ocurrio un error procesando ítems para packing.', error); }
        );
    }

    private redirectIfSessionInvalid(error) {
        if (error && error.status && error.status == 401) {
            localStorage.removeItem('igb.identity');
            localStorage.removeItem('igb.selectedCompany');
            this._router.navigate(['/']);
        }
    }

    private loadCustomers() {
        this._packingService.listCustomers().subscribe(
            response => {
                console.log('se encontraron los siguientes clientes: ', response.content);
                this.customersList = response.content;
            },
            error => {
                console.error("ocurrio un error listando los cliente. ", error);
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    public loadCustomerOrders() {
        this.errorMessage = '';
        this.exitMessage = '';
        this._packingService.listCustomerOrders(this.selectedCustomer).subscribe(
            response => {
                console.log('se encontraron las siguientes ordenes: ', response.content);
                this.ordersList = response.content;
            },
            error => { console.error('ocurrio un error al consultar las ordenes del cliente. ', error); }
        );
        this.orderItemsList = new Array<any>();
    }

    public validateItemQuantity() {
        this.errorMessage = '';
        this.errorMessageModal = '';

        if (this.itemQuantity == null || this.itemQuantity <= 0 || this.qtyBox == null || this.qtyBox < 0) {
            this.errorMessageModal = 'Debe ingresar todos los campos obligatorios.'
            this.getScrollTop();
            return;
        }
        if (this.picked < this.itemQuantity) {
            this.errorMessageModal = 'La cantidad ingresada es superior a la cantidad solicitada (' + this.picked + ').';
            this.getScrollTop();
            return;
        } else {
            this.addBox();
            this.addItemToBox();
            $('#cantidad').modal('hide');
        }
    }

    public addBox() {
        if (!this.addNewBoxEnabled) {
            return;
        }
        const newBox: PackingBox = new PackingBox();
        if (this.boxes.length == 0 || this.qtyBox == 0) {
            let box = 0;
            for (let i = 0; i < this.boxes.length; i++) {
                box = this.boxes[i].boxNumber;
            }
            newBox.boxDisplayName = 'Caja #' + (box + 1);
            newBox.boxNumber = box + 1;
            newBox.addItem(this.itemCode, this.itemQuantity);
            this.boxes.push(newBox);
            return;
        }
        console.log('Se selecciono la caja # ' + this.qtyBox);
        newBox.boxDisplayName = 'Caja #' + this.qtyBox;
        newBox.boxNumber = +this.qtyBox;
        newBox.addItem(this.itemCode, this.itemQuantity);
        this.boxes.push(newBox);
    }

    private getUsedBoxesList() {
        this.usedBoxesList = new Array<PackingBox>();
        this._packingService.getBoxPackingList(this.identity.username).subscribe(
            response => {
                for (let i = 0; i < response.content.length; i++) {
                    const box = new PackingBox();
                    box.boxNumber = response.content[i];
                    box.boxDisplayName = 'Caja #' + response.content[i];
                    this.usedBoxesList.push(box);
                }
            }, error => { console.error(error); }
        );
    }

    public confirmAddToBox(idx) {
        this.errorMessage = '';
        this.errorMessageModal = '';
        if (idx >= 0) {
            this.addNewBoxEnabled = true;
        } else {
            this.addNewBoxEnabled = false;
        }
    }

    public addItemToBox() {
        const packingRecord = new PackingRecord();
        packingRecord.idPackingList = this.idPackingList;
        packingRecord.binCode = this.binCode;
        packingRecord.itemCode = this.itemCode;
        packingRecord.itemName = this.itemName;
        packingRecord.quantity = this.itemQuantity;

        let countBox = 0;
        for (let i = 0; i < this.boxes.length; i++) {
            countBox = this.boxes[i].boxNumber;
        }
        packingRecord.boxNumber = countBox;
        packingRecord.customerId = this.selectedCustomer;
        packingRecord.orderNumber = this.selectedOrder;
        packingRecord.employee = this.identity.username;
        packingRecord.idPackingOrder = this.idPackingOrder;

        this._packingService.createPackingRecord(packingRecord).subscribe(
            response => {
                if (response.code === 0) {
                    this.idPackingList = response.content.idPackingList;
                    $('#cantidad').modal('hide');
                    this.showAllItems();
                } else {
                    this.processDeliveryStatus = 'error';
                    this.deliveryErrorMessage = response.content;
                    if (response.code == -2) {
                        $('#clean_confirmation').modal({
                            backdrop: 'static',
                            keyboard: false,
                            show: true
                        });
                    }
                }
            }, error => { console.error('Ocurrio un error creando el packing record. ', error); }
        );
    }

    private reset() {
        this.binCode = '';
        this.itemCode = '';
        this.itemName = '';
        this.itemQuantity = null;
        this.isVisibleItemCode = false;
        this.exitMessage = '';
        this.errorMessage = '';
        this.errorMessageModal = '';
        this.orderNumber = null;
        this.qtyBox = null;
    }

    private isPackingComplete() {
        this._packingService.arePackingOrdersComplete().subscribe(
            response => {
                this.packingOrdersComplete = response.content;
            }, error => { console.error(error); }
        );
    }

    public setIdPackingOrder() {
        for (let i = 0; i < this.ordersList.length; i++) {
            if (this.ordersList[i][1] == this.selectedOrder) {
                this.idPackingOrder = this.ordersList[i][0];
                break;
            }
        }
        this.showAllItems();
    }

    public showAllItems() {
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        this.getUsedBoxesList();
        this.orderItemsList = new Array<any>();
        this._packingService.listOrderItems(this.idPackingOrder).subscribe(
            response => {
                if (response.code === 0) {
                    this.start();
                    this.exitMessage = response.content;
                    this.loadCustomers();
                    $('#modal_transfer_process').modal('hide');
                } else if (response.code === 1) {
                    this.orderItemsList = response.content;
                    $('#modal_transfer_process').modal('hide');
                } else {
                    this.errorMessage = response.content;
                    this.loadCustomers();
                    $('#modal_transfer_process').modal('hide');
                }
            }, error => {
                $('#modal_transfer_process').modal('hide');
                console.error(error);
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    public createDelivery() {
        $('#close_confirmation').modal('hide');
        this.processDeliveryStatus = 'inprogress';
        this.processClosePackingOrderStatus = 'none';
        this.processPrintLabelsStatus = 'none';
        this.processInvoiceStatus = 'none';
        $('#process_status').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        this.deliveryErrorMessage = '';
        console.log('creando documento sap para idPackingOrder=' + this.idPackingOrder + ' OrderNumber=' + this.selectedOrder);
        localStorage.setItem('selectedOrder', JSON.stringify(this.selectedOrder));

        this._packingService.createDelivery(this.idPackingOrder).subscribe(
            response => {    
                if (response.code == 0) {
                    this.processDeliveryStatus = 'done';
                    this.closePackingOrder(this.idPackingOrder, this.identity.username);
                    this.idPackingOrder = null;
                    this.customersListDisabled = true;
                    this.docEntryDelivery = response.content;
                } else {
                    this.processDeliveryStatus = 'error';
                    this.deliveryErrorMessage = response.content;
                    if (response.code == -2) {
                        $('#process_status').modal('hide');
                        $('#clean_confirmation').modal({
                            backdrop: 'static',
                            keyboard: false,
                            show: true
                        });
                    }
                }
            },
            error => {
                this.processDeliveryStatus = 'error';
                this.deliveryErrorMessage = 'Ocurrió un error al crear el documento de entrega en SAP. ';
                console.error(error);
            }
        );
    }

    public cleanPacking() {
        $('#clean_confirmation').modal('hide');
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        console.log('cancelando packing order ' + this.idPackingOrder);
        this._packingService.cleanPackingOrder(this.idPackingOrder).subscribe(
            response => {
                $('#modal_transfer_process').modal('hide');
                this._router.navigate(['/']);
            }, error => {
                console.error(error);
                $('#modal_transfer_process').modal('hide');
                this._router.navigate(['/']);
            }
        );
    }

    public loadPrinters() {
        console.log('listando impresoras habilitadas...');
        $('#close_confirmation').modal('hide');
        this._printService.listEnabledPrinters().subscribe(
            response => {
                if (response.code == 0) {
                    this.printersList = response.content;
                    $('#modal_transfer_process').modal('hide');
                    console.log('Nro de etiqueta a imprimir: ' + this.qtyBox);
                    $('#printer_selection').modal('show');
                }
            }, error => {
                console.error(error);
                $('#modal_transfer_process').modal('hide');
            }
        );
    }

    private printLabels() {
        this.processPrintLabelsStatus = 'inprogress';
        this._printService.printLabels(this.idPackingOrder, this.selectedPrinter).subscribe(
            response => {
                if (response.code == 0) {
                    if (response.content) {
                        //todas las etiquetas se imprimieron
                        this.processPrintLabelsStatus = 'done';
                    } else {
                        //no se imprimieron correctamente todas las etiquetas
                        this.processPrintLabelsStatus = 'warn';
                    }
                } else {
                    this.processPrintLabelsStatus = 'error';
                    this.deliveryErrorMessage += response.content;
                }
            }, error => {
                console.error(error);
                this.processPrintLabelsStatus = 'error';
                this.deliveryErrorMessage += 'Ocurrió un error al imprimir las etiquetas de empaque. Deben imprimirse manualmente';
            }
        );
    }

    private closePackingOrder(idPackingOrder, username) {
        this.processClosePackingOrderStatus = 'inprogress';
        this._packingService.closePackingOrder(idPackingOrder, username).subscribe(
            response => {
                this.processClosePackingOrderStatus = 'done';
                this.reset();
                this.start();
                this.ngOnInit();
            }, error => {
                this.processClosePackingOrderStatus = 'error';
                console.error("Ocurrio un error cerrando el packing.", error);
            }
        );
    }

    public getUrlReport(documento: string, origen: string) {
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        let printReportDTO = {
            "id": JSON.parse(localStorage.getItem('selectedOrder')), "copias": 0, "documento": documento, "companyName": this.identity.selectedCompany, "origen": origen, "imprimir": false
        }
        console.log(printReportDTO);
        this._reportService.generateReport(printReportDTO).subscribe(
            response => {
                if (response.code == 0) {
                    let landingUrl = this.urlShared + this.identity.selectedCompany + "/" + documento + "/" + JSON.parse(localStorage.getItem('selectedOrder')) + ".pdf";
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

    public openReport(documento: string, origen: string) {
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        if (this.orderNumber != null) {
            let printReportDTO = {
                "id": this.orderNumber, "copias": 0, "documento": documento, "companyName": this.identity.selectedCompany, "origen": origen, "imprimir": false
            }
            this._reportService.generateReport(printReportDTO).subscribe(
                response => {
                    if (response.code == 0) {
                        let landingUrl = this.urlShared + this.identity.selectedCompany + "/" + documento + "/" + this.orderNumber + ".pdf";
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
    }

    public checkOut() {
        this._router.navigate(['/check-out']);
    }

    public modal() {
        this.processDeliveryStatus = 'done';
        this.processClosePackingOrderStatus = 'done';
        this.processInvoiceStatus = 'done';

        $('#process_status').modal('show');

    }

    public createInvoice() {
        this.deliveryErrorMessage = "";
        this.processInvoiceStatus = 'inprogress';
        this._invoiceService.createInvoice(this.docEntryDelivery).subscribe(
            response => {     
                if (response.code == 0) {
                    this.processInvoiceStatus = 'done';
                    this.docEntryInvoice = response.content;
                } else {
                    this.processInvoiceStatus = 'error';
                    this.deliveryErrorMessage = response.content + ". Inténtelo creandola desde SAP.";
                }
            },
            error => {
                this.processInvoiceStatus = 'error';
                this.deliveryErrorMessage = "Error creando factura por favor inténtelo mas tarde.";
                console.error("Ocurrio un error al crear la factura.", error);
            }
        );
    }

    public inProgress() {
        return this.processClosePackingOrderStatus === 'inprogress'
            || this.processDeliveryStatus === 'inprogress'
            || this.processInvoiceStatus === 'inprogress'
            || this.processPrintLabelsStatus === 'inprogress';
    }

    public selectItem(orderList: any) {
        this.errorMessage = '';
        this.errorMessageModal = '';
        this.itemCode = orderList[3];
        this.binCode = orderList[0];
        this.picked = orderList[2];
        this.dscripction = orderList[7];

        if (this.picked > 0) {
            this.itemQuantity = null;
            this.qtyBox = null;
            $('#cantidad').modal('show');
            $('#input_packedQuantity').focus();
        }

        this.isVisibleItemCode = true;
        this.customersListDisabled = true;
    }

    public cleanItemTable() {
        this.itemCode = null;
        this.itemName = null;
        this.binCode = null;
        this.itemQuantity = null;
        this.isVisibleItemCode = false;
        this.qtyBox = null;
        this.customersListDisabled = false;
        this.exitMessage = '';
        this.errorMessage = '';
        this.errorMessageModal = '';
        this.nextOrden();
    }

    public selectItemMagicTable(specialPacking: any) {
        this.selectedCustomer = specialPacking[0];
        this.selectedOrder = specialPacking[2];
        this.itemCode = specialPacking[3];
        this.itemName = specialPacking[9];
        this.binCode = specialPacking[5];
        this.idPackingOrder = specialPacking[8];

        this.loadCustomerOrders();

        $('#magicTable').modal('hide');
        $('#cantidad').modal('show');

        this.isVisibleItemCode = true;
    }

    public nextOrden() {
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        this._packingService.cancelPackingOrder(this.idPackingOrder).subscribe(
            response => {
                this.customersListDisabled = false;
                this.ordersList = new Array<any>();
                this.orderItemsList = new Array<any>();
                this.boxes = new Array<PackingBox>();
                this.selectedBox = new PackingBox();
                this.selectedBoxItems = this.selectedBox.items;
                this.selectedCustomer = '';
                this.selectedOrder = 0;
                this.specialPacking = new Array<any>();
                this.errorMessage = '';
                $('#modal_transfer_process').modal('hide');
            }, error => {
                console.error(error);
                $('#modal_transfer_process').modal('hide');
            }
        );
    }

    public expressPack() {
        /*$('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });*/
        this._packingService.listOrderItems(this.idPackingOrder).subscribe(
            response => {
                if (response.content.length > 0) {
                    for (let i = 0; i < response.content.length; i++) {
                        const packingRecord = new PackingRecord();
                        packingRecord.idPackingList = this.idPackingList;
                        packingRecord.binCode = response.content[i][0];
                        packingRecord.itemCode = response.content[i][3];
                        packingRecord.itemName = this.itemName;
                        packingRecord.quantity = response.content[i][2];
                        packingRecord.boxNumber = 0;/*this.qtyBox;*/
                        packingRecord.customerId = this.selectedCustomer;
                        packingRecord.orderNumber = this.selectedOrder;
                        packingRecord.employee = this.identity.username;
                        packingRecord.idPackingOrder = this.idPackingOrder;

                        this._packingService.createPackingRecord(packingRecord).subscribe(
                            response => {
                                if (response.code < 0) {
                                    //$('#modal_transfer_process').modal('hide');
                                    //$("#close_confirmation").modal('hide');
                                    this.errorMessage = "Lo sentimos. Se produjo un error interno."
                                    return;
                                } else {
                                    //$('#modal_transfer_process').modal('hide');
                                    //$("#close_confirmation").modal('hide');
                                }
                            },
                            error => {
                                //$('#modal_transfer_process').modal('hide');
                                //$("#close_confirmation").modal('hide');
                                this.errorMessage = "Lo sentimos. Se produjo un error interno."
                                console.error("Ocurrio un error creando el expressPack.", error);
                            }
                        );
                    }
                } else {
                    this.errorMessage = 'No hay items pendientes por empacar.';
                    //$('#modal_transfer_process').modal('hide');
                    //$("#close_confirmation").modal('hide');
                }
            }, error => {
                //$("#close_confirmation").modal('hide');
                //$('#modal_transfer_process').modal('hide');
                console.error("Ocurrio un error listando los ítems para expressPack.", error);
            }
        );
        $("#close_confirmation").modal('show');
    }

    public getReprintOrder() {
        this.reset();
        this.printersList = new Array<Printer>();
        $("#reimprimir").modal('show');
        $("#orderNumber").focus();

        this._printService.listEnabledPrinters().subscribe(
            response => {
                if (response.code == 0) {
                    this.printersList = response.content;
                }
            }, error => { console.error(error); }
        );
    }

    public reprintOrder() {
        $("#reimprimir").modal('hide');
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        if (this.orderNumber == null || this.orderNumber <= 0 || this.qtyBox == null || this.qtyBox <= 0 ||
            this.selectedPrinter == null || this.selectedPrinter.length <= 0) {
            $("#reimprimir").modal('hide');
            $('#modal_transfer_process').modal('hide');
            this.errorMessage = 'Debe ingresar todos los datos obligatorios.'
        } else {
            let RePrintDTO = {
                "orderNumber": this.orderNumber,
                "boxNumber": this.qtyBox,
                "printerName": this.selectedPrinter
            }
            this._printService.reprintOrder(RePrintDTO).subscribe(
                response => {
                    $('#modal_transfer_process').modal('hide');
                    this.exitMessage = 'Se reimprimieron las etiquetas exitosamente.';
                },
                error => {
                    $('#modal_transfer_process').modal('hide');
                    this.errorMessage = "Lo sentimos. Se produjo un error interno."
                    console.error(error);
                }
            );
        }
    }

    public resetSesionId() {
        this.deliveryErrorMessage = "";
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        this._healthchek.resetSessionId().subscribe(
            response => {
                $('#modal_transfer_process').modal('hide');
                $('#modal_error').modal('hide');
            },
            error => {
                this.errorMessage = "";
                $('#modal_transfer_process').modal('hide');
                console.error("Ocurrio un error al reiniciar los sesion Id", error);
                this.errorMessage = "Ocurrio un error al reiniciar los sesion Id";
            }
        );
    }

    public getScrollTop() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }
}