import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { ResupplyService } from '../../services/resupply.service';
import { StockTransferService } from '../../services/stock-transfer.service';

declare var $: any;

@Component({
    templateUrl: './resupply.component.html',
    styleUrls: ['./resupply.component.css'],
    providers: [ResupplyService, StockTransferService]
})
export class ResupplyComponent implements OnInit {
    public pass: number;
    public quantityNecesary: number;
    public quantity: number;
    public quantityConfirm: number;
    public location: string;
    public locationStorage: string;
    public locationConfirm: string;
    public message: string;
    public item: string;
    public locationsResupply: Array<any>;
    public items: Array<any>;
    public locationsStorage: Array<any>;

    constructor(private _router: Router, private _resupplyService: ResupplyService, private _stockTransferService: StockTransferService) {
        this.pass = 1;
        this.locationsResupply = new Array<any>();
        this.items = new Array<any>();
        this.locationsStorage = new Array<any>();
    }

    ngOnInit() {
        this.listLocationsResupply();
    }

    private listLocationsResupply() {
        this.message = null;
        this.items = new Array<any>();
        this._resupplyService.listLocationsResupply().subscribe(
            response => {
                this.locationsResupply = response.content;
            }, error => {
                console.log(error);
            }
        );
    }

    private listItems(location: string) {
        this.message = null;
        this.items = new Array<any>();
        this.locationsResupply = new Array<any>();
        this._resupplyService.listItemsLocation(location).subscribe(
            response => {
                this.items = response.content;

                if (this.items.length <= 0) {
                    this.pass--;
                    this.listLocationsResupply();
                }
            }, error => {
                console.log(error);
            }
        );
    }

    private listLocationsStorage(itemCode: string) {
        this.message = "";
        this.items = new Array<any>();
        this._resupplyService.listUbicationsStorage(itemCode).subscribe(
            response => {
                this.locationsStorage = response.content;
                if (this.locationsStorage === null || this.locationsStorage.length <= 0) {
                    this.pass--;
                    this.listItems(this.location);
                    this.message = "No se encontraron ubicación para re-abastecer el ítem";
                }
            }, error => {
                console.log(error);
            }
        );
    }

    public goToPass(location, item, back: boolean) {
        this.message = null;
        if (!back && this.pass < 3) {
            this.pass++;
            if (this.pass === 2) {
                this.location = location[0];
                this.quantityNecesary = location[1];
                this.listItems(this.location);
            } else if (this.pass === 3) {
                this.item = item[0];
                this.quantityNecesary = item[1];
                this.listLocationsStorage(item[0]);
            }
        } else if (back && this.pass > 1) {
            this.pass--;
            if (this.pass === 1) {
                this.listLocationsResupply();
            } else if (this.pass === 2) {
                this.listItems(this.location);
            }
        }
    }

    public useLocation(storage) {
        this.message = null;
        this.quantity = storage[1];
        this.locationStorage = storage[0];
        console.log(storage[0]);
        $('#modalUbicacion').modal('show');
    }

    public stockTransfer() {
        this.message = null;
        console.log(this.locationConfirm);
        if (this.locationConfirm === null || this.locationStorage !== this.locationConfirm) {
            this.message = "Digite la ubicación de la que se desea sacar los ítems";
            console.log("Digite la ubicación de la que se desea sacar los ítems");
            return;
        }
        console.log(this.quantityConfirm);
        if (this.quantityConfirm == null || this.quantityConfirm <= 0) {
            this.message = "Digite la cantidad que desea sacar de la ubicación";
            console.log("Digite la cantidad que desea sacar de la ubicación");
            return;
        } else if (this.quantityConfirm > this.quantity) {
            this.message = "La cantidad ingresada supera la disponible en la ubicación";
            console.log("La cantidad ingresada supera la disponible en la ubicación");
            return;
        }

        $('#modalUbicacion').modal('hide');
        $('#modal_process').modal('show');

        let itemTransfer = {
            binCodeFrom: this.locationStorage,
            binCodeTo: this.location,
            quantity: this.quantityConfirm,
            itemCode: this.item,
            warehouseCode: '01' //TODO: parametrizar whscode
        }

        console.log(itemTransfer);

        this._stockTransferService.transferResupply(itemTransfer).subscribe(
            response => {
                if (response.code === 0) {
                    this.quantityNecesary = this.quantityNecesary - this.quantityConfirm;
                    this.quantity = this.quantity - this.quantityConfirm;

                    if (this.quantityNecesary > 0 && this.locationsStorage.length > 1) {
                        this.listLocationsStorage(this.item);
                    } else if (this.quantityNecesary <= 0) {
                        this.pass = 1;
                        this.listLocationsResupply();
                    } else if (this.locationsStorage.length <= 0 && this.quantity <= 0) {
                        this.pass--;
                        this.listItems(this.location);
                    } else {
                        this.listLocationsStorage(this.item);
                    }
                    this.locationConfirm = null;
                    this.quantityConfirm = null;
                } else {
                    this.message = "Ocurrió un error al crear el traslado";
                    $('#modalUbicacion').modal('show');
                }
                console.log(response);
                $('#modal_process').modal('hide');
            }, error => {
                console.log(error);
            }
        );
    }
}