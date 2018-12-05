import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../services/user.service';
import { SalesOrdersService } from '../../services/sales-orders.service';
import { StockTransferService } from '../../services/stock-transfer.service';
import { BinLocationService } from '../../services/bin-locations.service';
import { PickingService } from '../../services/picking.service';
import { BinLocation } from '../../models/bin-location';
import { SalesOrder } from '../../models/sales-order';

declare var $: any;

@Component({
    templateUrl: './picking.component.html',
    styleUrls: ['./picking.component.css'],
    providers: [UserService, SalesOrdersService, BinLocationService, StockTransferService, PickingService]
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

    public confirmBinCode: string = '';
    public confirmingItemQuantity = false;
    public errorMessage: string = '';
    public errorMessagePickingCarts: string = '';
    public errorMessageBinLocation: string = '';
    public errorMessageBinTransfer: string = '';
    public warningMessageNoOrders: string = '';
    public availableCarts: Array<BinLocation>;
    public assignedOrders: Array<SalesOrder>;

    constructor(private _userService: UserService,
        private _salesOrderService: SalesOrdersService,
        private _binLocationService: BinLocationService,
        private _stockTransferService: StockTransferService,
        private _pickingService: PickingService,
        private _route: ActivatedRoute,
        private _router: Router) {
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
            result => {
                console.log('picking carts: ', result);
                if (result.length === 0) {
                    this.errorMessagePickingCarts = 'No se encontraron carritos de picking habilitados. Se deben configurar ubicaciones tipo CART en SAP, asegurándose de agregar el nombre de cada carrito en el campo descripción';
                } else {
                    for (let i = 0; i < result.length; i++) {
                        const binLocation = new BinLocation();
                        binLocation.binAbs = result[i].binAbs;
                        binLocation.binCode = result[i].binCode;
                        binLocation.binName = result[i].binName;
                        binLocation.items = result[i].items;
                        binLocation.pieces = result[i].pieces;
                        this.availableCarts.push(binLocation);
                    }
                    if (this.selectedCart > 0) {
                        this.loadNextItem();
                    }
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
        this._salesOrderService.listUserOrders(this.identity.username).subscribe(
            result => {
                if (result.code === 0) {
                    console.log('assigned orders:', result.content);
                    for (let i = 0; i < result.content.length; i++) {
                        const order: SalesOrder = new SalesOrder();
                        order.docNum = result.content[i][0];
                        order.cardName = result.content[i][1];
                        this.assignedOrders.push(order);
                    }
                } else {
                    //this._router.navigate(['home']);
                    this.warningMessageNoOrders = 'No se encontraron órdenes asignadas para picking';
                }
            }, error => {
                console.error(error);
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    private loadNextItem() {
        $('#modal_loading_next').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        this._pickingService.getNextPickingItem(this.identity.username, this.selectedOrder).subscribe(
            result => {
                $('#modal_loading_next').modal('hide');
                this.loadAssignedOrders();
                console.log(result);
                if (result.code === 0) {
                    this.nextItemCode = result.content.itemCode.trim();
                    this.nextItemQuantity = result.content.pendingQuantity;
                    this.nextBinAbs = result.content.binAbs;
                    this.nextBinStock = result.content.availableQuantity;
                    this.nextBinLocationCode = result.content.binCode;
                    this.nextItemName = result.content.itemName;
                    this.nextOrderNumber = result.content.orderNumber;
                    this.nextBinType = result.content.binLocationType;
                } else if (result.code === -1) {
                    if (this.pickingMethod === 'multiple') {
                        //this.closeOrderAssignation(this.identity.username, this.selectedOrder);
                    } else {
                        //this.closeOrderAssignation(this.identity.username, null);
                    }
                } else if (result.code === -2) {
                    this.errorMessage = 'Ocurrió un error al consultar el siguiente ítem para picking. ' + result.content;
                } else if (result.code === -3) {
                    this.errorMessage = 'No hay saldo disponible para picking. La orden pasa a estado <span class="warning">warning</span>. ' + result.content;
                }
            }, error => {
                $('#modal_loading_next').modal('hide');
                console.error(error);
                this.errorMessage = 'Ocurrió un error al consultar el siguiente ítem para picking. ';
            }
        );
        $('#binLoc').focus();
    }

    private closeOrderAssignation(username, orderNumber) {
        console.log('closing picking assignation for ' + (orderNumber == null ? 'all orders' : 'order ' + orderNumber));
        this._pickingService.finishPicking(username, orderNumber).subscribe(
            result => {
                console.log('finished closing order picking assignation. ', result);
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
            this.errorMessageBinLocation = 'No estás en la ubicación correcta. Revisa el número e intenta de nuevo';
            return;
        }
        this.confirmingItemQuantity = true;
        $('#filter').focus();
    }

    public confirmItemCode() {
        this.pickedItemCode = this.pickedItemCode.replace(/\s/g, '');
        if (this.pickedItemCode === this.nextItemCode) {
            this.pickedItemCodeValidated = true;
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
        $('#modal_confirm_quantity_diff').modal('hide');
        console.log('confirmando cantidad para trasladar item, ' + this.nextItemQuantity + ', ' + this.pickedItemQuantity);
        this.pickedItemQuantityValidated = true;
        const itemTransfer = {
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
                console.log(response);
                if (response.code === 0) {
                    //Clears bin location, item code and quantity fields; then loads cart inventory and next item
                    this.resetForm();
                } else {
                    this.errorMessageBinTransfer = response.content;
                }
                $('#modal_transfer_process').modal('hide');
            }, error => {
                $('#modal_transfer_process').modal('hide');
                console.error(error);
                this.errorMessageBinTransfer = JSON.parse(error._body).content;
            }
        );
    }

    public resetForm() {
        console.log('reseting form');

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

        //reload next item
        if (this.selectedCart <= 0) {
            this.loadNextItem();
        }
    }

    public choosePickingMethod() {
        this.pickingMethod = this.selectedPickingMethod;
        $('#modal_config').modal('hide');
        this.loadNextItem();
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
        console.log('saltando item, ' + this.nextItemQuantity);
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
                console.log(response);
                if (response.code === 0) {
                    //Clears bin location, item code and quantity fields; then loads cart inventory and next item
                    this.resetForm();
                } else {
                    this.errorMessageBinLocation = response.content;
                }
                $('#modal_transfer_process').modal('hide');
            }, error => {
                $('#modal_transfer_process').modal('hide');
                console.error(error);
                this.errorMessageBinLocation = JSON.parse(error._body).content;
            }
        );
    }
}
