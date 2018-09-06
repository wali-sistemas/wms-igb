import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../services/user.service';
import { StockTransferService } from '../../services/stock-transfer.service';
import { BinLocationService } from '../../services/bin-locations.service';

declare var $: any;

@Component({
    templateUrl: './stock-transfer.component.html',
    styleUrls: ['./stock-transfer.component.css'],
    providers: [UserService, StockTransferService, BinLocationService]
})

export class StockTransferComponent implements OnInit {
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

    constructor(private _userService: UserService,
        private _stockTransferService: StockTransferService,
        private _binLocationService: BinLocationService,
        private _router: Router) {
        this._userService = _userService;
        this.items = new Array<any>();
    }

    ngOnInit() {
        this.identity = this._userService.getItentity();
        if (this.identity === null) {
            this._router.navigate(['/']);
        }
    }

    public validarUbicacion(binCode, type) {
        console.log('validando ubicacion ' + binCode);
        this._binLocationService.getBinAbs(binCode).subscribe(
            response => {
                console.log(response);
                if (type === 'to') {
                    this.toBinId = response.content;
                    console.log('toBinId=' + this.toBinId);
                } else {
                    this.fromBinId = response.content;
                    console.log('fromBinId=' + this.fromBinId);
                }
            }, error => {
                if (type === 'to') {
                    this.toBinId = null;
                } else {
                    this.fromBinId = null;
                }
            }
        );
    }

    public validarReferencia() {
        console.log('validando referencia ' + this.itemCode);
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
