import { PackingOrdeBox } from './../../models/PackingOrderBox';
import { PackingOrder, PackingOrderItem, PackingOrderItemBin } from './../../models/packing-order';
import { SalesOrder } from './../../models/sales-order';
import { Customer } from './../../models/customer';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../services/user.service';
import { SalesOrdersService } from '../../services/sales-orders.service';
import { PickingOrders } from '../../services/picking-orders';
import { BinLocation } from '../../models/bin-location';
import { forEach } from '@angular/router/src/utils/collection';


declare var $: any;

@Component({
    templateUrl: './packing.component.html',
    styleUrls: ['./packing.component.css'],
    providers: [UserService, SalesOrdersService, PickingOrders]
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
    public nextItemQuantity: number;
    public packedItemCode: string = '';
    public packedItemQuantity: number;
    public packedItemCodeValidated = false;
    public packedItemQuantityValidated = false;
    public isPossibleAddNewBox = false;

    public confirmingItemQuantity = false;
    public errorMessageBinLocation: string = '';
    public availableCarts: Array<BinLocation>;
    public costumerOrders: Array<PackingOrder>;
    public assignedCustomer: Array<Customer>;
    public assignedOrders: Array<PackingOrder>;
    public packingOrderInUI: PackingOrder;
    public packingOrderItem: Array<PackingOrderItem>;
    public packingOrderBox: Array<PackingOrdeBox>;

    constructor(private _userService: UserService,
        private _salesOrderService: SalesOrdersService,
        private _packingOrders: PickingOrders,
        private _route: ActivatedRoute,
        private _router: Router) {
        this.availableCarts = new Array<BinLocation>();
        this.assignedCustomer = new Array<Customer>();
        this.assignedOrders = new Array<PackingOrder>();
        this.packingOrderItem = new Array<PackingOrderItem>();
        this.packingOrderBox = new Array<PackingOrdeBox>();
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
        this.loadCostumerOrders();
    }

    private loadCostumerOrders() {
        this.costumerOrders = new Array<PackingOrder>();
        /*this._packingOrders.listAvailableCostumerOrders().subscribe(
            result => {
                console.log('packing orders:', result);
                for (let i = 0; i < result.length; i++) {
                    let packingOrder: PackingOrder = new PackingOrder();
                    packingOrder.packingOrderId = result[i][0];
                    packingOrder.orderNumber = result[i][1];
                    packingOrder.cardCode = result[i][2];
                    packingOrder.cardName = result[i][3];
                    packingOrder.status = result[i][4];
                    this.costumerOrders.push(packingOrder);
                }
                
            }, error => { console.error(error); }           
        );*/
        
        let packingOrderDummy : PackingOrder = new PackingOrder();
        packingOrderDummy.packingOrderId = 1;
        packingOrderDummy.orderNumber = "200";
        packingOrderDummy.cardCode = "1.cardCode";
        packingOrderDummy.cardName = "el primero";
        packingOrderDummy.status = "Para empacar";
        let packingItem: PackingOrderItem = new PackingOrderItem();
        packingItem.itemCode = "IEMCODE00001";
        packingItem.packingOrderItemId = 1;
        packingItem.packingOrderItemId = 1;
        let orderItemBin: PackingOrderItemBin = new PackingOrderItemBin();
        orderItemBin.binAbs = "abs1";
        orderItemBin.binCode = "IEMCODE00001";
        orderItemBin.packingOrderItemBinId = 1;
        orderItemBin.packingOrdItemId = 1;
        orderItemBin.pickedQty = 10;
        orderItemBin.packedQty = 0;
        packingItem.itemsBin = new Array<PackingOrderItemBin>();
        packingOrderDummy.itemsOrders = new Array<PackingOrderItem>();
        packingItem.itemsBin.push(orderItemBin);
        packingOrderDummy.itemsOrders.push(packingItem);

        /*let order: PackingOrder = new PackingOrder();
        console.log('kkkkkkkkkkkkkkkkkkkkkkk');
            order.orderNumber = "la primera";
            
            order.cardCode = "1.primero";
            order.cardName = "2.segundo";
            this.costumerOrders.push(order);
            let customerArra : Customer = new Customer();
            customerArra.customerId = "2.segundo"; 
            customerArra.customerName = "el segundo";            
            this.assignedCustomer.push(customerArra);
            customerArra = new Customer();
            customerArra.customerId = "1.primero"; 
            customerArra.customerName = "el primero";
            this.assignedCustomer.push(customerArra);
        */
        //      se ordenan las ordenes por cliente
        this.costumerOrders.push( packingOrderDummy );
        /*var sortedClient: Array<PackingOrder> = this.costumerOrders.sort(function(a:PackingOrder, b:PackingOrder) {
            
            if (a.cardCode > b.cardCode) {
               return 1;
            }
            if (a.cardCode < b.cardCode) {
                return -1;
            }
            return 0;
        });

        this.costumerOrders = sortedClient;*/
    }

    public loadOrdersCostumers(){

        this.assignedOrders = new Array<PackingOrder>();
        this.costumerOrders.forEach(element => {
            if (element.cardCode === this.selectedCustomer){
                this.assignedOrders.push(element);
            }
        });
    }

    public showItemsOrder(){
        var recorridoItems = 0;
        this.assignedOrders.forEach(element =>{
            this.packingOrderItem = element.itemsOrders; 
            element.itemsOrders.forEach(element2 => {
                if (recorridoItems === 0 ){
                    this.nextItemCode = element2.itemCode;
                    
                    recorridoItems++;
                }
            });
        });
        this.loadNextItem();
    }

    /**
     * Se cargan las cantidades de cada item
     * 
     */ 
    private loadNextItem() {

        if (this.selectedOrderInUI != this.selectedOrder){
            this.indexItemOrderSelected = 0;
            for (let packingOrderSelected of this.assignedOrders){
                if (packingOrderSelected.orderNumber === this.selectedOrder){
                    this.packingOrderInUI = packingOrderSelected
                    this.nextItemCode = packingOrderSelected.itemsOrders[this.indexItemOrderSelected].itemCode;
                    console.log(" la cantidad es"+packingOrderSelected.itemsOrders[this.indexItemOrderSelected].itemsBin[this.indexItemOrderBinSelected].pickedQty);
                    this.nextItemQuantity = packingOrderSelected.itemsOrders[this.indexItemOrderSelected].itemsBin[this.indexItemOrderBinSelected].pickedQty;
                    this.selectedOrderInUI = packingOrderSelected.orderNumber;
                    this.isPossibleAddNewBox = true
                    // debe limpiar cajas y cantidad de items
                }
            }
            this.indexItemOrderSelected++;
            this.indexItemOrderBinSelected++;
        } else {
            this.nextItemCode = this.packingOrderInUI.itemsOrders[this.indexItemOrderSelected].itemCode;
            this.nextItemQuantity = this.packingOrderInUI.itemsOrders[this.indexItemOrderSelected].itemsBin[this.indexItemOrderBinSelected].pickedQty;
            this.indexItemOrderSelected++;
            this.indexItemOrderBinSelected++;
        }
    }

    /**
     * Se obtienen las ordenes del cliente seleccionado
     */
    public loadOrdersForCostumer(){
        for (let salesOrder of this.costumerOrders) {
            if(salesOrder.cardCode === this.selectedCustomer){
                this.assignedOrders.push( salesOrder);
            }
            console.log(salesOrder); // 1, "string", false
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
        if (this.nextItemQuantity == this.packedItemQuantity) {
            this.packedItemQuantityValidated = true;
        }
    }
    
    public addItemBox(){
        //      se coloca el item en la ultima caja
        this.packingOrderBox[this.packingOrderBox.length-1].packingOrderItemBin.push();
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


    public addBox(){
        let newBox :  PackingOrdeBox =  new PackingOrdeBox();
        newBox.boxShowName = "Caja N";
        this.packingOrderBox.push(newBox);
    }

    public deleteBox(){

    }
}
