import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { SoulService } from '../../../services/soul.service';
import { BinLocationService } from '../../../services/bin-locations.service';
import { GLOBAL } from '../../../services/global';
import { SoulStock } from '../../../models/soul-stock';
import { from } from 'rxjs/observable/from';

declare var $: any;

@Component({
    templateUrl: './soul-stock.component.html',
    styleUrls: ['./soul-stock.component.css'],
    providers: [UserService, SoulService, BinLocationService]
})

export class SoulStockComponent implements OnInit {
    public identity;
    public token;

    /*public fromBin: string = '';
    public toBin: string = '';
    public fromBinId: number;
    public toBinId: number;*/
    public itemCode: string = '';
    public items: Array<SoulStock>;
    public filteredItem: Array<SoulStock>;
    public stockItemErrorMessage: string = null;
    public urlShared: String = GLOBAL.urlShared;

    constructor(private _userService: UserService,
        private _soulService: SoulService,
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
        this.consultarStock();
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
        /*this.toBin = '';
        this.toBinId = null;
        this.fromBin = '';
        this.fromBinId = null;*/
        this.itemCode = '';
        this.items = new Array<any>();
        $('#item').focus();
    }

    public consultarStock() {
        this.stockItemErrorMessage = '';
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        this._soulService.stockFind().subscribe(
            response => {
                $('#modal_transfer_process').modal('hide');
                this.items = response;
                this.filteredItem = this.items;
            },
            error => {
                console.error(error);
                $('#modal_transfer_process').modal('hide');
                this.stockItemErrorMessage = 'Lo sentimos. Se produjo un error interno con Magnum.';
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    public filterItem() {
        if (this.itemCode.length > 0) {
            this.items = new Array<SoulStock>();
            for (let i = 0; i < this.filteredItem.length; i++) {
                const item = this.filteredItem[i];
                if (item.sku.toLowerCase().includes(this.itemCode.toLowerCase())) {
                    this.items.push(item);
                }
            }
        } else {
            this.items = this.filteredItem;
        }
    }

    public getScrollTop() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }
}