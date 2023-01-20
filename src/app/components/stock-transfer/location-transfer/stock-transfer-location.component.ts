import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { GLOBAL } from '../../../services/global';
import { UserService } from '../../../services/user.service';
import { StockTransferService } from '../../../services/stock-transfer.service';
import { BinLocationService } from '../../../services/bin-locations.service';
import { StockItemService } from '../../../services/stock-item.service';
import { ReportService } from '../../../services/report.service';

declare var $: any;

@Component({
    templateUrl: './stock-transfer-location.component.html',
    styleUrls: ['./stock-transfer-location.component.css'],
    providers: [UserService, StockTransferService, BinLocationService, StockItemService, ReportService]
})

export class StockTransferLocationComponent implements OnInit {
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
    public stockTransferErrorMessage: string = '';
    public stockTransferExitMessage: string = '';
    public routerLinkActive: string = 'active';
    public disabled: boolean = false;
    public transferNumber: string = '';

    constructor(private _userService: UserService,
        private _stockTransferService: StockTransferService,
        private _binLocationService: BinLocationService,
        private _router: Router,
        private _stockItemService: StockItemService,
        private _reportService: ReportService) {
        this._userService = _userService;
        this.items = new Array<any>();
    }

    ngOnInit() {
        localStorage.setItem('router-Link-Active', this.routerLinkActive);
        $('#itemCode').focus();
        this.identity = this._userService.getItentity();
        if (this.identity === null) {
            this._router.navigate(['/']);
        }
    }

    private redirectIfSessionInvalid(error) {
        if (error && error.status && error.status === 401) {
            localStorage.removeItem('igb.identity');
            localStorage.removeItem('igb.selectedCompany');
            this._router.navigate(['/']);
        }
    }

    public validarUbicacion(binCode, type) {
        this.stockTransferErrorMessage = '';
        this.stockTransferExitMessage = '';
        this._binLocationService.getBinAbs(binCode.toUpperCase()).subscribe(
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
                this.redirectIfSessionInvalid(error);
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

    public validarReferencia() {
        this.stockTransferErrorMessage = '';
        this.stockTransferExitMessage = '';
        this.itemCode = this.itemCode.replace(/\s/g, '');
    }

    public agregarReferenciaConfirmada() {
        const newItem = {
            itemCode: this.itemCode.toUpperCase(),
            quantity: this.quantity,
            toBin: this.toBin.toUpperCase(),
            fromBin: this.fromBin.toUpperCase()
        };
        this.items.unshift(newItem);
        this.limpiarLinea();
        this.disabled = true;
        $('#modal_confirmar_ubicacion_fija').modal('hide');
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

        this._stockItemService.checkOutStockItem(this.itemCode.toUpperCase(), this.fromBin.toUpperCase()).subscribe(
            response => {
                if (response[2] >= this.quantity) {
                    for (let i = 0; i < this.items.length; i++) {
                        if (this.items[i].itemCode == this.itemCode) {
                            if (response[2] > this.items[i].quantity) {
                                this.items[i].quantity += this.quantity;
                                this.limpiarLinea();
                                this.disabled = true;
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
                    if (response[2] >= this.quantity) {
                        //TODO: Ubicación fija aplica solo para IGB en ubicaciones de picking
                        if (this.identity.selectedCompany === 'VARROC') {
                            this.addItem();
                        } else {
                            this._binLocationService.getLocationAttribute(this.toBin.toUpperCase()).subscribe(
                                response => {
                                    if (response.code == 0) {
                                        if (response.content[3] === 'PICKING') {
                                            this._binLocationService.getLocationFixed(this.itemCode.toUpperCase()).subscribe(
                                                response => {
                                                    if (response.content !== this.toBin) {
                                                        $('#modal_transfer_process').modal('hide');
                                                        $('#modal_confirmar_ubicacion_fija').modal('show');
                                                    } else {
                                                        this.addItem();
                                                    }
                                                },
                                                error => {
                                                    $('#modal_transfer_process').modal('hide');
                                                    this.stockTransferErrorMessage = 'Lo sentimos. Se produjo un error interno.';
                                                    console.error(error);
                                                }
                                            );
                                        } else {
                                            this.addItem();
                                        }
                                    } else {
                                        $('#modal_transfer_process').modal('hide');
                                        this.stockTransferErrorMessage = 'Lo sentimos. Se produjo un error interno.';
                                    }
                                },
                                error => {
                                    $('#modal_transfer_process').modal('hide');
                                    this.stockTransferErrorMessage = 'Lo sentimos. Se produjo un error interno.';
                                    console.error(error);
                                }
                            );
                        }
                    } else {
                        $('#modal_transfer_process').modal('hide');
                        this.stockTransferErrorMessage = 'No hay suficiente stock. Disponible: ' + response[2];
                        this.limpiarLinea();
                    }
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
        this.disabled = true;
        $('#modal_transfer_process').modal('hide');
    }

    public limpiarLinea() {
        if (this.items.length <= 0) {
            this.toBin = '';
            this.toBinId = null;
            this.fromBin = '';
            this.fromBinId = null;
            this.disabled = false;
        }
        this.itemCode = '';
        this.quantity = null;
        $('#itemCode').focus();
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
        this.disabled = false;
        $('#itemCode').focus();
    }

    public crearTraslado() {
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        this.stockTransferErrorMessage = null;
        this.stockTransferExitMessage = null;
        const stockTransfer = {
            username: this.identity.username,
            binCodeFrom: this.fromBin.toUpperCase(),
            binCodeTo: this.toBin.toUpperCase(),
            binAbsFrom: this.fromBinId,
            binAbsTo: this.toBinId,
            warehouseCode: this.identity.warehouseCode,
            lines: this.items
        };

        this._stockTransferService.stockTransfer(stockTransfer).subscribe(
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
                    $('#itemCode').focus();
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

    public eliminarItem(itemCode: string) {
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        this.stockTransferErrorMessage = '';
        $('#itemCode').focus();
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].itemCode == itemCode) {
                this.items.splice(i, 1);
                $('#modal_transfer_process').modal('hide');
                this.stockTransferExitMessage = 'Ítem eliminado correctamente.';
                this.limpiarLinea();
            }
        }
    }
}
