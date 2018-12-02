import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../services/user.service';
import { StockItemService } from '../../services/stock-item.service';
import { BinLocationService } from '../../services/bin-locations.service';
import { GLOBAL } from '../../services/global';

declare var $: any;

@Component({
    templateUrl: './stock-item.component.html',
    styleUrls: ['./stock-item.component.css'],
    providers: [UserService, StockItemService, BinLocationService]
})

export class StockItemComponent implements OnInit {
    public identity;
    public token;

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
        private _router: Router) {
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

    public validarUbicacion(binCode, type) {
        this.stockItemErrorMessage = '';
        this._binLocationService.getBinAbs(binCode).subscribe(
            response => {
                if (type === 'to') {
                    if (response.content) {
                        this.toBinId = response.content;
                    } else {
                        this.stockItemErrorMessage = 'La ubicación de destino no es válida';
                    }
                } else {
                    if (response.content) {
                        this.fromBinId = response.content;
                    } else {
                        this.stockItemErrorMessage = 'La ubicación de origen no es válida';
                    }
                }
            }, error => {
                console.error(error);
                if (type === 'to') {
                    this.toBinId = null;
                    this.stockItemErrorMessage = 'La ubicación de destino no es válida';
                } else {
                    this.fromBinId = null;
                    this.stockItemErrorMessage = 'La ubicación de origen no es válida';
                }
            }
        );
    }

    public validarReferencia() {
        this.itemCode = this.itemCode.replace(/\s/g, '');
    }

    public limpiarTodo() {
        this.toBin = '';
        this.toBinId = null;
        this.fromBin = '';
        this.fromBinId = null;
        this.itemCode = '';
        this.items = new Array<any>();
        $('#item').focus();
    }

    public consultarStock() {
        if (this.itemCode.length > 1) {
            this._stockItemService.stockFind(this.itemCode).subscribe(
                response => {
                    this.items = response;
                },
                error => {
                    console.error(error);
                    this.stockItemErrorMessage = 'Lo sentimos. Se produjo un error interno';
                }
            );
        }
    }
}
