import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { StockTransferService } from '../../../services/stock-transfer.service';
import { BinLocationService } from '../../../services/bin-locations.service';

declare var $: any;

@Component({
    templateUrl: './stock-transfer-location.component.html',
    styleUrls: ['./stock-transfer-location.component.css'],
    providers: [UserService, StockTransferService, BinLocationService]
})

export class StockTransferLocationComponent implements OnInit {
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
    public routerLinkActive: string = 'active';

    constructor(private _userService: UserService,
        private _stockTransferService: StockTransferService,
        private _binLocationService: BinLocationService,
        private _router: Router) {
        this._userService = _userService;
        this.items = new Array<any>();
    }

    ngOnInit() {
        localStorage.setItem('router-Link-Active', this.routerLinkActive);
        $('#fromBin').focus();
        this.identity = this._userService.getItentity();
        if (this.identity === null) {
            this._router.navigate(['/']);
        }  
    }

    public validarUbicacion(binCode, type) {
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
    }

    public validarReferencia() {
        this.itemCode = this.itemCode.replace(/\s/g, '');
    }

    public agregarReferencia() {
        const newItem = {
            itemCode: this.itemCode,
            quantity: this.quantity
        };
        this.items.unshift(newItem);
        this.limpiarLinea();
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
            binCodeFrom: this.fromBin,
            binCodeTo: this.toBin,
            binAbsFrom: this.fromBinId,
            binAbsTo: this.toBinId,
            warehouseCode: this.identity.warehouseCode,
            lines: this.items
        };
        console.log(stockTransfer);
        this._stockTransferService.stockTransfer(stockTransfer).subscribe(
            response => {
                console.log(response);
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
