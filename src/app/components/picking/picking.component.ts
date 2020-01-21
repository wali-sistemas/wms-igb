import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../services/user.service';
import { SalesOrdersService } from '../../services/sales-orders.service';
import { StockTransferService } from '../../services/stock-transfer.service';
import { BinLocationService } from '../../services/bin-locations.service';
import { PickingService } from '../../services/picking.service';
import { BinLocation } from '../../models/bin-location';
import { SalesOrder } from '../../models/sales-order';
import { Healthchek } from '../../services/healthchek.service';

declare var $: any;

@Component({
    templateUrl: './picking.component.html',
    styleUrls: ['./picking.component.css'],
    providers: [UserService, SalesOrdersService, BinLocationService, StockTransferService, PickingService, Healthchek]
})
export class PickingComponent implements OnInit {
    public identity;
    public pickingMethod: string = 'multiple';
    public selectedPickingMethod: string = 'multiple';
    public selectedCart: number = 0;
    public selectedOrder: string = '';

    private nextOrderNumber: number;
    public nextBinLocationCode: string;
    public nextItemCode: string = '';
    public nextItemName: string = '';
    public nextItemQuantity: number;
    public nextBinAbs: number;
    public nextBinStock: number;
    public nextBinType: string;
    public pickedItemCode: string = '';
    public pickedItemQuantity: number;
    public pickedItemCodeValidated = false;
    public pickedItemQuantityValidated = false;
    public disabledSelectCart = true;

    public confirmBinCode: string = '';
    public confirmingItemQuantity = false;
    public errorMessage: string = '';
    public errorMessagePickingCarts: string = '';
    public errorMessageBinLocation: string = '';
    public errorMessageBinTransfer: string = '';
    public errorMessageNextItem: string = '';
    public warningMessageNoOrders: string = '';
    public availableCarts: Array<BinLocation>;
    public assignedOrders: Array<SalesOrder>;
    public pickingItems: Array<any>;
    public position: number = 1;
    public countLineNum: number = 0;

    constructor(private _userService: UserService,
        private _salesOrderService: SalesOrdersService,
        private _binLocationService: BinLocationService,
        private _stockTransferService: StockTransferService,
        private _pickingService: PickingService,
        private _route: ActivatedRoute,
        private _router: Router,
        private _healthchek: Healthchek) {
        this.availableCarts = new Array<BinLocation>();
    }

    ngOnInit() {
        this.identity = this._userService.getItentity();
        if (this.identity === null) {
            this._router.navigate(['/']);
        }
        $('#modal_quantity').on('shown.bs.modal', function () {
            $('#quantity').focus();
        });
        this.loadAvailablePickingCarts();
        this.loadAssignedOrders();
    }

    private redirectIfSessionInvalid(error) {
        if (error && error.status && error.status === 401) {
            localStorage.removeItem('igb.identity');
            localStorage.removeItem('igb.selectedCompany');
            this._router.navigate(['/']);
        }
    }

    private loadAvailablePickingCarts() {
        this.availableCarts = new Array<BinLocation>();
        this.errorMessagePickingCarts = '';
        this._binLocationService.listAvailablePickingCarts().subscribe(
            response => {
                if (response.length === 0) {
                    this.errorMessagePickingCarts = 'No se encontraron carritos de picking habilitados. Se deben configurar ubicaciones tipo CART en SAP, asegurándose de agregar el nombre de cada carrito en el campo descripción';
                } else {
                    for (let i = 0; i < response.length; i++) {
                        const binLocation = new BinLocation();
                        binLocation.binAbs = response[i].binAbs;
                        binLocation.binCode = response[i].binCode;
                        binLocation.binName = response[i].binName;
                        binLocation.items = response[i].items;
                        binLocation.pieces = response[i].pieces;
                        this.availableCarts.push(binLocation);
                    }
                    if (this.selectedCart > 0) {
                        this.loadNextItem();
                    }
                    document.getElementById("loc").style.display = "inline";
                }
            }, error => {
                console.error(error);
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    private loadAssignedOrders() {
        this.assignedOrders = new Array<SalesOrder>();
        this.warningMessageNoOrders = '';
        this.errorMessageNextItem = '';
        this._salesOrderService.listUserOrders(this.identity.username).subscribe(
            response => {
                if (response.code === 0) {
                    for (let i = 0; i < response.content.length; i++) {
                        const order: SalesOrder = new SalesOrder();
                        order.docNum = response.content[i][0];
                        order.cardName = response.content[i][1];
                        this.assignedOrders.push(order);
                    }
                } else {
                    this.warningMessageNoOrders = 'No se encontraron órdenes asignadas para picking.';
                }
            }, error => {
                console.error(error);
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    private loadNextItem() {
        this.errorMessageNextItem = '';
        this.warningMessageNoOrders = '';
        this.errorMessageBinLocation = '';
        document.getElementById("item").style.display = "none";
        document.getElementById("qty").style.display = "none";
        this.pickedItemQuantity = null;
        this.pickedItemQuantityValidated = false;
        this.pickedItemCode = '';
        this.pickedItemCodeValidated = false;
        this.nextBinLocationCode = null;
        this.nextBinAbs = null;
        this.nextBinStock = null;
        this.nextItemCode = '';
        this.nextItemName = '';
        this.nextItemQuantity = null;
        this.nextBinType = '';
        this.confirmingItemQuantity = false;
        this.confirmBinCode = '';
        this.pickingItems = new Array<any>();

        $('#binLoc').focus();
        $('#modal_loading_next').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        this._pickingService.getNextPickingItem(this.identity.username, this.selectedOrder).subscribe(
            response => {
                console.log("Lista de ítem para picking ", response);
                if (response.code === 0) {
                    this.pickingItems = response.content;

                    //this.nextItemCode = response.content[this.position].itemCode.trim();
                    //this.nextItemQuantity = response.content[this.position].pendingQuantity;
                    //this.nextBinAbs = response.content[this.position].binAbs;
                    //this.nextBinStock = response.content[this.position].availableQuantity;
                    //this.nextBinLocationCode = response.content[this.position].binCode;
                    //this.nextItemName = response.content[this.position].itemName;
                    //this.nextOrderNumber = response.content[this.position].orderNumber;
                    //this.nextBinType = response.content[this.position].binLocationType;

                    this.nextItemCode = response.content.itemCode.trim();
                    this.nextItemQuantity = response.content.pendingQuantity;
                    this.nextBinAbs = response.content.binAbs;
                    this.nextBinStock = response.content.availableQuantity;
                    this.nextBinLocationCode = response.content.binCode;
                    this.nextItemName = response.content.itemName;
                    this.nextOrderNumber = response.content.orderNumber;
                    this.nextBinType = response.content.binLocationType;
                    this.countLineNum = response.content.lineNum;

                    $('#modal_loading_next').modal('hide');
                    $('#binLoc').focus();
                } else if (response.code === -1) {
                    for (let i = 0; i < response.content.length; i++) {
                        this.errorMessageNextItem += response.content[i].message;
                    }
                    $('#modal_loading_next').modal('hide');
                    document.getElementById("loc").style.display = "none";
                } else {
                    this.errorMessageNextItem = response.content;
                    $('#modal_loading_next').modal('hide');
                    document.getElementById("loc").style.display = "none";
                }
                this.loadAssignedOrders();
            }, error => {
                $('#modal_loading_next').modal('hide');
                console.error(error);
                this.errorMessage = 'Ocurrió un error al consultar el siguiente ítem para picking. ';
            }
        );
    }

    private closeOrderAssignation(username, orderNumber) {
        console.log('closing picking assignation for ' + (orderNumber == null ? 'all orders' : 'order ' + orderNumber));
        this._pickingService.finishPicking(username, orderNumber).subscribe(
            response => {
                if (this.pickingMethod === 'single') {
                    $('#modal_change_picking_method').modal({
                        backdrop: 'static',
                        keyboard: false,
                        show: true
                    });
                }
            }, error => { console.error(error); }
        );
    }

    public scanBinLocation() {
        this.errorMessageBinLocation = '';
        this.confirmingItemQuantity = false;
        this.confirmBinCode = this.confirmBinCode.trim();
        if (this.confirmBinCode !== this.nextBinLocationCode) {
            console.error('no estas en la ubicacion correcta');
            this.errorMessageBinLocation = 'No estás en la ubicación correcta. Revisa el número e intenta de nuevo.';
            $('#modal_error').modal('show');
            return;
        }
        this.confirmingItemQuantity = true;
        document.getElementById("item").style.display = "inline";
        $('#input_pickedItem').focus();
    }

    public confirmItemCode() {
        this.pickedItemCode = this.pickedItemCode.replace(/\s/g, '');
        if (this.pickedItemCode === this.nextItemCode) {
            this.pickedItemCodeValidated = true;
            document.getElementById("qty").style.display = "inline";
            $('#input_pickedQuantity').focus();
        }
    }

    public validatePickedQuantity() {
        if (this.getQuantityToPick() != this.pickedItemQuantity) {
            //show different quantity confirmation
            $('#modal_confirm_quantity_diff').modal({
                backdrop: 'static',
                keyboard: false,
                show: true
            });
        } else {
            this.confirmItemQuantity();
        }
    }

    public confirmItemQuantity() {
        $('#binLoc').focus();
        $('#modal_confirm_quantity_diff').modal('hide');
        console.log('confirmando cantidad para trasladar item, ' + this.nextItemQuantity + ', ' + this.pickedItemQuantity);
        this.pickedItemQuantityValidated = true;
        let itemTransfer = {
            binAbsFrom: this.nextBinAbs,
            binAbsTo: this.selectedCart,
            quantity: this.pickedItemQuantity,
            expectedQuantity: this.getQuantityToPick(),
            itemCode: this.nextItemCode.trim(),
            orderNumber: (this.selectedOrder == null || this.selectedOrder.length === 0) ? this.nextOrderNumber : this.selectedOrder,
            username: this.identity.username,
            warehouseCode: this._userService.getWarehouseCode()
        }
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        console.log('itemTransfer: ', itemTransfer);
        this.errorMessageBinTransfer = '';
        this._stockTransferService.transferSingleItem(itemTransfer).subscribe(
            response => {
                if (response.code === 0) {
                    //Clears bin location, item code and quantity fields; then loads cart inventory and next item
                    itemTransfer = { binAbsFrom: null, binAbsTo: null, quantity: null, expectedQuantity: null, itemCode: null, orderNumber: null, username: null, warehouseCode: null }
                    this.resetForm();
                    $('#modal_transfer_process').modal('hide');
                } else {
                    $('#modal_transfer_process').modal('hide');
                    this.errorMessageBinTransfer = response.content;
                    $('#modal_error').modal('show');
                }
            }, error => {
                $('#modal_transfer_process').modal('hide');
                console.error(error);
                this.errorMessageBinTransfer = JSON.parse(error._body).content;
                $('#modal_error').modal('show');
            }
        );
    }

    public resetForm() {
        //clean picked quantity
        this.pickedItemQuantity = null;
        this.pickedItemQuantityValidated = false;

        //clean pickedItem
        this.pickedItemCode = '';
        this.pickedItemCodeValidated = false;

        //clean next item/location
        this.nextBinLocationCode = null;
        this.nextBinAbs = null;
        this.nextBinStock = null;
        this.nextItemCode = '';
        this.nextItemName = '';
        this.nextItemQuantity = null;
        this.nextBinType = '';

        //clean selected location
        this.confirmingItemQuantity = false;
        this.confirmBinCode = '';

        //reload carts and inventory
        this.loadAvailablePickingCarts();

        document.getElementById("qty").style.display = "none";
        document.getElementById("item").style.display = "none";
        document.getElementById("loc").style.display = "none";

        //reload next item
        this.position = 1;
        if (this.selectedCart <= 0) {
            this.loadNextItem();
        }
    }

    public choosePickingMethod() {
        this.pickingMethod = this.selectedPickingMethod;
        this.disabledSelectCart = false;
        this.selectedCart = 0;
        $('#modal_config').modal('hide');
    }

    public changePickingMethod() {
        this.pickingMethod = 'multiple';
        this.selectedPickingMethod = 'multiple';
        this.selectedOrder = '';
        $('#modal_change_picking_method').modal('hide');
        this.loadAssignedOrders();
        this.loadNextItem();
    }

    public getQuantityToPick() {
        if (this.nextItemQuantity > this.nextBinStock) {
            return this.nextBinStock;
        }
        return this.nextItemQuantity;
    }

    public getBinDetail(fieldName: string) {
        if (!this.nextBinLocationCode) {
            return '';
        }
        switch (fieldName) {
            case 'whs':
                return this.nextBinLocationCode.substring(0, 2);
            case 'area':
                return this.nextBinLocationCode.substring(2, 4);
            case 'calle':
                return this.nextBinLocationCode.substring(4, 6);
            case 'mod':
                return this.nextBinLocationCode.substring(6, 8);
            case 'nivel':
                return this.nextBinLocationCode.substring(8, 10);
            case 'fila':
                return this.nextBinLocationCode.substring(10, 12);
            case 'col':
                return this.nextBinLocationCode.substring(12, 14);
            case 'prof':
                return this.nextBinLocationCode.substring(14, 16);
            default:
                return '';
        }
    }

    public skipItem() {
        $('#modal_confirmar').modal('hide');
        console.log('saltando item, ' + this.nextItemCode);
        this.pickedItemQuantityValidated = true;
        const itemTransfer = {
            binAbsFrom: this.nextBinAbs,
            binAbsTo: this.selectedCart,
            quantity: this.nextItemQuantity,
            expectedQuantity: this.getQuantityToPick(),
            itemCode: this.nextItemCode.trim(),
            orderNumber: (this.selectedOrder == null || this.selectedOrder.length === 0) ? this.nextOrderNumber : this.selectedOrder,
            username: this.identity.username,
            temporary: true,
            warehouseCode: this._userService.getWarehouseCode()
        }
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        console.log('itemTransfer: ', itemTransfer);
        this.errorMessageBinLocation = '';
        this._stockTransferService.transferSingleItem(itemTransfer).subscribe(
            response => {
                if (response.code === 0) {
                    //Clears bin location, item code and quantity fields; then loads cart inventory and next item
                    this.resetForm();
                } else {
                    this.errorMessageBinLocation = response.content;
                    $('#modal_error').modal('show');
                }
                $('#modal_transfer_process').modal('hide');
            }, error => {
                $('#modal_transfer_process').modal('hide');
                console.error(error);
                this.errorMessageBinLocation = JSON.parse(error._body).content;
                $('#modal_error').modal('show');
            }
        );
    }

    public getBackItem() {
        if (this.position > 0) {
            this.position--;
        } else if (this.position <= 0) {
            this.position = 1;
        }
        console.log('Posición ' + this.position + ' de ' + this.countLineNum + ' para picking');
        this.loadNextItem();
    }

    public getNextItem() {
        if (this.position <= this.countLineNum - 1) {
            this.position++;
        } else {
            this.position = 1;
        }
        console.log('Posición ' + this.position + ' de ' + this.countLineNum + ' para picking');
        this.loadNextItem();
    }

    public getBinLocation(bin) {
        this.confirmBinCode = bin.trim();
        $('#binLoc').focus();
    }

    public getPickedItemCode(item) {
        this.pickedItemCode = item.trim();
        $('#input_pickedItem').focus();
    }

    public resetSesionId() {
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
                this.errorMessageBinLocation = "";
                $('#modal_transfer_process').modal('hide');
                console.error("Ocurrio un error al reiniciar los sesion Id", error);
                this.errorMessageBinLocation = "Ocurrio un error al reiniciar los sesion Id";
            }
        );
    }
}