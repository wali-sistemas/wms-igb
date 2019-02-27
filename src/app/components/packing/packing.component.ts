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

import 'rxjs/Rx'
import { ResupplyComponent } from '../resupply/resupply.component';

declare var $: any;

@Component({
    templateUrl: './packing.component.html',
    styleUrls: ['./packing.component.css'],
    providers: [UserService, PackingService, InvoiceService, PrintService, GenericService]
})
export class PackingComponent implements OnInit {

    public processDeliveryStatus: string = 'none';
    public processClosePackingOrderStatus: string = 'none';
    public processPrintLabelsStatus: string = 'none';
    public processInvoiceStatus: string = 'none';
    public selectedPrinter: string = '';
    public deliveryErrorMessage: string = '';
    public itemCodeErrorMessage: string = '';
    public quantityErrorMessage: string = '';
    public binErrorMessage: string = '';
    public customersList: Array<any>;
    public ordersList: Array<number>;
    public selectedCustomer: string = '';
    public selectedOrder: number = 0;
    public selectedBox: PackingBox = new PackingBox();
    public selectedBoxItems: Map<string, number> = this.selectedBox.items;
    public binCode: string = '';
    public itemCode: string = '';
    public itemName: string = '';
    public expectedItemQuantity: number;
    public itemQuantity: number;
    public boxes: Array<PackingBox>;
    public addToBox: number = 0;
    public isVisibleItemCode: Boolean = false;
    public packedItemCodeValidated = false;
    public packedItemQuantityValidated = false;
    public addNewBoxEnabled: boolean = false;
    public orderItemsList: Array<any>;
    public printersList: Array<Printer>;
    public customersListDisabled: boolean = false;
    public packingOrdersComplete: boolean = false;
    public qtyBox: number;
    public orderNumber: number;
    public identity;
    public idPackingList: number;
    public idPackingOrder: number;
    public picked: number;
    public errorMessage: string;
    public exitMessage: String;
    public specialPacking: Array<any>;

    public urlShared: String = GLOBAL.urlShared;

    constructor(
        private _userService: UserService,
        private _packingService: PackingService,
        private _invoiceService: InvoiceService,
        private _printService: PrintService,
        private _router: Router,
        private _generic: GenericService) {
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
                if (response.content.length > 0) {
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
                        } else {
                            //Si hay que agregar la cantidad a una caja existente
                            this.boxes[record[12] - 1].addItem(record[7], record[9]);
                        }
                    }
                    this.loadCustomerOrders();
                }
                //this.canBoxesBeAdded();
                this.showAllItems();
            }, error => { console.error(error); }
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
                this.customersList = response.content;
            },
            error => {
                console.error("ocurrio un error listando los cliente. ", error);
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    public loadCustomerOrders() {
        this._packingService.listCustomerOrders(this.selectedCustomer).subscribe(
            response => {
                this.ordersList = response.content;
            },
            error => { console.error('ocurrio un error al consultar las ordenes del cliente. ', error); }
        );
        this.orderItemsList = new Array<any>();
    }

    public validateScannedBin() {
        this.binErrorMessage = '';
        if (!this.binCode || this.binCode.length === 0) {
            return;
        }

        this._packingService.validateBinCode(this.binCode, this.selectedOrder).subscribe(
            response => {
                //console.log('existen ' + response.content + ' items en la ubicacion ' + this.binCode + ' para la orden ' + this.selectedOrder);
                if (response && response.content && response.content > 0) {
                    this.isVisibleItemCode = true;
                } else {
                    this.binErrorMessage = 'No hay items pendientes en la ubicación ingresada para la orden';
                }
            }, error => { console.error('ocurrio un error al validar la ubicacion. ', error); }
        );
    }

    public validateScannedItem() {
        if (!this.itemCode || this.itemCode.length === 0) {
            return;
        }
        this.itemCodeErrorMessage = '';
        //console.log('validando el item ' + this.itemCode);
        this._packingService.validateItem(this.itemCode, this.binCode, this.selectedOrder).subscribe(
            response => {
                if (response && response.code == 0 && response.content && response.content.items > 0) {
                    this.expectedItemQuantity = response.content.items;
                    this.itemName = response.content.itemName;
                    this.packedItemCodeValidated = true;
                } else {
                    //console.warn('el item ' + this.itemCode + ' no se encuentra pendiente por packing en la orden y ubicacion seleccionadas');
                    this.itemCodeErrorMessage = 'La referencia ingresada no se encuentra pendiente por packing para la orden y el carrito seleccionados';
                }
            }, error => { console.error('ocurrio un error al validar la ubicacion. ', error); }
        );
    }

    public validateItemQuantity() {
        $('#cantidad').modal('hide');
        this.errorMessage = '';

        if (this.itemQuantity == null || this.itemQuantity <= 0 || this.qtyBox == null || this.qtyBox <= 0) {
            this.errorMessage = 'Debe ingresar todos los campos obligatorios.'
            return;
        }
        if (this.picked < this.itemQuantity) {
            this.errorMessage = 'La cantidad que ingresaste es superior a la cantidad pendiente (' + this.picked + ') o no es válida';
            return;
        } else {
            this.packedItemQuantityValidated = true;
            this.addItemToBox();
        }
    }

    private canBoxesBeAdded() {
        if (this.boxes.length === 0) {
            this.addNewBoxEnabled = true;
        } else if (this.boxes[this.boxes.length - 1].boxQuantity === 0) {
            this.addNewBoxEnabled = false;
        } else {
            this.addNewBoxEnabled = true;
        }
    }

    public addBox() {
        if (!this.addNewBoxEnabled) {
            return;
        }
        const newBox: PackingBox = new PackingBox();
        newBox.boxDisplayName = 'Caja #' + (this.boxes.length + 1);
        newBox.boxNumber = this.boxes.length + 1;
        this.boxes.push(newBox);

        this.canBoxesBeAdded();
    }

    public confirmAddToBox(idx) {
        this.addToBox = idx;
        $('#confirm_add').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
    }

    public addItemToBox() {
        $('#confirm_add').modal('hide');
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        const packingRecord = new PackingRecord();
        packingRecord.idPackingList = this.idPackingList;
        packingRecord.binCode = this.binCode;
        packingRecord.itemCode = this.itemCode;
        packingRecord.itemName = this.itemName;
        packingRecord.quantity = this.itemQuantity;
        packingRecord.boxNumber = this.qtyBox;
        packingRecord.customerId = this.selectedCustomer;
        packingRecord.orderNumber = this.selectedOrder;
        packingRecord.employee = this.identity.username;
        packingRecord.idPackingOrder = this.idPackingOrder;

        this._packingService.createPackingRecord(packingRecord).subscribe(
            response => {
                $('#modal_transfer_process').modal('hide');
                if (response.code === 0) {
                    this.idPackingList = response.content.idPackingList;
                    $('#cantidad').modal('hide');
                    this.showAllItems();
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
            }, error => {
                $('#modal_transfer_process').modal('hide');
                console.error(error);
            }
        );
    }

    private reset() {
        this.binCode = '';
        this.itemCode = '';
        this.itemName = '';
        this.itemQuantity = null;
        this.isVisibleItemCode = false;
        this.packedItemCodeValidated = false;
        this.packedItemQuantityValidated = false;
        this.exitMessage = '';
        this.errorMessage = '';
        this.orderNumber = null;
        this.qtyBox = null;
        this.canBoxesBeAdded();
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
        this.orderItemsList = new Array<any>();
        this._packingService.listOrderItems(this.idPackingOrder).subscribe(
            response => {
                console.log('************');
                console.log(response.content);
                console.log('************');
                this.orderItemsList = response.content;
            }, error => { console.error(error); }
        );
    }

    public showPackingDetail(boxIndex) {
        this.selectedBox = this.boxes[boxIndex];
        this.selectedBoxItems = this.selectedBox.items;
        $('#packing_detail').modal('show');
    }

    public createDelivery() {
        $('#printer_selection').modal('hide');
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

        this._packingService.createDelivery(this.idPackingOrder).subscribe(
            response => {
                if (response.code == 0) {
                    this.processDeliveryStatus = 'done';
                    this.closePackingOrder(this.idPackingOrder, this.identity.username);
                    this.createInvoice(response.content);
                    this.printLabels();
                    this.idPackingOrder = null;
                    this.customersListDisabled = true;
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

        this._packingService.cleanPackingOrder(this.idPackingOrder).subscribe(
            result => {
                $('#modal_transfer_process').modal('hide');
                this._router.navigate(['/']);
            }, error => {
                console.error(error);
                this._router.navigate(['/']);
            }
        );
    }

    public loadPrinters() {
        $('#close_confirmation').modal('hide');
        this._printService.listEnabledPrinters().subscribe(
            response => {
                if (response.code == 0) {
                    this.printersList = response.content;
                    $('#printer_selection').modal('show');
                }
            }, error => { console.error(error); }
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

                const blob = new Blob([response], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                window.open(url);

                this.reset();
                this.start();
                this.ngOnInit();
            }, error => {
                this.processClosePackingOrderStatus = 'error';
                console.error(error);
            }
        );
    }

    private createInvoice(docEntryDelivery) {
        this.processInvoiceStatus = 'inprogress';
        this._invoiceService.createInvoice(docEntryDelivery).subscribe(
            response => {
                if (response.code == 0) {
                    this.processInvoiceStatus = 'done';
                } else {
                    this.processInvoiceStatus = 'error';
                }
            },
            error => {
                this.processInvoiceStatus = 'error';
                console.error(error);
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
        this.itemCode = orderList[3];
        this.binCode = orderList[0];
        this.picked = orderList[2];

        $('#order_items').modal('hide');

        if (this.picked > 0) {
            this.itemQuantity = null;
            this.qtyBox = null;
            $('#cantidad').modal('show');
            $('#input_packedQuantity').focus();
        }

        this.isVisibleItemCode = true;
        this.packedItemCodeValidated = true;
        this.customersListDisabled = true;
    }

    public cleanItemTable() {
        this.itemCode = null;
        this.itemName = null;
        this.binCode = null;
        this.itemQuantity = null;
        this.isVisibleItemCode = false;
        this.packedItemCodeValidated = false;
        this.qtyBox = null;
        this.customersListDisabled = false;
        this.exitMessage = '';
        this.errorMessage = '';
    }

    public getPackingOrders() {
        this.specialPacking = new Array<any>();

        this._packingService.getPackingOrders((this.selectedCustomer == null || this.selectedCustomer.length == 0) ? 'null' : this.selectedCustomer).subscribe(
            response => {
                if (response.content.length > 0) {
                    this.specialPacking = response.content;
                    $('#magicTable').modal('show');
                } else {
                    this.errorMessage = 'No se encontraron ítems pendientes por empacar.';
                }
            }, error => { console.error(error); }
        );
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
        this.packedItemCodeValidated = true;
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
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        this._packingService.listOrderItems(this.idPackingOrder).subscribe(
            response => {
                $('#modal_transfer_process').modal('hide');
                if (response.content.length > 0) {
                    for (let i = 0; i < response.content.length; i++) {
                        const packingRecord = new PackingRecord();
                        packingRecord.idPackingList = this.idPackingList;
                        packingRecord.binCode = response.content[i][0];
                        packingRecord.itemCode = response.content[i][3];
                        packingRecord.itemName = this.itemName;
                        packingRecord.quantity = response.content[i][2];
                        packingRecord.boxNumber = this.qtyBox;
                        packingRecord.customerId = this.selectedCustomer;
                        packingRecord.orderNumber = this.selectedOrder;
                        packingRecord.employee = this.identity.username;
                        packingRecord.idPackingOrder = this.idPackingOrder;

                        this._packingService.createPackingRecord(packingRecord).subscribe(
                            response => {
                                if (response.code < 0) {
                                    this.errorMessage = "Lo sentimos. Se produjo un error interno."
                                    $("#caja").modal('hide');
                                    return;
                                } else {
                                    $("#caja").modal('hide');
                                    this.loadPrinters();
                                }
                            },
                            error => {
                                $('#modal_transfer_process').modal('hide');
                                this.errorMessage = "Lo sentimos. Se produjo un error interno."
                                console.error(error);
                            }
                        );
                    }

                } else {
                    this.errorMessage = 'No hay items pendientes por empacar.';
                    $("#caja").modal('hide');
                }
            }, error => { console.error(error); }
        );
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

    public getScrollTop() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }
}