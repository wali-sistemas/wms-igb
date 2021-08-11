import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { GLOBAL } from '../../../services/global';
import { UserService } from '../../../services/user.service';
import { StockTransferService } from '../../../services/stock-transfer.service';
import { BinLocationService } from '../../../services/bin-locations.service';
import { GenericService } from '../../../services/generic';
import { StockItemService } from '../../../services/stock-item.service';
import { ModulaService } from '../../../services/modula.service';
import { ThrowStmt } from '@angular/compiler';

declare var $: any;

@Component({
    templateUrl: './stock-transfer-modula.component.html',
    styleUrls: ['./stock-transfer-modula.component.css'],
    providers: [UserService, StockTransferService, BinLocationService, GenericService, StockItemService, ModulaService]
})

export class StockTransferModulaComponent implements OnInit {
    public urlShared: String = GLOBAL.urlShared;
    public identity;
    public token;
    public fromBin: string = '';
    public toBin: string = '30PRODUCTION';
    public fromBinId: number;
    public toBinId: number;
    public dftBinAbs: number = 85307;
    public itemCode: string = '';
    public quantity: number;
    public items: Array<any>;
    public stockTransferErrorMessage: string = '';
    public stockTransferExitMessage: string = '';
    public disabledWhFrom: boolean = false;
    public selectedWarehouseFrom: string = '01';
    public selectedWarehouseTo: string = '30';
    public warehousesFrom: Array<any>;
    public warehousesTo: Array<any>;

    constructor(private _userService: UserService,
        private _stockTransferService: StockTransferService,
        private _binLocationService: BinLocationService,
        private _router: Router, private _genericService: GenericService,
        private _stockItemService: StockItemService,
        private _modulaService: ModulaService) {
        this._userService = _userService;
        this.items = new Array<any>();
        this.warehousesFrom = new Array<any>();
        this.warehousesTo = new Array<any>();
    }

    ngOnInit() {
        //TODO: validar vigencia del token/identity 
        this.identity = this._userService.getItentity();
        if (this.identity === null) {
            this._router.navigate(['/']);
        }

        $('#itemCode').focus();
        this.identity = this._userService.getItentity();
        if (this.identity === null) {
            this._router.navigate(['/']);
        }

        this.listAvailableWarehouses();
    }

    private redirectIfSessionInvalid(error) {
        if (error && error.status && error.status === 401) {
            localStorage.removeItem('igb.identity');
            localStorage.removeItem('igb.selectedCompany');
            this._router.navigate(['/']);
        }
    }

    private listAvailableWarehouses() {
        this._genericService.listAvailableWarehouses().subscribe(
            response => {
                this.warehousesFrom = response.content;
                this.warehousesTo = response.content;
            }, error => {
                console.error(error);
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    public validarReferencia() {
        this.stockTransferErrorMessage = '';
        this.stockTransferExitMessage = '';
        this.itemCode = this.itemCode.replace(/\s/g, '');
    }

    public validarUbicacion(fromBin, type) {
        this.stockTransferErrorMessage = '';
        this.stockTransferExitMessage = '';
        this._binLocationService.getBinAbs(fromBin.toUpperCase()).subscribe(
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
    }

    public agregarReferencia() {
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        this.stockTransferErrorMessage = '';
        this.stockTransferExitMessage = '';
        if (this.itemCode == null || this.itemCode.length <= 0 || this.quantity == null || this.quantity == 0) {
            $('#modal_transfer_process').modal('hide');
            this.stockTransferErrorMessage = 'Debe ingresar todos los campos obligatorios.';
        }

        //Validar si el item si esta creado en modula
        this._modulaService.getValidateItem(this.itemCode).subscribe(
            response => {
                if (response.code === 0) {
                    this._stockItemService.checkOutStockItem(this.itemCode.toUpperCase(), this.fromBin.toUpperCase()).subscribe(
                        response => {
                            if (response[2] >= this.quantity) {
                                for (let i = 0; i < this.items.length; i++) {
                                    if (this.items[i].itemCode == this.itemCode) {
                                        if (response[2] > this.items[i].quantity) {
                                            this.items[i].quantity += this.quantity;
                                            this.limpiarLinea();
                                            $('#modal_transfer_process').modal('hide');
                                            return;
                                        } else {
                                            $('#modal_transfer_process').modal('hide');
                                            this.stockTransferErrorMessage = 'No hay suficiente stock. Disponible: ' + response[2];
                                            this.limpiarLinea();
                                            return;
                                        }
                                    }
                                }
                                this.addItem();
                            } else {
                                $('#modal_transfer_process').modal('hide');
                                this.stockTransferErrorMessage = 'No encontro stock disponible en la ubicación ' + this.fromBin + '.';
                                this.limpiarLinea();
                            }
                        },
                        error => {
                            console.error(error);
                            this.redirectIfSessionInvalid(error);
                            $('#modal_transfer_process').modal('hide');
                            this.stockTransferErrorMessage = 'Lo sentimos. Se produjo un error interno.';
                        }
                    );
                } else {
                    $('#modal_transfer_process').modal('hide');
                    this.stockTransferErrorMessage = response.content;
                }
            }, error => {
                console.error(error);
                this.stockTransferErrorMessage = 'Lo sentimos. Se produjo un error invocando el api de modula.';
            }
        );
    }

    private addItem() {
        const newItem = {
            itemCode: this.itemCode.toUpperCase(),
            quantity: this.quantity,
            toBin: this.toBin.toUpperCase(),
            fromBin: this.fromBin.toUpperCase()
        };
        this.items.unshift(newItem);
        this.limpiarLinea();
        $('#modal_transfer_process').modal('hide');
    }

    public limpiarLinea() {
        this.itemCode = '';
        this.quantity = null;
    }

    public limpiarTodo() {
        this.stockTransferErrorMessage = '';
        this.stockTransferExitMessage = '';
        this.limpiarLinea();
        this.toBin = '';
        this.toBinId = null;
        this.fromBin = '';
        this.fromBinId = null;
        this.items = new Array<any>();
        this.selectedWarehouseTo = '';
        this.selectedWarehouseFrom = '';
    }

    public crearTraslado() {
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        this.stockTransferErrorMessage = '';
        this.stockTransferExitMessage = '';

        const stockTransfer = {
            username: this.identity.username,
            binCodeFrom: this.fromBin.toUpperCase(),
            binAbsFrom: this.fromBinId,
            binAbsTo: this.dftBinAbs,
            warehouseCode: this.selectedWarehouseTo,
            filler: this.selectedWarehouseFrom,
            lines: this.items
        };

        this._stockTransferService.stockTransferBetweenWarehouse(stockTransfer).subscribe(
            response => {
                console.log(response);
                if (response.code === 0) {
                    this.depositarStockModula(response.content);
                } else {
                    $('#modal_transfer_process').modal('hide');
                    this.stockTransferErrorMessage = response.content;
                }
            }, error => {
                console.error(error);
                this.redirectIfSessionInvalid(error);
                if (error._body) {
                    $('#modal_transfer_process').modal('hide');
                    this.stockTransferErrorMessage = JSON.parse(error._body).content;
                } else {
                    $('#modal_transfer_process').modal('hide');
                    this.stockTransferErrorMessage = 'Ocurrió un error no identificado al intentar realizar el traslado';
                }
            }
        );
    }

    public eliminarItem(itemCode: string) {
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        this.stockTransferErrorMessage = '';
        this.stockTransferExitMessage = '';
        $('#itemCode').focus();
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].itemCode == itemCode) {
                this.items.splice(i, 1);
                $('#modal_transfer_process').modal('hide');
                this.stockTransferExitMessage = 'Ítem eliminado correctamente.';
            }
        }
    }

    public depositarStockModula(docEntry: string) {
        const orderModulaDTO = {
            "docEntry": docEntry,
            "type": "V",
            "detail": this.items
        }

        console.log(orderModulaDTO);
        

        this._modulaService.postStockDeposit(orderModulaDTO).subscribe(
            response => {
                if (response.code == 0) {
                    this.limpiarTodo();
                    this.stockTransferExitMessage = 'Traslado creado correctamente.'
                } else {
                    this.stockTransferErrorMessage = response.content;
                }
                $('#modal_transfer_process').modal('hide');
            }, error => {
                $('#modal_transfer_process').modal('hide');
                console.error(error);
            }
        );
    }

    public validarItemModula(itemCode: String) {
        this._modulaService.getValidateItem(itemCode).subscribe(
            response => {
                if (response.code == 0) {

                }
            }, error => {
                console.error(error);
            }
        );
    }
}