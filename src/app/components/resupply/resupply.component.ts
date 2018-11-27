import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { ResupplyService } from '../../services/resupply.service';
import { StockTransferService } from '../../services/stock-transfer.service';
import { UserService } from '../../services/user.service';

declare var $: any;

@Component({
    templateUrl: './resupply.component.html',
    styleUrls: ['./resupply.component.css'],
    providers: [ResupplyService, StockTransferService, UserService]
})
export class ResupplyComponent implements OnInit {
    public pass: number;
    public quantityConfirm: number;
    public locationConfirm: string;
    public message: string;
    public errorMessageModal: string;
    public admin: boolean = false;
    public locationTo: any;
    public locationFrom: any;
    public item: any;
    public limitSelect: any;
    public locationsResupply: Array<any>;
    public items: Array<any>;
    public locationsStorage: Array<any>;
    public limits: Array<any>;
    public limitSelectOne: string = '';

    constructor(private _router: Router, private _resupplyService: ResupplyService, private _stockTransferService: StockTransferService, private _userService: UserService) {
        this.pass = 1;
        this.clean();
        this.locationsResupply = new Array<any>();
        this.items = new Array<any>();
        this.locationsStorage = new Array<any>();
        this.limits = new Array<any>();
    }

    ngOnInit() {
        this.listLocationsResupply();
        this._userService.validateUserAdmin(this._userService.getItentity().username).subscribe(
            response => {
                this.admin = response.content;
            }, error => { console.error(error); }
        );
    }

    private listLocationsResupply() {
        this.message = "";
        this.errorMessageModal = "";
        this.items = new Array<any>();
        this._resupplyService.listLocationsResupply().subscribe(
            response => {
                this.locationsResupply = response.content;
            }, error => {
                console.log(error);
            }
        );
    }

    private listItems() {
        this.message = "";
        this.errorMessageModal = "";
        this.items = new Array<any>();
        this.locationsResupply = new Array<any>();
        this._resupplyService.listItemsLocation(this.locationTo[1]).subscribe(
            response => {
                this.items = response.content;
                if (this.items.length <= 0) {
                    this.pass--;
                    this.listLocationsResupply();
                }
            }, error => { console.log(error); }
        );
    }

    private listLocationsStorage() {
        this.message = "";
        this.errorMessageModal = "";
        this.items = new Array<any>();
        this._resupplyService.listUbicationsStorage(this.item[0]).subscribe(
            response => {
                this.locationsStorage = response.content;
                if (this.locationsStorage === null || this.locationsStorage.length <= 0) {
                    this.pass--;
                    this.listItems();
                    this.message = "No se encontraron ubicación para re-abastecer el ítem";
                }
            }, error => { console.log(error); }
        );
    }

    public listLocationLimits() {
        $('#modalConfiguracion').modal('hide');
        this.clean();
        this.message = "";
        this.errorMessageModal = "";
        $('#modal_process').modal('show');
        this.limits = new Array<any>();
        this._resupplyService.listLocationLimits().subscribe(
            response => {
                this.limits = response.content;
                $('#modalConfiguracion').modal('show');
                $('#modal_process').modal('hide');
            }, error => { console.log(error); }
        );
    }

    public selectLimit(limit) {
        this.limitSelect = limit;
    }

    public changeLimitSelect() {
        for (let i = 0; i < this.limits.length; i++) {
            if (this.limits[i][0] === this.limitSelectOne) {
                this.limitSelect = this.limits[i];
                break;
            }
        }
    }

    public saveLocationLimit() {
        this.message = "";
        this.errorMessageModal = "";
        if (this.limitSelect[2] === null || this.limitSelect[2] === '' || this.limitSelect[2] === undefined
            || this.limitSelect[3] === null || this.limitSelect[3] == '' || this.limitSelect[3] === undefined
            || this.limitSelect[4] === null || this.limitSelect[4] == '' || this.limitSelect[4] === undefined
            || this.limitSelect[5] === null || this.limitSelect[5] == '' || this.limitSelect[5] === undefined) {
            this.errorMessageModal = "Ingrese todos los campos obligatorios.";
            return;
        }

        let locationLimitDTO = {
            "code": this.limitSelect[0],
            "name": this.limitSelect[1],
            "ubicacion": this.limitSelect[2],
            "item": this.limitSelect[3],
            "cantMaxima": this.limitSelect[4],
            "cantMinima": this.limitSelect[5]
        }

        this._resupplyService.saveLocationLimit(locationLimitDTO).subscribe(
            response => {
                if (response.code === -1) {
                    this.message = response.content;
                    return;
                }
                this.clean();
                $('#modalConfiguracion').modal('hide');
            }, error => { console.log(error); }
        );
    }

    public deleteLocationLimit() {
        this.errorMessageModal = "";
        if (this.limitSelect[0] == null || this.limitSelect[0].length <= 0) {
            this.errorMessageModal = "Sin límite seleccionado para eliminar.";
            return;
        }

        this._resupplyService.deleteLocationLimit(this.limitSelect[0]).subscribe(
            response => {
                if (response.code < 0) {
                    this.message = response.content;
                } else {
                    this.clean();
                    $('#modalConfiguracion').modal('hide');
                }
            }, error => { console.error(error); }
        );
    }

    public goToPass(location, item, back: boolean) {
        this.message = "";
        this.errorMessageModal = "";
        if (!back && this.pass < 3) {
            this.pass++;
            if (this.pass === 2) {
                this.locationTo = location;
                this.listItems();
            } else if (this.pass === 3) {
                this.item = item;
                this.listLocationsStorage();
            }
        } else if (back && this.pass > 1) {
            this.pass--;
            if (this.pass === 1) {
                this.listLocationsResupply();
            } else if (this.pass === 2) {
                this.listItems();
            }
        }
    }

    public useLocation(storage) {
        this.message = "";
        this.errorMessageModal = "";
        this.locationFrom = storage;
        $('#modalUbicacion').modal('show');
    }

    public stockTransfer(continuar: boolean) {
        this.message = "";
        this.errorMessageModal = "";
        $('#modalUbicacion').modal('hide');
        $('#modalAdvertencia').modal('hide');
        this.locationConfirm = this.locationConfirm.trim();

        if (this.locationConfirm === null || this.locationFrom[1] !== this.locationConfirm) {
            this.message = "Digite la ubicación de la que se desea sacar los ítems";
            return;
        }
        if (this.quantityConfirm == null || this.quantityConfirm <= 0) {
            this.message = "Digite la cantidad que desea sacar de la ubicación";
            return;
        } else if (this.quantityConfirm > this.locationFrom[2]) {
            this.message = "La cantidad ingresada supera la disponible en la ubicación";
            return;
        } else if (this.quantityConfirm > parseInt(this.item[1], 10) && !continuar) {
            $('#modalAdvertencia').modal('show');
            return;
        }

        $('#modalUbicacion').modal('hide');
        $('#modal_process').modal('show');

        const itemTransfer = {
            binAbsFrom: this.locationFrom[0],
            binAbsTo: this.locationTo[0],
            quantity: this.quantityConfirm,
            itemCode: this.item[0].trim(),
            warehouseCode: this._userService.getItentity().warehouseCode
        }

        this._stockTransferService.transferResupply(itemTransfer).subscribe(
            response => {
                if (response.code === 0) {
                    this.item[1] = this.item[1] - this.quantityConfirm;
                    this.locationFrom[2] = this.locationFrom[2] - this.quantityConfirm;

                    if (this.item[1] > 0 && this.locationsStorage.length > 1) {
                        this.listLocationsStorage();
                    } else if (this.item[1] <= 0) {
                        this.pass = 1;
                        this.listLocationsResupply();
                    } else if (this.locationsStorage.length <= 0 && this.locationFrom[2] <= 0) {
                        this.pass--;
                        this.listItems();
                    } else {
                        this.listLocationsStorage();
                    }
                    this.locationConfirm = null;
                    this.quantityConfirm = null;
                } else {
                    this.message = "Ocurrió un error al crear el traslado";
                    $('#modalUbicacion').modal('show');
                }
                $('#modal_process').modal('hide');
            }, error => { console.log(error); }
        );
    }

    public clean() {
        this.limitSelect = {
            code: '',
            name: '',
            ubicacion: '',
            item: '',
            cantMinima: 0,
            cantMaxima: 0
        }
        this.errorMessageModal = "";
        this.message = "";
    }
}