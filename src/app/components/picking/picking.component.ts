import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../services/user.service';
import { SalesOrdersService } from '../../services/sales-orders.service';
import { BinLocationService } from '../../services/bin-locations.service';
import { BinLocation } from '../../models/bin-location';
import { SalesOrder } from 'app/models/sales-order';

declare var $: any;

@Component({
    templateUrl: './picking.component.html',
    styleUrls: ['./picking.component.css'],
    providers: [UserService, SalesOrdersService, BinLocationService]
})
export class PickingComponent implements OnInit {
    public identity;
    public token;
    public pickingMethod: string = 'multiple';
    public selectedCart: number = 0;
    public selectedOrder: string = '';

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
    public errorMessageBinLocation: string = '';
    public availableCarts: Array<BinLocation>;
    public assignedOrders: Array<SalesOrder>;

    constructor(private _userService: UserService,
        private _salesOrderService: SalesOrdersService,
        private _binLocationService: BinLocationService,
        private _route: ActivatedRoute,
        private _router: Router) {
        this.availableCarts = new Array<BinLocation>();
    }

    ngOnInit() {
        //TODO: validar vigencia del token/identity
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
                this.loadNextItem();
            }, error => { console.error(error); }
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
            }, error => { console.error(error); }
        );
    }

    private loadNextItem() {
        this._salesOrderService.getNextPickingItem(this.identity.username, this.selectedOrder).subscribe(
            result => {
                console.log(result);
                this.nextItemCode = result[0][0];
                this.nextItemQuantity = result[0][1];
                this.nextBinAbs = result[0][3];
                this.nextBinStock = result[0][4];
                this.nextBinLocationCode = result[0][5];
                this.nextItemName = result[0][6];
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
                warehouseCode: '01' //TODO: parametrizar whscode
            }
            //TODO: mostrar backdrop mientras se procesa el traslado y limpiar formulario en caso de traslado exitoso
            console.log('itemTransfer: ', itemTransfer);
            this._binLocationService.transferSingleItem(itemTransfer).subscribe(
                response => {
                    console.info(response);
                }, error => {
                    console.error(error);
                }
            );
        }
    }

    public loadCartInventory() {
        console.log('loading inventory for location ' + this.selectedCart);
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

        //reload selected cart inventory
        this.loadCartInventory();

        //reload next item
        this.loadNextItem();
    }

    public chooseOrder() {
        $('#modal_config').modal('hide');
        this.loadNextItem();
    }
}
