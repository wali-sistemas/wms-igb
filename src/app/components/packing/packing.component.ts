import { PackingOrder } from './../../models/packing-order';
import { SalesOrder } from './../../models/sales-order';
import { Customer } from './../../models/customer';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../services/user.service';
import { SalesOrdersService } from '../../services/sales-orders.service';
import { PickingOrders } from '../../services/picking-orders';
import { BinLocation } from '../../models/bin-location';


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
    public nextItemCode: String = '';
    public nextItemQuantity: number;
    public packedItemCode: string = '';
    public packedItemQuantity: number;
    public packedItemCodeValidated = false;
    public packedItemQuantityValidated = false;

    public confirmingItemQuantity = false;
    public errorMessageBinLocation: string = '';
    public availableCarts: Array<BinLocation>;
    public costumerOrders: Array<PackingOrder>;
    public assignedCustomer: Array<Customer>;
    public assignedOrders: Array<PackingOrder>;
    public packingOrderInUI: PackingOrder;

    constructor(private _userService: UserService,
        private _salesOrderService: SalesOrdersService,
        private _packingOrders: PickingOrders,
        private _route: ActivatedRoute,
        private _router: Router) {
        this.availableCarts = new Array<BinLocation>();
        this.assignedCustomer = new Array<Customer>();
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
        this._packingOrders.listAvailableCostumerOrders().subscribe(
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
        );
        
        let order: PackingOrder = new PackingOrder();
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

        //      se ordenan las ordenes por cliente
        var sortedClient: Array<PackingOrder> = this.costumerOrders.sort(function(a:PackingOrder, b:PackingOrder) {
            
            if (a.cardCode > b.cardCode) {
               return 1;
            }
            if (a.cardCode < b.cardCode) {
                return -1;
            }
            return 0;
        });

        this.costumerOrders = sortedClient;
    }

    private loadNextItem() {

        if (this.selectedOrderInUI != this.selectedOrder){
            this.indexItemOrderSelected = 0;
            for (let packingOrderSelected of this.assignedOrders){
                if (packingOrderSelected.orderNumber === this.selectedOrder){
                    this.packingOrderInUI = packingOrderSelected
                    this.nextItemCode = packingOrderSelected.itemsOrders[this.indexItemOrderSelected].itemCode;
                    this.selectedOrderInUI = packingOrderSelected.orderNumber;
                    // debe limpiar cajas y cantidad de items
                }
            }
            this.indexItemOrderSelected++;
        } else {
            this.nextItemCode = this.packingOrderInUI.itemsOrders[this.indexItemOrderSelected].itemCode;
            this.indexItemOrderSelected++;
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

    /*public confirmItemQuantity() {
        console.log('confirmando cantidad para trasladar item, ' + this.nextItemQuantity + ', ' + this.packedItemQuantity);
        if (this.nextItemQuantity == this.packedItemQuantity) {
            this.packedItemQuantityValidated = true;
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
    }*/

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
}
