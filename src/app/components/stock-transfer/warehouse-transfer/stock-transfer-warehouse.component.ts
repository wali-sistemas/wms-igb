import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { GLOBAL } from '../../../services/global';
import { UserService } from '../../../services/user.service';
import { StockTransferService } from '../../../services/stock-transfer.service';
import { BinLocationService } from '../../../services/bin-locations.service';
import { GenericService } from '../../../services/generic';
import { StockItemService } from '../../../services/stock-item.service';
import { ReportService } from '../../../services/report.service';

declare var $: any;

@Component({
    templateUrl: './stock-transfer-warehouse.component.html',
    styleUrls: ['./stock-transfer-warehouse.component.css'],
    providers: [UserService, StockTransferService, BinLocationService, GenericService, StockItemService, ReportService]
})

export class StockTransferWarehouseComponent implements OnInit {
    public urlShared: String = GLOBAL.urlShared;
    public identity;
    public token;
    public fromBin: string = '';
    public toBin: string = '';
    public fromBinId: number;
    public toBinId: number;
    public dftBinAbs: number;
    public itemCode: string = '';
    public quantity: number;
    public items: Array<any>;
    public stockTransferErrorMessage: string = '';
    public stockTransferExitMessage: string = '';
    public disabledWhFrom: boolean = false;
    public selectedWarehouseFrom: string = '';
    public selectedWarehouseTo: string = '';
    public warehousesFrom: Array<any>;
    public warehousesTo: Array<any>;
    public transferNumber: string = '';

    constructor(private _userService: UserService,
        private _stockTransferService: StockTransferService,
        private _binLocationService: BinLocationService,
        private _router: Router, private _genericService: GenericService,
        private _stockItemService: StockItemService,
        private _reportService: ReportService) {
        this._userService = _userService;
        this.items = new Array<any>();
        this.warehousesFrom = new Array<any>();
        this.warehousesTo = new Array<any>();
    }

    ngOnInit() {
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

    public updateWarehouseFrom() {
        this.disabledWhFrom = true;
    }

    public updateWarehouseTo() {
        for (let i = 0; i < this.warehousesTo.length; i++) {
            if (this.warehousesTo[i].code == this.selectedWarehouseTo) {
                this.dftBinAbs = this.warehousesTo[i].dftBinAbs;
                break;
            }
        }
    }

    public validarReferencia() {
        this.stockTransferErrorMessage = '';
        this.stockTransferExitMessage = '';
        this.itemCode = this.itemCode.replace(/\s/g, '');
    }

    public validarUbicacion(bin, type) {
        this.stockTransferErrorMessage = '';
        this.stockTransferExitMessage = '';
        this._binLocationService.getBinAbs(bin.toUpperCase()).subscribe(
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

        if (this.selectedWarehouseFrom == null || this.selectedWarehouseFrom.length <= 0 || this.selectedWarehouseTo == null || this.selectedWarehouseTo.length <= 0 ||
            this.itemCode.length <= 0 || this.quantity <= 0) {
            $('#modal_transfer_process').modal('hide');
            this.stockTransferErrorMessage = 'Debe ingresar todos los campos obligatorios.';
        } else {
            if (this.selectedWarehouseFrom == this.selectedWarehouseTo) {
                $('#modal_transfer_process').modal('hide');
                this.stockTransferErrorMessage = 'No está permitido realizar traslados entre el mismo almacén.'
                return;
            }

            this._stockItemService.stockFind(this.itemCode.toUpperCase(), this.selectedWarehouseFrom).subscribe(
                response => {
                    let disponible;
                    for (let i = 0; i < response.length; i++) {
                        if (response[i][4] == this.fromBin.toUpperCase() && response[i][2] >= this.quantity) {
                            const newItem = {
                                itemCode: this.itemCode.toUpperCase(),
                                quantity: this.quantity == null ? 1 : this.quantity,
                                fromWhsCode: this.selectedWarehouseFrom,
                                whsCode: this.selectedWarehouseTo
                            };
                            this.items.unshift(newItem);
                            this.limpiarLinea();
                            $('#modal_transfer_process').modal('hide');
                            $('#itemCode').focus();
                            disponible = true;
                            return;
                        } else {
                            disponible = false;
                        }
                    }
                    if (!disponible) {
                        $('#modal_transfer_process').modal('hide');
                        this.stockTransferErrorMessage = 'No se encontro stock para trasladar.';
                    }
                },
                error => {
                    console.error(error);
                    this.redirectIfSessionInvalid(error);
                    $('#modal_transfer_process').modal('hide');
                    this.stockTransferErrorMessage = 'Lo sentimos. Se produjo un error interno';
                }
            );
        }
    }

    public openReport(documento: string, origen: string) {
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        if (this.transferNumber != null) {
            let printReportDTO = {
                "id": this.transferNumber, "copias": 0, "documento": documento, "companyName": this.identity.selectedCompany, "origen": origen, "imprimir": false
            }
            this._reportService.generateReport(printReportDTO).subscribe(
                response => {
                    if (response.code == 0) {
                        let landingUrl = this.urlShared + this.identity.selectedCompany + "/" + documento + "/" + this.transferNumber + ".pdf";
                        window.open(landingUrl, "_self");
                    }
                    $('#modal_transfer_process').modal('hide');
                },
                error => {
                    console.error('Ocurrio un error al guardar la transferencia de stock.', error);
                    $('#modal_transfer_process').modal('hide');
                }
            );
        }
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
            //TODO: se asigna campo this.dftBinAbs cuando se defina por defecto una ubicación
            binAbsTo: this.toBinId,
            warehouseCode: this.selectedWarehouseTo,
            filler: this.selectedWarehouseFrom,
            lines: this.items
        };
        this._stockTransferService.stockTransferBetweenWarehouse(stockTransfer).subscribe(
            response => {
                if (response.code === 0) {
                    this.limpiarTodo();
                    $('#modal_transfer_process').modal('hide');

                    $('#modal_visualize_transfer').modal({
                        backdrop: 'static',
                        keyboard: false,
                        show: true
                    });

                    this.transferNumber = response.content;
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
}