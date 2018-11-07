import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../services/user.service';
import { StockConsultService } from '../../services/stock-consult.service';
import { BinLocationService } from '../../services/bin-locations.service';
import { GLOBAL } from '../../services/global';

declare var $: any;

@Component({
    templateUrl: './stock-consult.component.html',
    styleUrls: ['./stock-consult.component.css'],
    providers: [UserService, StockConsultService, BinLocationService]
})

export class StockConsultComponent implements OnInit {
    public identity;
    public token;

    public fromBin: string = '';
    public toBin: string = '';
    public fromBinId: number;
    public toBinId: number;
    public itemCode: string = '';
    public items: Array<any>;
    public stockConsultrErrorMessage: string = null;
    public urlShared: String = GLOBAL.urlShared;

    constructor(private _userService: UserService,
        private _stockConsultService: StockConsultService,
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
        this.stockConsultrErrorMessage = '';
        this._binLocationService.getBinAbs(binCode).subscribe(
            response => {
                if (type === 'to') {
                    if (response.content) {
                        this.toBinId = response.content;
                    } else {
                        this.stockConsultrErrorMessage = 'La ubicación de destino no es válida';
                    }
                } else {
                    if (response.content) {
                        this.fromBinId = response.content;
                    } else {
                        this.stockConsultrErrorMessage = 'La ubicación de origen no es válida';
                    }
                }
            }, error => {
                console.error(error);
                if (type === 'to') {
                    this.toBinId = null;
                    this.stockConsultrErrorMessage = 'La ubicación de destino no es válida';
                } else {
                    this.fromBinId = null;
                    this.stockConsultrErrorMessage = 'La ubicación de origen no es válida';
                }
            }
        );
    }

    public validarReferencia() {
        this.itemCode = this.itemCode.replace(/\s/g, '');
    }

    private limpiarTodo() {
        this.toBin = '';
        this.toBinId = null;
        this.fromBin = '';
        this.fromBinId = null;
        this.items = new Array<any>();
    }

    public consultarStock() {
        if (this.itemCode.length > 1) {
            this._stockConsultService.stockConsult(this.itemCode).subscribe(
                response => {
                    this.items = response;
                },
                error => {
                    console.error(error);
                    this.stockConsultrErrorMessage = 'Lo sentimos. Se produjo un error interno';
                }
            );
        }
    }
}
