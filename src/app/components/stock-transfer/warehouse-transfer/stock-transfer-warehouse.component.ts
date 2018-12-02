import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { GLOBAL } from '../../../services/global';
import { UserService } from '../../../services/user.service';
import { StockTransferService } from '../../../services/stock-transfer.service';
import { BinLocationService } from '../../../services/bin-locations.service';
import { Warehouse } from 'app/models/warehouse';
import { GenericService } from '../../../services/generic';
import { StockItemService } from '../../../services/stock-item.service';

declare var $: any;

@Component({
    templateUrl: './stock-transfer-warehouse.component.html',
    styleUrls: ['./stock-transfer-warehouse.component.css'],
    providers: [UserService, StockTransferService, BinLocationService, GenericService, StockItemService]
})

export class StockTransferWarehouseComponent implements OnInit {
    public urlShared: String = GLOBAL.urlShared;
    public identity;
    public token;

    public fromBin: string = '';
    public toBin: string = '';
    public fromBinId: number;
    public toBinId: number;
    public itemCode: string = '';
    public quantity: number;
    public items: Array<any>;
    public stockTransferErrorMessage: string = null;

    public disabledWhFrom: boolean = false;
    public selectedWarehouseFrom: string = '';
    public selectedWarehouseTo: string = '';
    public warehousesFrom: Array<Warehouse>;
    public warehousesTo: Array<Warehouse>;

    constructor(private _userService: UserService,
        private _stockTransferService: StockTransferService,
        private _binLocationService: BinLocationService,
        private _router: Router, private _genericService: GenericService,
        private _stockItemService: StockItemService) {
        this._userService = _userService;
        this.items = new Array<any>();
        this.warehousesFrom = new Array<Warehouse>();
        this.warehousesTo = new Array<Warehouse>();
    }

    ngOnInit() {
        $('#fromBin').focus();
        this.identity = this._userService.getItentity();
        if (this.identity === null) {
            this._router.navigate(['/']);
        }

        this.listAvailableWarehouses();
    }

    private listAvailableWarehouses() {
        this._genericService.listActivesWarehouses().subscribe(
            response => {
                this.warehousesFrom = response.content;
                this.warehousesTo = response.content;
            }, error => { console.error(error); }
        );
    }

    public updateWarehouseFrom() {
        console.log('entro al metodo');
        this.disabledWhFrom = true;
    }

    /*public validarUbicacion(binCode, type) {
        this.stockTransferErrorMessage = '';
        this._binLocationService.getBinAbs(binCode).subscribe(
            response => {
                if (type === 'to') {
                    if (response.content) {
                        this.toBinId = response.content;
                    } else {
                        this.stockTransferErrorMessage = 'La ubicación de destino no es válida';
                    }
                } else {
                    if (response.content) {
                        this.fromBinId = response.content;
                    } else {
                        this.stockTransferErrorMessage = 'La ubicación de origen no es válida';
                    }
                }
            }, error => {
                console.error(error);
                if (type === 'to') {
                    this.toBinId = null;
                    this.stockTransferErrorMessage = 'La ubicación de destino no es válida';
                } else {
                    this.fromBinId = null;
                    this.stockTransferErrorMessage = 'La ubicación de origen no es válida';
                }
            }
        );
    }*/

    public validarReferencia() {
        this.itemCode = this.itemCode.replace(/\s/g, '');
    }

    public agregarReferencia() {
        if (this.selectedWarehouseFrom == null || this.selectedWarehouseFrom.length <= 0 || this.selectedWarehouseTo == null || this.selectedWarehouseTo.length <= 0 ||
            this.itemCode.length <= 0) {
            this.stockTransferErrorMessage = 'Debe ingresar todos los campos obligatorios.';
        } else {
            if (this.selectedWarehouseFrom == this.selectedWarehouseTo) {
                this.stockTransferErrorMessage = 'No está permitido realizar traslados entre el mismo almacén.'
                return;
            }
            /*Validar que el item exista y que contenga saldo en production*/
            this._stockItemService.stockFind(this.itemCode).subscribe(
                response => {
                    for (let i = 0; i < response.length; i++) {
                        if (response[i][4] == "01PRODUCTION" && response[i][2] > this.quantity) {
                            this.stockTransferErrorMessage = 'entro al if';
                            return;
                        } else {
                            this.stockTransferErrorMessage = 'entro al else';
                        }
                    }
                },
                error => {
                    console.error(error);
                    this.stockTransferErrorMessage = 'Lo sentimos. Se produjo un error interno';
                }
            );
            const newItem = {
                itemCode: this.itemCode,
                quantity: this.quantity == null ? 1 : this.quantity,
                fromWhsCode: this.selectedWarehouseFrom,
                whsCode: this.selectedWarehouseTo
            };
            this.items.unshift(newItem);
            this.limpiarLinea();
        }
    }

    private limpiarLinea() {
        this.itemCode = '';
        this.quantity = null;
    }

    private limpiarTodo() {
        this.limpiarLinea();
        this.toBin = '';
        this.toBinId = null;
        this.fromBin = '';
        this.fromBinId = null;
        this.items = new Array<any>();
    }

    public crearTraslado() {
        this.stockTransferErrorMessage = null;
        const stockTransfer = {
            username: this.identity.username,
            binCodeFrom: "09PRODUCTION",
            binCodeTo: "01PRODUCTION",
            binAbsFrom: "419",
            binAbsTo: "420",
            warehouseCode: this.selectedWarehouseTo,
            filler: this.selectedWarehouseFrom,
            lines: this.items
        };
        console.log('**********');
        console.log(stockTransfer);
        console.log('**********');

        this._stockTransferService.stockTransferBetweenWarehouse(stockTransfer).subscribe(
            response => {
                if (response.code === 0) {
                    this.limpiarTodo();
                } else {
                    this.stockTransferErrorMessage = response.content;
                }
            }, error => {
                console.error(error);
                if (error._body) {
                    this.stockTransferErrorMessage = JSON.parse(error._body).content;
                } else {
                    this.stockTransferErrorMessage = 'Ocurrió un error no identificado al intentar realizar el traslado';
                }
            }
        );
    }
}
