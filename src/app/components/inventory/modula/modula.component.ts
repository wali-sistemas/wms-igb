import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { GLOBAL } from '../../../services/global';
import { ModulaService } from '../../../services/modula.service';
import { UserService } from '../../../services/user.service';

declare var $: any;

@Component({
    templateUrl: './modula.component.html',
    styleUrls: ['./modula.component.css'],
    providers: [ModulaService, UserService]
})
export class ModulaComponent implements OnInit {
    public itemsDifferences: Array<any>;
    public msgDanger: String;
    public msgWarning: String;
    public msgSuccess: String;
    public itemCode: String;
    public quantity: number;
    public identity;
    public urlShared: String = GLOBAL.urlShared;

    constructor(private _modulaService: ModulaService, private _router: Router, private _userService: UserService) {
        this.itemsDifferences = new Array<any>();
    }

    ngOnInit() {
        this.identity = this._userService.getItentity();
        if (this.identity === null) {
            this._router.navigate(['/']);
        }
        this.listItems();
    }

    private redirectIfSessionInvalid(error) {
        if (error && error.status && error.status == 401) {
            localStorage.removeItem('igb.identity');
            localStorage.removeItem('igb.selectedCompany');
            this._router.navigate(['/']);
        }
    }

    public listItems() {
        this.clear();
        $('#modal_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        this._modulaService.getStockMissing().subscribe(
            response => {
                if (response.length == 0) {
                    this.msgWarning = "Inventario consiliado en su totalidad.";
                } else {
                    for (let i = 0; i < response.length; i++) {
                        if (response[i].qtyMDL != response[i].qtySAP) {
                            this.itemsDifferences = response;
                        } else { 
                            this.msgWarning = "Inventario consiliado en su totalidad.";
                        }
                    }
                }
                $('#modal_process').modal('hide');
            },
            error => {
                $('#modal_process').modal('hide');
                this.msgDanger = "Ocurrio un error invoncando el servicio de comparación.";
                console.error(error);
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    public inventoryItem() {
        this.clear();
        let fecha = new Date();
        const orderModulaDTO = {
            "docNum": "5" + fecha.getHours() + fecha.getMinutes() + fecha.getSeconds(),
            "type": "I",
            "detail": [
                {
                    "itemCode": this.itemCode,
                    "quantity": this.quantity,
                    "toBin": null,
                    "fromBin": null
                }
            ]
        }

        this._modulaService.postStockInvenatory(orderModulaDTO).subscribe(
            response => {
                if (response.code == 0) {
                    this.msgSuccess = response.content;
                } else {
                    this.msgDanger = response.content;
                }
                $('#modal_inventory').modal('hide');
            }, error => {
                $('#modal_inventory').modal('hide');
                console.error(error);
            }
        );
    }

    public selectItem(item: String, qty: number) {
        this.clear();
        $('#modal_inventory').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        this.itemCode = item;
        this.quantity = qty;
    }

    public clear() {
        this.msgWarning = '';
        this.msgDanger = '';
        this.msgSuccess = '';
    }

    public getScrollTop() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }
}