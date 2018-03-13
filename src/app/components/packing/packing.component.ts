import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { PackingBox } from './../../models/packing-box';
import { PackingRecord } from '../../models/packing-record';

import { UserService } from '../../services/user.service';
import { PackingService } from '../../services/packing.service';

declare var $: any;

@Component({
    templateUrl: './packing.component.html',
    styleUrls: ['./packing.component.css'],
    providers: [UserService, PackingService]
})
export class PackingComponent implements OnInit {

    public quantityErrorMessage: string = '';
    public customersList: Array<any>;
    public ordersList: Array<number>;
    public selectedCustomer: string = '';
    public selectedOrder: number = 0;
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
    private identity;
    private idPackingList: number;
    private idPackingOrder: number;

    constructor(
        private _userService: UserService,
        private _packingService: PackingService,
        private _router: Router) {
        this.customersList = new Array<any>();
        this.ordersList = new Array<any>();
        this.orderItemsList = new Array<any>();
        this.boxes = new Array<PackingBox>();
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
    }

    private listOpenJobs() {
        this._packingService.listOpenJobRecords(this.identity.username).subscribe(
            response => {
                console.log('registros de packing abiertos: ', response);
                if (response.content.length > 0) {
                    console.log('procesando registros...');
                    let firstRecord = response.content[0];
                    this.selectedOrder = firstRecord[2];
                    this.selectedCustomer = firstRecord[3];
                    this.idPackingList = firstRecord[1];
                    this.idPackingOrder = firstRecord[9];
                    for (let i = 0; i < response.content.length; i++) {
                        let record = response.content[i];

                        if (this.boxes.length < record[11]) {
                            //Si hay que agregar la caja
                            let box = new PackingBox();
                            box.boxDisplayName = "Caja #" + record[11];
                            box.boxNumber = record[11];
                            box.addQuantity(record[8]);
                            this.boxes.push(box);
                        } else {
                            //Si hay que agregar la cantidad a una caja existente
                            this.boxes[record[11] - 1].addQuantity(record[8]);
                        }

                    }
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
        if (!this.binCode || this.binCode.length === 0) {
            return;
        }
        console.log('validando si la ubicacion ' + this.binCode + ' contiene items de la orden seleccionada');
        this._packingService.validateBinCode(this.binCode, this.selectedOrder).subscribe(
            response => {
                console.log('existen ' + response.content + ' items en la ubicacion ' + this.binCode + ' para la orden ' + this.selectedOrder);
                if (response && response.content && response.content > 0) {
                    this.isVisibleItemCode = true;
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
        console.log('validando el item ' + this.itemCode);
        this._packingService.validateItem(this.itemCode, this.binCode, this.selectedOrder).subscribe(
            response => {
                if (response && response.content && response.content > 0) {
                    this.expectedItemQuantity = response.content;
                    this.packedItemCodeValidated = true;
                }
            }, error => {
                console.error('ocurrio un error al validar la ubicacion. ', error);
            }
        );
    }

    public validateItemQuantity() {
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

            let packingRecord = new PackingRecord();
            packingRecord.idPackingList = this.idPackingList;
            packingRecord.binCode = this.binCode;
            packingRecord.itemCode = this.itemCode;
            packingRecord.quantity = this.itemQuantity;
            packingRecord.boxNumber = this.boxes[this.addToBox].boxNumber;
            packingRecord.customerId = this.selectedCustomer;
            packingRecord.orderNumber = this.selectedOrder;
            packingRecord.employee = this.identity.username;
            packingRecord.pickingOrder = 1;

            this._packingService.createPackingRecord(packingRecord).subscribe(
                response => {
                    console.log(response.content);
                    if (response.code === 0) {
                        this.idPackingList = response.content.idPackingList;
                        this.boxes[this.addToBox].addQuantity(this.itemQuantity);

                        this.reset();
                    }
                }, error => {
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

    public setIdPackingOrder() {
        for (let i = 0; i < this.ordersList.length; i++) {
            if (this.ordersList[i][1] === this.selectedOrder) {
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

}
