import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { SalesAnnual } from '../../../models/sales-annual';
import { SalesMonthly } from '../../../models/sales-monthly';

import { UserService } from '../../../services/user.service';
import { ReportService } from '../../../services/report.service';

import 'rxjs/Rx'
import { ResupplyComponent } from '../../resupply/resupply.component';

declare var $: any;

@Component({
    templateUrl: './report.manager.component.html',
    styleUrls: ['./report.manager.component.css'],
    providers: [UserService, ReportService]
})
export class ReportManagerComponent implements OnInit {
    public identity;
    public queryParam;
    public logo: string;
    /***Contenido***/
    public activeContent: boolean = false;
    /***Anual***/
    public activeSaleAnnual: boolean = false;
    public activeMargeAnnual: boolean = false;
    public barChartTypeComercYear: string = 'line';
    public barChartLabelsComercYear: string[];
    public barChartDataComercYear: any[] = [{ data: [], label: '' }];
    public ventasAnuales: Array<SalesAnnual>;
    public year: number;
    /***Mensual***/
    public activeSaleMonth: boolean = false;
    public activeMargeMonth: boolean = false;
    public barChartTypeComercMonth: string = 'bar';
    public barChartLabelsComercMonth: string[];
    public barChartDataComercMonth: any[] = [{ data: [], label: '' }];
    public ventasMensuales: Array<SalesMonthly>;
    /***Margen anual***/
    public barChartTypeComercMargeAnnual: string = 'line';
    public barChartLabelsComercMargeAnnual: string[];
    public barChartDataComercMargeAnnual: any[] = [{ data: [], label: '' }];
    /***Margen mensual***/
    public barChartTypeComercMargeMonth: string = 'bar';
    public barChartLabelsComercMargeMonth: string[];
    public barChartDataComercMargeMonth: any[] = [{ data: [], label: '' }];

    constructor(private _userService: UserService, private _router: Router, private _reportService: ReportService, private _routerParam: ActivatedRoute) { }

    ngOnInit() {
        this._routerParam.queryParams.subscribe(params => {
            this.queryParam = params;
        })

        if (this.queryParam == null) {
            this._router.navigate(['/']);
        } else if (this.queryParam.id == 'VARROC') {
            this.logo = 'logo-mtz.png';
        } else if (this.queryParam.id == 'IGB') {
            this.logo = 'logo-igb.png';
        } else {
            this._router.navigate(['/']);
            return;
        }

        let year = new Date();
        this.year = year.getFullYear();
    }

    private initializeAnnual() {
        /***Informe anual***/
        this.barChartDataComercYear = [{
            data: [this.ventasAnuales[0].totalSale, this.ventasAnuales[1].totalSale, this.ventasAnuales[2].totalSale, this.ventasAnuales[3].totalSale, this.ventasAnuales[4].totalSale],
            label: 'Ventas Anuales'
        }];
        /***Informe margen anual***/
        this.barChartDataComercMargeAnnual = [{
            data: [this.ventasAnuales[0].margeSale, this.ventasAnuales[1].margeSale, this.ventasAnuales[2].margeSale, this.ventasAnuales[3].margeSale, this.ventasAnuales[4].margeSale],
            label: 'Margen Anual'
        }];
    }

    private initializeMonth() {
        /***Informe mensual***/
        this.barChartDataComercMonth = [{
            data: [this.ventasMensuales[0].totalSale, this.ventasMensuales[1].totalSale, this.ventasMensuales[2].totalSale, this.ventasMensuales[3].totalSale, this.ventasMensuales[4].totalSale, this.ventasMensuales[5].totalSale, this.ventasMensuales[6].totalSale, this.ventasMensuales[7].totalSale, this.ventasMensuales[8].totalSale, this.ventasMensuales[9].totalSale, this.ventasMensuales[10].totalSale, this.ventasMensuales[11].totalSale],
            label: 'Ventas Mensuales'
        }];
        /***Informe margen mensual***/
        this.barChartDataComercMargeMonth = [{
            data: [this.ventasMensuales[0].margeSale, this.ventasMensuales[1].margeSale, this.ventasMensuales[2].margeSale, this.ventasMensuales[3].margeSale, this.ventasMensuales[4].margeSale, this.ventasMensuales[5].margeSale, this.ventasMensuales[6].margeSale, this.ventasMensuales[7].margeSale, this.ventasMensuales[8].margeSale, this.ventasMensuales[9].margeSale, this.ventasMensuales[10].margeSale, this.ventasMensuales[11].margeSale],
            label: 'Margen Mensual',
            colors: { backgroundColor: '#333' }
        }];
    }

    private cleanSalesAnnual() {
        this.barChartLabelsComercYear = [];
        this.barChartDataComercYear = [{ data: [], label: '' }];
        this.ventasAnuales = new Array<SalesAnnual>();
    }

    private redirectIfSessionInvalid(error) {
        if (error && error.status && error.status == 401) {
            localStorage.removeItem('igb.identity');
            localStorage.removeItem('igb.selectedCompany');
            this._router.navigate(['/']);
        }
    }

    public getSalesAnnual() {
        this.ventasAnuales = new Array<SalesAnnual>();
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        this._reportService.getSalesAnnual(this.queryParam.id, false).subscribe(
            response => {
                if (response.code == 0) {
                    this.ventasAnuales = response.content;
                    $('#modal_transfer_process').modal('hide');
                    this.initializeAnnual();
                } else {
                    console.error("No encontro datos para mostar.");
                    $('#modal_transfer_process').modal('hide');
                }
            },
            error => {
                console.error("Ocurrio un error al obtener las ventas anuales.", error);
                $('#modal_transfer_process').modal('hide');
            }
        );
    }

    public getSalesMonthly() {
        this.cleanSalesAnnual();
        this.ventasMensuales = new Array<SalesMonthly>();
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        this._reportService.getSalesMonthly(this.queryParam.id, false).subscribe(
            response => {
                if (response.code == 0) {
                    this.ventasMensuales = response.content;
                    $('#modal_transfer_process').modal('hide');
                    this.initializeMonth();
                } else {
                    console.error("No encontro datos para mostar.");
                    $('#modal_transfer_process').modal('hide');
                }
            },
            error => {
                console.error("Ocurrio un error al obtener las ventas mensuales.", error);
                $('#modal_transfer_process').modal('hide');
            }
        );
    }

    public getActiveSaleAnnual() {
        this.activeSaleMonth = false;
        this.activeMargeMonth = false;
        this.activeMargeAnnual = false;
        if (this.activeSaleAnnual) {
            this.activeSaleAnnual = false;
        } else {
            this.activeContent = true;
            this.activeSaleAnnual = true;
            this.getSalesAnnual();
            this.barChartLabelsComercYear = [(this.year - 4).toString(), (this.year - 3).toString(), (this.year - 2).toString(), (this.year - 1).toString(), this.year.toString()];
        }
    }

    public getActiveSaleMonth() {
        this.activeSaleAnnual = false;
        this.activeMargeAnnual = false;
        this.activeMargeMonth = false;
        if (this.activeSaleMonth) {
            this.activeSaleMonth = false;
        } else {
            this.activeContent = true;
            this.activeSaleMonth = true;
            this.getSalesMonthly();
            this.barChartLabelsComercMonth = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        }
    }

    public getActiveMargeAnnual() {
        this.activeSaleAnnual = false;
        this.activeSaleMonth = false;
        this.activeMargeMonth = false;
        if (this.activeMargeAnnual) {
            this.activeMargeAnnual = false;
        } else {
            this.activeContent = true;
            this.activeMargeAnnual = true;
            this.getSalesAnnual();
            this.barChartLabelsComercMargeAnnual = [(this.year - 4).toString(), (this.year - 3).toString(), (this.year - 2).toString(), (this.year - 1).toString(), this.year.toString()];
        }
    }

    public getActiveMargeMonth() {
        this.activeSaleAnnual = false;
        this.activeSaleMonth = false;
        this.activeMargeAnnual = false;
        if (this.activeMargeMonth) {
            this.activeMargeMonth = false;
        } else {
            this.activeContent = true;
            this.activeMargeMonth = true;
            this.getSalesMonthly();
            this.barChartLabelsComercMargeMonth = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        }
    }

    public getScrollTop() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }
}