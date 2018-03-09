import { PackingOrderBox } from './../../models/PackingOrderBox';
import { PackingOrder, PackingOrderItem, PackingOrderItemBin } from './../../models/packing-order';
import { SalesOrder } from './../../models/sales-order';
import { Customer } from './../../models/customer';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../services/user.service';
import { SalesOrdersService } from '../../services/sales-orders.service';
import { PickingOrders } from '../../services/picking-orders';
import { PackingService } from '../../services/packing.service';
import { BinLocation } from '../../models/bin-location';
import { forEach } from '@angular/router/src/utils/collection';


declare var $: any;

@Component({
    templateUrl: './packing.component.html',
    styleUrls: ['./packing.component.css'],
    providers: [UserService, SalesOrdersService, PickingOrders, PackingService]
})
export class PackingComponent implements OnInit {
    public identity;
    public token;
    public selectedCart: number = 0;
    public selectedOrder: string = '';
    public selectedOrderInUI: String = '';
    public selectedCustomer: string = '';

    public indexItemOrderSelected = 0;
    public indexItemOrderBinSelected = 0;
    public nextItemCode: String = '';
    public nextItemQuantity: number = -1;
    public packedItemCode: string = '';
    public packedItemQuantity: number;
    public nextBinCode: String = '';
    public binItemCode: String = '';
    public isVisibleShowItemBin: Boolean = false;
    public packedItemCodeValidated = false;
    public packedItemQuantityValidated = false;
    public isPossibleAddNewBox = false;
    public isVisibleItemCode: Boolean = false;

    public confirmingItemQuantity = false;
    public errorMessageBinLocation: string = '';
    public availableCarts: Array<BinLocation>;
    public costumerOrders: Array<PackingOrder>;
    public assignedCustomer: Array<Customer>;
    public assignedOrders: Array<PackingOrder>;
    public packingOrderInUI: PackingOrder;
    public packingOrderItem: PackingOrderItem;
    public packingOrderBox: Array<PackingOrderBox>;
    public packingOrderItemSelected: PackingOrderItem = new PackingOrderItem();
    public costumersToSee: Map<String, String> = new Map();
    public costumersArray: Array<[String, String]> = new Array();
    public orderItemBinSelected: PackingOrderItemBin = new PackingOrderItemBin();

    constructor(private _userService: UserService,
        private _salesOrderService: SalesOrdersService,
        private _packingService: PackingService,
        private _packingOrders: PickingOrders,
        private _route: ActivatedRoute,
        private _router: Router) {
        this.availableCarts = new Array<BinLocation>();
        this.assignedCustomer = new Array<Customer>();
        this.assignedOrders = new Array<PackingOrder>();
        this.packingOrderBox = new Array<PackingOrderBox>();
        this.packedItemQuantity = 0;
    }

    ngOnInit() {
        this.identity = this._userService.getItentity();
        if (this.identity === null) {
            this._router.navigate(['/']);
        }
        $('#modal_quantity').on('shown.bs.modal', function () {
            $('#quantity').focus();
        });
        this.loadCustomer();
    }

    private loadCustomer() {
        this.costumerOrders = new Array<PackingOrder>();
        this._packingService.listPackingRecords().subscribe(
            result => {
                console.log('packing orders:', result);
                for (let i = 0; i < result.content.length; i++) {
                    let row = result.content[i];
                    let packingOrder: PackingOrder = new PackingOrder();
                    packingOrder.packingOrderId = row.idpacking_order;
                    packingOrder.orderNumber = row.order_number;
                    packingOrder.cardCode = row.customer_id;
                    packingOrder.cardName = row.customer_name;
                    packingOrder.status = row.status;
                    packingOrder.itemsOrders = new Array<PackingOrderItem>();

                    for (let key in row.lines) {
                        let line = row.lines[key];
                        console.log(line);

                        let packingItem: PackingOrderItem = new PackingOrderItem();
                        packingItem.itemCode = line.item_code;
                        packingItem.packingOrderItemId = line.idpacking_order_item;
                        packingItem.itemsBin = new Array<PackingOrderItemBin>();

                        for (let binCode in line.bins) {
                            let bin = line.bins[binCode];
                            console.log(bin);

                            let orderItemBin: PackingOrderItemBin = new PackingOrderItemBin();
                            orderItemBin.binAbs = bin.bin_abs;
                            orderItemBin.binCode = bin.bin_code;
                            orderItemBin.packingOrderItemBinId = bin.idpacking_order_item_bin;
                            orderItemBin.packingOrdItemId = line.idpacking_order_item;
                            orderItemBin.pickedQty = bin.picked_qty;
                            orderItemBin.packedQty = bin.packed_qty;

                            packingItem.itemsBin.push(orderItemBin);
                        }
                        packingOrder.itemsOrders.push(packingItem);
                    }
                    this.costumerOrders.push(packingOrder);
                }
                console.log(this.costumerOrders);
                this.sortOrdersUnique();
            }, error => {
                console.error(error);
            }
        );
        
    }

    private sortOrdersUnique() {
        let order = new Map();
        this.costumerOrders.forEach(element => {
            order.set(element.cardCode, element.cardName);
        });
        this.costumersToSee = order;
        this.costumersArray = Array.from(this.costumersToSee);
    }

    public loadOrdersCostumers() {

        this.assignedOrders = new Array<PackingOrder>();
        this.costumerOrders.forEach(element => {
            if (element.cardCode === this.selectedCustomer) {
                this.assignedOrders.push(element);
            }
        });
        this.loadNextItem();
    }

    public showItemBin() {
        this.isVisibleShowItemBin = true;
        this.loadNextItem();
    }

    /*public showItemsOrder(){
        this.assignedOrders.forEach(element => {
            if (element.orderNumber === this.selectedOrder ){
                this.packingOrderItem = element.itemsOrders.pop();
            }
        });
        this.nextItemCode = this.packingOrderItem.itemCode;

        this.loadNextItem();
    }*/

    public confirmBinItemCode() {
        //      Se valida el code de localizacion del los items, 
        //      que en este caso el es carro donde se encuentran
        if (this.nextBinCode == this.binItemCode) {
            this.isVisibleItemCode = true;
        }
    }



    /**
     * Se cargan las cantidades de cada item
     * 
     */
    private loadNextItem() {

        console.log("order in ui es  " + this.selectedOrderInUI);
        console.log("assignedOrder " + this.selectedOrder);
        //if (this.selectedOrderInUI != this.selectedOrder){
        //this.indexItemOrderSelected = 0;
        for (let packingOrderSelected of this.assignedOrders) {
            if (packingOrderSelected.orderNumber === this.selectedOrder) {
                this.packingOrderInUI = packingOrderSelected;
                this.getItemUiFromOrder(packingOrderSelected);
                //this.packingOrderItemSelected = packingOrderSelected.itemsOrders[this.indexItemOrderSelected];

                console.log("el next item es  " + this, this.nextItemCode);
                //console.log(" la cantidad es"+packingOrderSelected.itemsOrders[this.indexItemOrderSelected].itemsBin[this.indexItemOrderBinSelected].pickedQty);

                this.isPossibleAddNewBox = true
                // debe limpiar cajas y cantidad de items
            }
        }
        //this.indexItemOrderSelected++;
        //this.indexItemOrderBinSelected++;
        //} else {
        //    if (this.packingOrderInUI.itemsOrders.length >  this.indexItemOrderSelected) {
        //        this.nextItemCode = this.packingOrderInUI.itemsOrders[this.indexItemOrderSelected].itemCode;
        //        this.nextItemQuantity = this.packingOrderInUI.itemsOrders[this.indexItemOrderSelected].itemsBin[this.indexItemOrderBinSelected].pickedQty;
        //        this.indexItemOrderSelected++;
        //        this.indexItemOrderBinSelected++;
        //        this.isPossibleAddNewBox = true;
        //        console.log("el next item es  "+this,this.nextItemCode);
        //    }
        //}

    }

    private getItemUiFromOrder(packingOrderSelected: PackingOrder) {

        //if (this.packingOrderItem){
        //if (packingOrderSelected.itemsOrders.length > 0){
        this.packingOrderItem = packingOrderSelected.itemsOrders.pop();
        //let packingOrderItem = this.packingOrderItemSelected;
        this.nextItemCode = this.packingOrderItem.itemCode;
        this.orderItemBinSelected = this.packingOrderItem.itemsBin.pop();
        this.nextItemQuantity = this.orderItemBinSelected.pickedQty;
        console.log("La cantidad es  if : " + this.orderItemBinSelected.pickedQty);
        this.selectedOrderInUI = packingOrderSelected.orderNumber;
        this.nextBinCode = this.orderItemBinSelected.binCode;
        //}
        /*} else {
            this.packingOrderItem = packingOrderSelected.itemsOrders.pop() ;
            if (this.packingOrderItem.itemsBin.length > 0){
                //let packingOrderItem = packingOrderSelected.itemsOrders.pop();
                console.log("La cantidad es  else if 0: "+this.packingOrderItem.itemsBin.pop().pickedQty);
                this.orderItemBinSelected = this.packingOrderItem.itemsBin.pop();
                this.nextItemCode = this.packingOrderItem.itemCode;
                console.log("La cantidad es else if 1: "+this.orderItemBinSelected.pickedQty);
                this.nextItemQuantity = this.orderItemBinSelected.pickedQty;
                this.selectedOrderInUI = packingOrderSelected.orderNumber;
            } else {
                this.packingOrderItemSelected = packingOrderSelected.itemsOrders.pop();
                let packingOrderItem = packingOrderSelected.itemsOrders.pop();
                this.nextItemCode = packingOrderItem.itemCode;
                this.orderItemBinSelected = packingOrderItem.itemsBin.pop();
                console.log("La cantidad es else else: "+this.orderItemBinSelected.pickedQty);
                this.nextItemQuantity = this.orderItemBinSelected.pickedQty;
                this.selectedOrderInUI = packingOrderSelected.orderNumber;
            }
        }*/

    }

    private getItemQuantityFromItem() {

    }

    private getNumberItemsUIFromItemsOrder() {


    }

    /**
     * Se obtienen las ordenes del cliente seleccionado
     */
    public loadOrdersForCostumer() {
        for (let salesOrder of this.costumerOrders) {
            if (salesOrder.cardCode === this.selectedCustomer) {
                this.assignedOrders.push(salesOrder);
            }
            console.log(salesOrder);
        }

    }

    public confirmItemCode() {
        if (this.packedItemCode === this.nextItemCode) {
            this.packedItemCodeValidated = true;
            $('#input_packedQuantity').focus();
        }
    }

    public confirmItemQuantity() {
        console.log('confirmando cantidad para empacar item, ' + this.nextItemQuantity + ', ' + this.packedItemQuantity);
        //      se deben sacar las cantidades de order item bin
        //let packingOrderItemSelected : PackingOrderItem = this.selectedOrder.get 
        if (this.packedItemQuantity > 0 || this.nextItemQuantity < this.packedItemQuantity) {
            this.packedItemQuantityValidated = true;
        }
    }

    public addItemBox() {
        if (this.packingOrderBox.length > 0) {
            //      le resto el valor que selecciono
            this.orderItemBinSelected.pickedQty = this.orderItemBinSelected.pickedQty - this.packedItemQuantity;
            //      se coloca el item en la ultima caja
            this.packingOrderBox[this.packingOrderBox.length - 1].itemBinAbs = parseInt(this.orderItemBinSelected.binAbs.toString());
            this.packingOrderBox[this.packingOrderBox.length - 1].addQuantity(this.packedItemQuantity);
            this.packedItemQuantity = 0;
            if (this.orderItemBinSelected.pickedQty != 0) {
                this.packingOrderItem.itemsBin.push(this.orderItemBinSelected);
                this.packingOrderInUI.itemsOrders.push(this.packingOrderItem);
                this.nextItemQuantity = 0;
                this.getItemUiFromOrder(this.packingOrderInUI);
            } else {
                this.packingOrderInUI.itemsOrders.push(this.packingOrderItem);
                this.isVisibleItemCode = false;
                this.binItemCode = "";
                this.nextItemCode = "";
                this.packedItemCode = "";
                this.nextItemQuantity = -1;
                this.packedItemCodeValidated = false;
                this.loadNextItem();
            }

            this.isPossibleAddNewBox = true;
            //this.nextItemCode = "";
        }


    }

    public loadCartInventory() {
        console.log('loading inventory for location ' + this.selectedCart);
    }

    public resetForm() {
        console.log('reseting form');

        //clean picked quantity
        this.packedItemQuantity = null;
        this.packedItemQuantityValidated = false;

        //clean pickedItem
        this.packedItemCode = '';
        this.packedItemCodeValidated = false;

        this.nextItemCode = '';
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


    public addBox() {
        let newBox: PackingOrderBox = new PackingOrderBox();
        newBox.boxShowName = "Caja N";
        this.packingOrderBox.push(newBox);
        this.isPossibleAddNewBox = false;
    }

    public deleteBox() {

    }
}
