import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { GLOBAL } from '../../../services/global';

import 'rxjs/Rx'
import { ResupplyComponent } from '../../resupply/resupply.component';
import { DetailDelivery } from 'app/models/packing-detail';

import { PackingService } from '../../../services/packing.service';

declare var $: any;

@Component({
    templateUrl: './check-out.component.html',
    styleUrls: ['./check-out.component.css'],
    providers: [PackingService]
})
export class CheckOutComponent implements OnInit {

    public urlShared: string = GLOBAL.urlShared;
    public identity;

    public delivery: string;
    public itemCode: string;
    public qtyEdit: number;
    public print: boolean = false;
    public detailDelivery: Array<DetailDelivery>;
    public listScaners: Array<DetailDelivery>;

    constructor(private _packingService: PackingService, private _router: Router) {
        this.start();
    }

    private start() {
        this.detailDelivery = new Array<DetailDelivery>();
        this.listScaners = new Array<DetailDelivery>();
    }

    ngOnInit() {
        $('#delivery').focus();
    }

    public getDetailDelivery() {
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        this.detailDelivery = new Array<DetailDelivery>();
        if (this.delivery != null || this.delivery.length > 0) {
            this._packingService.getDetailDelivery(this.delivery).subscribe(
                response => {
                    if (response.length > 0) {
                        for (let i = 0; i < response.length; i++) {
                            const detail = new DetailDelivery();
                            detail.row = i + 1;
                            detail.item = response[i].itemCode;
                            detail.qty = response[i].quantity;
                            detail.status = 'C'
                            this.detailDelivery.push(detail);
                        }
                    }
                },
                error => {
                    $('#modal_transfer_process').modal('hide');
                    console.error('Ocurrio un error al consultar el detalle de la entrega', error);
                }
            );
        }
        $('#modal_transfer_process').modal('hide');
        $('#itemCode').focus();
    }

    public validateItem(itemCode: string) {
        if (itemCode == null || itemCode.length <= 0) {
            return;
        } else {
            let aux = 0;
            for (let i = 0; i < this.detailDelivery.length; i++) {
                if (this.detailDelivery[i].item != this.itemCode.trim().toUpperCase()) {
                    aux++;
                }
            }
            if (aux >= this.detailDelivery.length) {
                return;
            }
        }

        for (let i = 0; i < this.listScaners.length; i++) {
            if (this.listScaners[i].item == this.itemCode.trim().toUpperCase()) {
                this.listScaners[i].qty++;
                this.itemCode = "";
                $('#itemCode').focus();
                this.compareDifferences();
                return;
            }
        }
        const newItem = {
            row: this.listScaners.length + 1,
            item: itemCode.toUpperCase(),
            qty: 1,
            status: 'C'
        };
        this.listScaners.unshift(newItem);
        this.itemCode = "";
        $('#itemCode').focus();
        this.compareDifferences();
    }

    private compareDifferences() {
        for (let i = 0; i < this.detailDelivery.length; i++) {
            for (let j = 0; j < this.listScaners.length; j++) {
                if ((this.listScaners[j].item == this.detailDelivery[i].item) && (this.listScaners[j].qty == this.detailDelivery[i].qty)) {
                    this.detailDelivery[i].status = 'A';
                    break;
                } else if ((this.listScaners[j].item == this.detailDelivery[i].item) && (this.listScaners[j].qty > this.detailDelivery[i].qty)) {
                    this.detailDelivery[i].status = 'E';
                    break;
                } else {
                    this.detailDelivery[i].status = 'C';
                }
            }
        }
        this.printerSticker();
    }

    public reset() {
        this.start();
        this.delivery = "";
        $('#delivery').focus();
    }

    private printerSticker() {
        let aux = 0;
        for (let i = 0; i < this.detailDelivery.length; i++) {
            if (this.detailDelivery[i].status == 'A') {
                aux++;
            }
        }
        if (this.detailDelivery.length == aux) {
            this.print = true;
        } else {
            this.print = false;
        }
    }

    public openModal(item: string) {
        this.itemCode = item;
        $('#modal_editar_cant').modal('show');
        $('#qtyEdit').focus();
    }

    public closedModal() {
        $('#modal_editar_cant').modal('hide');
        this.itemCode = "";
        $('#itemCode').focus();
    }

    public confirmCheckOut() {
        this._router.navigate(['/packing']);
        //TODO: pendiente registrar check-out en base de datos.
    }

    public editQtyItem(item: string) {
        for (let i = 0; i < this.listScaners.length; i++) {
            if (this.listScaners[i].item == item.trim().toUpperCase()) {
                for (let j = 0; j < this.qtyEdit; j++) {
                    this.listScaners[i].qty = 0;
                    this.listScaners[i].qty = this.qtyEdit;
                }
            }
        }
        this.closedModal();
        this.itemCode = "";
        $('#itemCode').focus();
        this.compareDifferences();
    }

    public getScrollTop() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }
}