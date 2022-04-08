import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { StockItemService } from '../../../services/stock-item.service';
import { BinLocationService } from '../../../services/bin-locations.service';
import { ModulaService } from '../../../services/modula.service';
import { GLOBAL } from '../../../services/global';

declare var $: any;

@Component({
    templateUrl: './stock-item.component.html',
    styleUrls: ['./stock-item.component.css'],
    providers: [UserService, StockItemService, BinLocationService, ModulaService]
})

export class StockItemComponent implements OnInit {
    public identity;
    public token;

    public itemMDL: string = '';
    public minStockMDL: number;
    public maxStockMDL: number;
    public warnMessageSincrItemMDL: string = '';
    public fromBin: string = '';
    public toBin: string = '';
    public fromBinId: number;
    public toBinId: number;
    public itemCode: string = '';
    public items: Array<any>;
    public stockItemErrorMessage: string = null;
    public urlShared: String = GLOBAL.urlShared;

    constructor(private _userService: UserService,
        private _stockItemService: StockItemService,
        private _binLocationService: BinLocationService,
        private _router: Router,
        private _modulaService: ModulaService) {
        this._userService = _userService;
        this.items = new Array<any>();
    }

    ngOnInit() {
        $('#item').focus();
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

    public validarReferencia() {
        this.itemCode = this.itemCode.replace(/\s/g, '');
    }

    public limpiarTodo() {
        this.stockItemErrorMessage = '';
        this.toBin = '';
        this.toBinId = null;
        this.fromBin = '';
        this.fromBinId = null;
        this.itemCode = '';
        this.items = new Array<any>();
        this.itemMDL = '';
        this.minStockMDL = null;
        this.maxStockMDL = null;
        this.warnMessageSincrItemMDL = '';
        $('#item').focus();
    }

    public consultarStock() {
        this.stockItemErrorMessage = '';
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        if (this.itemCode.length > 1) {
            this._stockItemService.stockFind(this.itemCode.trim().toUpperCase(), JSON.parse(localStorage.getItem('igb.identity')).warehouseCode).subscribe(
                response => {
                    if (response.length >= 1) {
                        $('#modal_transfer_process').modal('hide');
                        this.items = response;
                    } else {
                        $('#modal_transfer_process').modal('hide');
                        this.stockItemErrorMessage = 'No hay stock disponible. Almacén activo [' + JSON.parse(localStorage.getItem('igb.identity')).warehouseCode + ']';
                        this.items = new Array<any>();
                    }
                },
                error => {
                    console.error(error);
                    $('#modal_transfer_process').modal('hide');
                    this.stockItemErrorMessage = 'Lo sentimos. Se produjo un error interno';
                    this.redirectIfSessionInvalid(error);
                }
            );
        }
    }

    public sincrItemModula() {
        this._modulaService.getReplicateItemModula(this.itemMDL.toUpperCase(), this.minStockMDL, this.maxStockMDL).subscribe(
            response => {
                if (response.code == 0) {
                    this.limpiarTodo();
                    $('#sincr-item-mdl').modal('hide');
                } else {
                    this.warnMessageSincrItemMDL = response.content;
                }
            },
            error => { console.error(error); }
        );
    }

    public getScrollTop() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }
}