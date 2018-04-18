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
    public admin: boolean = false;
    public locationTo: any;
    public locationFrom: any;
    public item: any;
    public limitSelect: any;
    public locationsResupply: Array<any>;
    public items: Array<any>;
    public locationsStorage: Array<any>;
    public limits: Array<any>;

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

    private listItems() {
        this.message = null;
        this.items = new Array<any>();
        this.locationsResupply = new Array<any>();
        this._resupplyService.listItemsLocation(this.locationTo[1]).subscribe(
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

    private listLocationsStorage() {
        this.message = "";
        this.items = new Array<any>();
        this._resupplyService.listUbicationsStorage(this.item[0]).subscribe(
            response => {
                this.locationsStorage = response.content;
                if (this.locationsStorage === null || this.locationsStorage.length <= 0) {
                    this.pass--;
                    this.listItems();
                    this.message = "No se encontraron ubicación para re-abastecer el ítem";
                }
            }, error => {
                console.log(error);
            }
        );
    }

    public listLocationLimits() {
        $('#modalConfiguracion').modal('hide');
        this.clean();
        this.message = "";
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
            if (this.limits[i].code === this.limitSelect.code) {
                this.limitSelect = this.limits[i];
                break;
            }
        }
    }

    public saveLocationLimit() {
        this.message = "";
        if (this.limitSelect.ubicacion === null || this.limitSelect.ubicacion.length <= 0) {
            this.message = "Ingrese la ubicación a la que le quiere registrar el límite";
            console.log("Ingrese la ubicación a la que le quiere registrar el límite");
            return;
        }
        if (this.limitSelect.item === null || this.limitSelect.item.length <= 0) {
            this.message = "Ingrese el ítem al que le quiere registrar el límite";
            console.log("Ingrese el ítem al que le quiere registrar el límite");
            return;
        }
        if (this.limitSelect.cantMinima === null || this.limitSelect.cantMinima < 0) {
            this.message = "Ingrese la cantidad mínima que le quiere registrar el límite";
            console.log("Ingrese la cantidad mínima que le quiere registrar el límite");
            return;
        }
        if (this.limitSelect.cantMaxima === null || this.limitSelect.cantMaxima < 0) {
            this.message = "Ingrese la cantidad maxima que le quiere registrar el límite";
            console.log("Ingrese la cantidad maxima que le quiere registrar el límite");
            return;
        }

        this._resupplyService.saveLocationLimit(this.limitSelect).subscribe(
            response => {
                if (response.code === -1) {
                    this.message = response.content;
                    return;
                }
                this.clean();
                this.listLocationLimits();
            }, error => { console.log(error); }
        );
    }

    public deleteLocationLimit() {
        this.message = null;
        if (this.limitSelect.code == null || this.limitSelect.code.length <= 0) {
            this.message = "Lo se encontro un limite seleccionado para poder eliminar.";
            return;
        }

        this._resupplyService.deleteLocationLimit(this.limitSelect.code).subscribe(
            response => {
                if (response.code < 0) {
                    this.message = response.content;
                } else {
                    this.clean();
                    this.listLocationLimits();
                }
            }, error => { console.error(error); }
        );
    }

    public goToPass(location, item, back: boolean) {
        this.message = null;
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
        this.message = null;
        this.locationFrom = storage;
        console.log(this.locationFrom);
        $('#modalUbicacion').modal('show');
    }

    public stockTransfer(continuar: boolean) {
        this.message = null;
        $('#modalUbicacion').modal('hide');
        $('#modalAdvertencia').modal('hide');
        console.log(this.item);
        if (this.locationConfirm === null || this.locationFrom[1] !== this.locationConfirm) {
            this.message = "Digite la ubicación de la que se desea sacar los ítems";
            console.log("Digite la ubicación de la que se desea sacar los ítems");
            return;
        }
        console.log(this.quantityConfirm);
        if (this.quantityConfirm == null || this.quantityConfirm <= 0) {
            this.message = "Digite la cantidad que desea sacar de la ubicación";
            console.log("Digite la cantidad que desea sacar de la ubicación");
            return;
        } else if (this.quantityConfirm > this.locationFrom[2]) {
            this.message = "La cantidad ingresada supera la disponible en la ubicación";
            console.log("La cantidad ingresada supera la disponible en la ubicación");
            return;
        } else if ((parseInt(this.item[1]) + this.quantityConfirm) > this.item[2] && !continuar) {
            $('#modalAdvertencia').modal('show');
            return;
        }

        $('#modalUbicacion').modal('hide');
        $('#modal_process').modal('show');

        let itemTransfer = {
            binAbsFrom: this.locationFrom[0],
            binAbsTo: this.locationTo[0],
            quantity: this.quantityConfirm,
            itemCode: this.item[0],
            warehouseCode: '01' //TODO: parametrizar whscode
        }

        console.log(itemTransfer);

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
                console.log(response);
                $('#modal_process').modal('hide');
            }, error => {
                console.log(error);
            }
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
    }
}