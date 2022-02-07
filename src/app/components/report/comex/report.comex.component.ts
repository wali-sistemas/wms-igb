import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { UserService } from '../../../services/user.service';
import { ReportService } from '../../../services/report.service';
import { GLOBAL } from '../../../services/global';

import 'rxjs/Rx'
import { ResupplyComponent } from '../../resupply/resupply.component';
import { from } from 'rxjs/observable/from';

declare var $: any;

@Component({
    templateUrl: './report.comex.component.html',
    styleUrls: ['./report.comex.component.css'],
    providers: [UserService, ReportService]
})
export class ReportComexComponent implements OnInit {
    public identity;
    public queryParam;
    public logo: string;
    public urlShared: String = GLOBAL.urlShared;
    /***COMEX Trazabilidad importacion***/
    public timesImports: Array<any>;
    public activeTimeImport: boolean = false;
    public barChartTypeTimeImport: string = 'line';
    public barChartLabelsTimeImport: string[];
    public barChartDataTimeImport: any[] = [{ data: [], label: '' }];
    public trackOrder: string;
    public orderTime: string;
    public supplier: string;
    public createDate: string;
    public buyer: string;
    public typeShipment: string;
    public nroQty: string;
    public liquid: string;
    public activeTracking: boolean = false;
    public arriboPuerto: string;
    public arriboCedi: string;
    public zarpe: string;
    public embarque: string;
    public cargaLista: string;

    constructor(private _userService: UserService, private _router: Router, private _reportService: ReportService, private _routerParam: ActivatedRoute) {
    }

    ngOnInit() {
        this.queryParam = localStorage.getItem('igb.selectedCompany');

        if (this.queryParam == 'VARROC') {
            this.logo = 'logo-mtz.png';
        } else if (this.queryParam == 'IGB') {
            this.logo = 'logo-igb.png';
        } else if (this.queryParam == 'VELEZ') {
            this.logo = 'logo-mr.png';
        } else {
            this._router.navigate(['/']);
            return;
        }
    }

    private redirectIfSessionInvalid(error) {
        if (error && error.status && error.status == 401) {
            localStorage.removeItem('igb.identity');
            localStorage.removeItem('igb.selectedCompany');
            this._router.navigate(['/']);
        }
    }

    public getTrackingOrder() {
        this.supplier = '';
        this.createDate = '';
        this.buyer = '';
        this.typeShipment = '';
        this.nroQty = '';
        this.orderTime = '';
        this.arriboPuerto = '';
        this.arriboCedi = '';
        this.zarpe = '';
        this.embarque = '';
        this.liquid = '';

        this.timesImports = new Array<any>();
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        this._reportService.getTrackingOrder(this.trackOrder, this.queryParam, false).subscribe(
            response => {
                this.timesImports = response;
                //Asignando datos de encabezado.
                this.orderTime = this.timesImports[0].order;
                this.supplier = this.timesImports[0].cardCode;
                this.createDate = this.timesImports[0].createDate;
                this.buyer = this.timesImports[0].buyer;
                this.typeShipment = this.timesImports[0].typeShipment;
                this.nroQty = this.timesImports[0].nroQty;
                this.liquid = this.timesImports[0].liquid;
                this.zarpe = this.timesImports[3].information;
                this.cargaLista = this.timesImports[2].information;
                this.arriboPuerto = this.timesImports[4].information;
                this.arriboCedi = this.timesImports[5].information;
                this.activeTracking = true;
                this.trackOrder = '';
                $('#modal_transfer_process').modal('hide');
            },
            error => {
                console.error(error);
                $('#modal_transfer_process').modal('hide');
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    public getScrollTop() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }
}