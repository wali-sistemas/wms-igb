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
    public token;
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
    public pickedItemCode: string = '';
    public pickedItemQuantity: number;
    public pickedItemCodeValidated = false;
    public pickedItemQuantityValidated = false;

    public confirmBinCode: string = '';
    public confirmingItemQuantity = false;
    public errorMessage: string = '';
    public errorMessageBinLocation: string = '';
    public errorMessageBinTransfer: string = '';
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
        if (error && error.status && error.status == 401) {
            localStorage.removeItem('igb.identity');
            localStorage.removeItem('igb.selectedCompany');
            this._router.navigate(['/']);
        }
    }

    private loadAvailablePickingCarts() {
        this.availableCarts = new Array<BinLocation>();
        this._binLocationService.listAvailablePickingCarts().subscribe(
            result => {
                console.log('picking carts: ', result);
                for (let i = 0; i < result.length; i++) {
                    let binLocation = new BinLocation();
                    binLocation.binAbs = result[i].binAbs;
                    binLocation.binCode = result[i].binCode;
                    binLocation.binName = result[i].binName;
                    binLocation.items = result[i].items;

                    this.availableCarts.push(binLocation);
                }
                if (this.selectedCart > 0) {
                    this.loadNextItem();
                }
            }, error => {
                console.error(error);
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    private loadAssignedOrders() {
        this.assignedOrders = new Array<SalesOrder>();
        this._salesOrderService.listUserOrders(this.identity.username).subscribe(
            result => {
                console.log('assigned orders:', result);
                for (let i = 0; i < result.length; i++) {
                    let order: SalesOrder = new SalesOrder();
                    order.docNum = result[i][0];
                    order.cardName = result[i][1];
                    this.assignedOrders.push(order);
                }
            }, error => {
                console.error(error);
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    private loadNextItem() {
        this._pickingService.getNextPickingItem(this.identity.username, this.selectedOrder).subscribe(
            result => {
                console.log(result);
                if (result.code == 0) {
                    this.nextItemCode = result.content.itemCode;
                    this.nextItemQuantity = result.content.openQuantity;
                    this.nextBinAbs = result.content.binAbs;
                    this.nextBinStock = result.content.availableQuantity;
                    this.nextBinLocationCode = result.content.binCode;
                    this.nextItemName = result.content.itemName;
                    this.nextOrderNumber = result.content.orderNumber;
                } else if (result.code == -1) {
                    if (this.pickingMethod == 'single') {
                        this.pickingMethod = 'multiple';
                        $('#modal_change_picking_method').modal({
                            backdrop: 'static',
                            keyboard: false,
                            show: true
                        });
                    } else {
                        this.closeOrderAssignation(this.identity.username, null);
                    }
                } else if (result.code == -2) {
                    this.errorMessage = 'Ocurrió un error al consultar el siguiente ítem para picking. ' + result.content;
                }
            }, error => {
                console.error(error);
                this.errorMessage = 'Ocurrió un error al consultar el siguiente ítem para picking. ';
            }
        );
    }

    private closeOrderAssignation(username, orderNumber) {
        this._pickingService.finishPicking(username, orderNumber).subscribe(
            result => {
                console.log(result);
                this._router.navigate(['/']);
            }, error => { console.error(error); }
        );
    }

    public scanBinLocation() {
        this.errorMessageBinLocation = '';
        this.confirmingItemQuantity = false;
        if (this.confirmBinCode != this.nextBinLocationCode) {
            console.error('no estas en la ubicacion correcta');
            this.errorMessageBinLocation = 'No estás en la ubicación correcta. Revisa el número e intenta de nuevo';
            return;
        }
        this.confirmingItemQuantity = true;
    }

    public confirmItemCode() {
        if (this.pickedItemCode === this.nextItemCode) {
            this.pickedItemCodeValidated = true;
            $('#input_pickedQuantity').focus();
        }
    }

    public confirmItemQuantity() {
        console.log('confirmando cantidad para trasladar item, ' + this.nextItemQuantity + ', ' + this.pickedItemQuantity);
        if (this.nextItemQuantity == this.pickedItemQuantity) {
            this.pickedItemQuantityValidated = true;
            //transfer items to cart
            //change order??
            let itemTransfer = {
                binAbsFrom: this.nextBinAbs,
                binAbsTo: this.selectedCart,
                quantity: this.nextItemQuantity,
                itemCode: this.nextItemCode,
                orderNumber: (this.selectedOrder == null || this.selectedOrder.length == 0) ? this.nextOrderNumber : this.selectedOrder,
                username: this.identity.username,
                warehouseCode: '01' //TODO: parametrizar whscode
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
                    console.info(response);
                    if (response.code === 0) {
                        //Clears bin location, item code and quantity fields; then loads cart inventory and next item
                        this.resetForm();
                    } else {
                        this.errorMessageBinTransfer = response.content;
                    }
                    $('#modal_transfer_process').modal('hide');
                }, error => {
                    console.error(JSON.parse(error._body).content);
                    this.errorMessageBinTransfer = JSON.parse(error._body).content;
                    $('#modal_transfer_process').modal('hide');
                }
            );
        }
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

        //clean selected location
        this.confirmingItemQuantity = false;
        this.confirmBinCode = '';

        //reload carts and inventory
        this.loadAvailablePickingCarts();

        //reload next item
        this.loadNextItem();
    }

    public choosePickingMethod() {
        this.pickingMethod = this.selectedPickingMethod;
        $('#modal_config').modal('hide');
        this.loadNextItem();
    }

    public changePickingMethod() {
        this.pickingMethod = 'multiple';
        this.selectedPickingMethod = 'multiple';
        $('#modal_change_picking_method').modal('hide');
        this.loadNextItem();
    }
}
