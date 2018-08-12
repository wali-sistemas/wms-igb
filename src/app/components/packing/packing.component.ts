import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { PackingBox } from './../../models/packing-box';
import { PackingRecord } from '../../models/packing-record';
import { Printer } from '../../models/printer';

import { UserService } from '../../services/user.service';
import { PackingService } from '../../services/packing.service';
import { InvoiceService } from '../../services/invoice.service';
import { PrintService } from '../../services/print.service';

declare var $: any;

@Component({
    templateUrl: './packing.component.html',
    styleUrls: ['./packing.component.css'],
    providers: [UserService, PackingService, InvoiceService, PrintService]
})
export class PackingComponent implements OnInit {

    public processDeliveryStatus: string = 'none';
    public processClosePackingOrderStatus: string = 'none';
    public processPrintLabelsStatus: string = 'none';
    public processInvoiceStatus: string = 'none';
    public process4Status: string = 'none';

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
    private identity;
    private idPackingList: number;
    private idPackingOrder: number;

    public errorMessage: string;
    public specialPacking: Array<any>;

    constructor(
        private _userService: UserService,
        private _packingService: PackingService,
        private _invoiceService: InvoiceService,
        private _printService: PrintService,
        private _router: Router) {
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
                    let firstRecord = response.content[0];
                    this.selectedOrder = firstRecord[2];
                    this.selectedCustomer = firstRecord[3];
                    this.idPackingList = firstRecord[1];
                    this.idPackingOrder = firstRecord[6];
                    for (let i = 0; i < response.content.length; i++) {
                        let record = response.content[i];

                        if (this.boxes.length < record[11]) {
                            //Si hay que agregar la caja
                            let box = new PackingBox();
                            box.boxDisplayName = "Caja #" + record[11];
                            box.boxNumber = record[11];
                            box.addItem(record[7], record[8]);
                            this.boxes.push(box);
                        } else {
                            //Si hay que agregar la cantidad a una caja existente
                            this.boxes[record[11] - 1].addItem(record[7], record[8]);
                        }
                    }
                    this.loadCustomerOrders();
                    console.log('termino de procesar los registros. ' + this.boxes.length + ' cajas agregadas');
                }
                this.canBoxesBeAdded();
            }, error => {
                console.error(error);
            }
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
                console.error('Ocurrio un error no identificado. ', error);
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    public loadCustomerOrders() {
        this._packingService.listCustomerOrders(this.selectedCustomer).subscribe(
            response => {
                console.log('se encontraron las siguientes ordenes: ', response.content);
                this.ordersList = response.content;
            },
            error => {
                console.error('ocurrio un error al consultar las ordenes del cliente', error);
            }
        );
    }

    public validateScannedBin() {
        this.binErrorMessage = '';
        if (!this.binCode || this.binCode.length === 0) {
            return;
        }
        console.log('validando si la ubicacion ' + this.binCode + ' contiene items de la orden seleccionada');
        this._packingService.validateBinCode(this.binCode, this.selectedOrder).subscribe(
            response => {
                console.log('existen ' + response.content + ' items en la ubicacion ' + this.binCode + ' para la orden ' + this.selectedOrder);
                if (response && response.content && response.content > 0) {
                    this.isVisibleItemCode = true;
                } else {
                    this.binErrorMessage = 'No hay items pendientes en la ubicación ingresada para la orden';
                }
            }, error => {
                console.error('ocurrio un error al validar la ubicacion. ', error);
            }
        );
    }

    public validateScannedItem() {
        if (!this.itemCode || this.itemCode.length === 0) {
            return;
        }
        this.itemCodeErrorMessage = '';
        console.log('validando el item ' + this.itemCode);
        this._packingService.validateItem(this.itemCode, this.binCode, this.selectedOrder).subscribe(
            response => {
                if (response && response.code == 0 && response.content && response.content > 0) {
                    this.expectedItemQuantity = response.content;
                    this.packedItemCodeValidated = true;
                } else {
                    console.warn('el item ' + this.itemCode + ' no se encuentra pendiente por packing en la orden y ubicacion seleccionadas');
                    this.itemCodeErrorMessage = 'La referencia ingresada no se encuentra pendiente por packing para la orden y el carrito seleccionados';
                }
            }, error => {
                console.error('ocurrio un error al validar la ubicacion. ', error);
            }
        );
    }

    public validateItemQuantity() {
        $('#cantidad').modal('hide');
        this.quantityErrorMessage = '';
        console.log('validando la cantidad ');
        if (!this.itemQuantity || this.itemQuantity <= 0 || this.itemQuantity > this.expectedItemQuantity) {
            this.quantityErrorMessage = 'La cantidad que ingresaste es superior a la cantidad pendiente (' + this.expectedItemQuantity + ') o no es válida';
            return;
        } else {
            this.packedItemQuantityValidated = true;
        }
        this.canBoxesBeAdded();
    }

    private canBoxesBeAdded() {
        if (this.boxes.length === 0) {
            this.addNewBoxEnabled = true;
        } else if (this.boxes[this.boxes.length - 1].boxQuantity === 0) {
            this.addNewBoxEnabled = false;
        } else {
            this.addNewBoxEnabled = true;
        }
        console.log('canBoxesBeAdded? ' + this.addNewBoxEnabled);
    }

    public addBox() {
        if (!this.addNewBoxEnabled) {
            return;
        }
        let newBox: PackingBox = new PackingBox();
        newBox.boxDisplayName = "Caja #" + (this.boxes.length + 1);
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
        if (this.boxes.length > 0) {
            $('#confirm_add').modal('hide');
            $('#modal_transfer_process').modal({
                backdrop: 'static',
                keyboard: false,
                show: true
            });
            let packingRecord = new PackingRecord();
            packingRecord.idPackingList = this.idPackingList;
            packingRecord.binCode = this.binCode;
            packingRecord.itemCode = this.itemCode;
            packingRecord.quantity = this.itemQuantity;
            packingRecord.boxNumber = this.boxes[this.addToBox].boxNumber;
            packingRecord.customerId = this.selectedCustomer;
            packingRecord.orderNumber = this.selectedOrder;
            packingRecord.employee = this.identity.username;
            packingRecord.idPackingOrder = this.idPackingOrder;

            this._packingService.createPackingRecord(packingRecord).subscribe(
                response => {
                    $('#modal_transfer_process').modal('hide');
                    console.log(response.content);
                    if (response.code === 0) {
                        this.idPackingList = response.content.idPackingList;
                        this.boxes[this.addToBox].addItem(this.itemCode, this.itemQuantity);

                        this.reset();
                        this.isPackingComplete();
                    }
                }, error => {
                    $('#modal_transfer_process').modal('hide');
                    console.error(error);
                }
            );
        }
    }

    private reset() {
        this.binCode = '';
        this.itemCode = '';
        this.itemQuantity = 0;
        this.isVisibleItemCode = false;
        this.packedItemCodeValidated = false;
        this.packedItemQuantityValidated = false;
        this.canBoxesBeAdded();
    }

    private isPackingComplete() {
        this._packingService.arePackingOrdersComplete().subscribe(
            result => {
                console.log(result);
                this.packingOrdersComplete = result.content;
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
    }

    public showAllItems() {
        this.orderItemsList = new Array<any>();
        this._packingService.listOrderItems(this.idPackingOrder).subscribe(
            response => {
                this.orderItemsList = response.content;
                $('#order_items').modal({
                    backdrop: 'static',
                    keyboard: false,
                    show: true
                });
            }, error => {
                console.error(error);
            }
        );
    }

    public showPackingDetail(boxIndex) {
        this.selectedBox = this.boxes[boxIndex];
        this.selectedBoxItems = this.selectedBox.items;
        console.log(this.selectedBox);
        console.log(this.selectedBoxItems);
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
        console.log('creando documento sap para idPackingOrder=' + this.idPackingOrder);
        this._packingService.createDelivery(this.idPackingOrder).subscribe(
            result => {
                console.log(result);
                if (result.code == 0) {
                    this.processDeliveryStatus = 'done';
                    this.closePackingOrder(this.idPackingOrder, this.identity.username);
                    this.createInvoice(result.content);
                    this.printLabels();
                } else {
                    this.processDeliveryStatus = 'error';
                    this.deliveryErrorMessage = result.content;
                }
            },
            error => {
                this.processDeliveryStatus = 'error';
                this.deliveryErrorMessage = 'Ocurrió un error al crear el documento de entrega en SAP. ';
                console.error(error);
            }
        );
    }

    public loadPrinters() {
        console.log('listando impresoras habilitadas...');
        $('#close_confirmation').modal('hide');
        this._printService.listEnabledPrinters().subscribe(
            response => {
                console.log(response);
                if (response.code == 0) {
                    this.printersList = response.content;
                    $('#printer_selection').modal('show');
                }
            }, error => { console.error(error); }
        );
    }

    private printLabels() {
        console.log('imprimiendo etiquetas de packingList ' + this.idPackingList + ' en impresora ' + this.selectedPrinter);
        this.processPrintLabelsStatus = 'inprogress';
        this._printService.printLabels(this.idPackingList, this.selectedPrinter).subscribe(
            result => {
                console.log(result);
                if (result.code == 0) {
                    if (result.content) {
                        //todas las etiquetas se imprimieron
                        this.processPrintLabelsStatus = 'done';
                    } else {
                        //no se imprimieron correctamente todas las etiquetas
                        this.processPrintLabelsStatus = 'warn';
                    }
                } else {
                    this.processPrintLabelsStatus = 'error';
                    this.deliveryErrorMessage += result.content;
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
                if (response.content) {
                    //Orden completa. Cerrar orden de venta
                    this.closeSalesOrder(this.idPackingOrder);
                }
                this.processClosePackingOrderStatus = 'done';
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
                console.log(response);
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

    private closeSalesOrder(idPackingOrder) {
        this.process4Status = 'inprogress';
    }

    public inProgress() {
        return this.processClosePackingOrderStatus === 'inprogress'
            || this.processDeliveryStatus === 'inprogress'
            || this.processInvoiceStatus === 'inprogress'
            || this.processPrintLabelsStatus === 'inprogress';
    }

    public selectItemTable(orderList: any) {
        this.itemCode = orderList[3];
        this.binCode = orderList[0];

        $('#order_items').modal('hide');
        $('#cantidad').modal('show');

        this.isVisibleItemCode = true;
        this.packedItemCodeValidated = true;
        this.customersListDisabled = true;
    }

    public cleanItemTable() {
        this.itemCode = null;
        this.binCode = null;
        this.itemQuantity = null;
        this.isVisibleItemCode = false;
        this.packedItemCodeValidated = false;
    }

    public getPackingOrders() {
        this.specialPacking = new Array<any>();

        this._packingService.getPackingOrders((this.selectedCustomer == null || this.selectedCustomer.length == 0) ? 'null' : this.selectedCustomer).subscribe(
            response => {
                if (response.content.length > 0) {
                    this.specialPacking = response.content;
                    $('#magicTable').modal('show');
                    console.log(this.specialPacking);
                } else {
                    this.errorMessage = 'No se encontraron ítems pendientes por empacar';
                }
            }, error => { }
        );
    }

    public selectItemMagicTable(specialPacking: any) {
        this.selectedCustomer = specialPacking[0];
        this.selectedOrder = specialPacking[2];
        this.itemCode = specialPacking[3];
        this.binCode = specialPacking[5];
        this.idPackingOrder = specialPacking[8];

        this.loadCustomerOrders();

        $('#magicTable').modal('hide');
        $('#cantidad').modal('show');

        this.isVisibleItemCode = true;
        this.packedItemCodeValidated = true;
    }
}
