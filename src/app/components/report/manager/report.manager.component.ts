import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { SalesAnnual } from '../../../models/sales-annual';
import { SalesMonthly } from '../../../models/sales-monthly';
import { ByCollect } from '../../../models/byCollect';
import { PurchaseCost } from '../../../models/purchase-cost';

import { UserService } from '../../../services/user.service';
import { ReportService } from '../../../services/report.service';
import { GLOBAL } from '../../../services/global';

import 'rxjs/Rx'
import { ResupplyComponent } from '../../resupply/resupply.component';
import { from } from 'rxjs/observable/from';

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
    public urlShared: String = GLOBAL.urlShared;
    /***Contenido***/
    public activeContentGerencia: boolean = false;
    public activeContentCartera: boolean = false;
    public activeContentLogist: boolean = false;
    public activeContentComex: boolean = false;
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
    public monthName: string;
    /***Margen anual***/
    public barChartTypeComercMargeAnnual: string = 'line';
    public barChartLabelsComercMargeAnnual: string[];
    public barChartDataComercMargeAnnual: any[] = [{ data: [], label: '' }];
    /***Margen mensual***/
    public barChartTypeComercMargeMonth: string = 'bar';
    public barChartLabelsComercMargeMonth: string[];
    public barChartDataComercMargeMonth: any[] = [{ data: [], label: '' }];
    /***Cartera Recaudo***/
    public selectedDiasAtraso: string = 'a';
    public activeCollection: boolean = false;
    public recaudos: Array<any>;
    public totalSinVencer: number;
    public total0a20: number;
    public total21a55: number;
    public total56a120: number;
    public total121a360: number;
    public totalMayor360: number;
    /***Cartera por Recaudar***/
    public activeByCollection: boolean = false;
    public byCollect: Array<ByCollect>;
    public totalByCollect: number;
    public totalCarteraSana: number;
    public porcentCarteraSana: number;
    /***Logistica Estado Pedidos***/
    public statusOrders: Array<any>;
    public activeStatusOrder: boolean = false;
    public totalPend: number;
    public totalOrder: number;
    public totalInvoice: number;
    /***Logistica Cedi***/
    public activeGraphCedi: boolean = false;
    public doughnutChartType: string = 'doughnut';
    public doughnutChartData: number[] = [0, 0, 0, 0];
    public doughnutChartLabels: string[] = ['Sin Asignar', 'En Picking', 'En Packing', 'En Shipping'];
    /***Ordenes del día***/
    public ordersOfDay: Array<any>;
    public activeOrderOfDay: boolean = false;
    public barChartTypeOrderOfDay: string = 'doughnut';
    public barChartDataOrderOfDay: number[] = [0, 0, 0, 0, 0];
    public barChartLabelsOrderOfDay: string[] = ['Día -5', 'Día -4', 'Día -3', 'Ayer', 'Hoy'];
    /***COMEX Costo compra***/
    public activeCostoCompra: boolean = false;
    public barChartTypeCostoCompra: string = 'bar';
    public barChartLegend = true;
    public barChartLabelsCostoCompra: string[];
    public barChartDataCostoCompra: any[] = [{ data: [], label: '' }, { data: [], label: '' }, { data: [], label: '' }, { data: [], label: '' }];
    public costosCompras: Array<PurchaseCost>;
    /***COMEX Factor compra***/
    public factoresCompras: Array<any>;
    public activeFactorCompra: boolean = false;
    public barChartTypeFactorCompra: string = 'bar';
    public barChartLabelsFactorCompra: string[];
    public barChartDataFactorCompra: any[] = [{ data: [], label: '' }];
    public selectedMonth: string = '';
    public selectedYear: number;
    /***COMEX Costo importacion***/
    public costosImports: Array<any>;
    public activeCostoImport: boolean = false;
    public barChartTypeCostoImport: string = 'bar';
    public barChartLabelsCostoImport: string[];
    public barChartDataCostoImport: any[] = [{ data: [], label: '' }, { data: [], label: '' }, { data: [], label: '' }, { data: [], label: '' }];
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
        this.byCollect = new Array<ByCollect>();
    }

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
        } else if (this.queryParam.id == 'VELEZ') {
            this.logo = 'logo-mr.png';
        } else {
            this._router.navigate(['/']);
            return;
        }

        let date = new Date();
        this.year = date.getFullYear();
        this.setMonthName(date.getMonth());
        this.selectedMonth = this.monthName;
        this.selectedYear = this.year;
    }

    private initializeComex() {
        /***Informe costo compra COMEX***/
        if (this.activeCostoCompra) {
            this.barChartDataCostoCompra = [
                { data: [this.costosCompras[0].costLogistic, this.costosCompras[1].costLogistic, this.costosCompras[2].costLogistic, this.costosCompras[3].costLogistic, this.costosCompras[4].costLogistic, this.costosCompras[5].costLogistic, this.costosCompras[6].costLogistic, this.costosCompras[7].costLogistic, this.costosCompras[8].costLogistic, this.costosCompras[9].costLogistic, this.costosCompras[10].costLogistic, this.costosCompras[11].costLogistic], label: '2019' },
                { data: [this.costosCompras[12].costLogistic, this.costosCompras[13].costLogistic, this.costosCompras[14].costLogistic, this.costosCompras[15].costLogistic, this.costosCompras[16].costLogistic, this.costosCompras[17].costLogistic, this.costosCompras[18].costLogistic, this.costosCompras[19].costLogistic, this.costosCompras[20].costLogistic, this.costosCompras[21].costLogistic, this.costosCompras[22].costLogistic, this.costosCompras[23].costLogistic], label: '2020' },
                { data: [this.costosCompras[24].costLogistic, this.costosCompras[25].costLogistic, this.costosCompras[26].costLogistic, this.costosCompras[27].costLogistic, this.costosCompras[28].costLogistic, this.costosCompras[29].costLogistic, this.costosCompras[30].costLogistic, this.costosCompras[31].costLogistic, this.costosCompras[32].costLogistic, this.costosCompras[33].costLogistic, this.costosCompras[34].costLogistic, this.costosCompras[35].costLogistic], label: '2021' },
                { data: [this.costosCompras[36].costLogistic, this.costosCompras[37].costLogistic, this.costosCompras[38].costLogistic, this.costosCompras[39].costLogistic, this.costosCompras[40].costLogistic, this.costosCompras[41].costLogistic, this.costosCompras[42].costLogistic, this.costosCompras[43].costLogistic, this.costosCompras[44].costLogistic, this.costosCompras[45].costLogistic, this.costosCompras[46].costLogistic, this.costosCompras[47].costLogistic], label: '2022' }
            ];
        }
        /***Informe costo import COMEX***/
        if (this.activeCostoImport) {
            this.barChartDataCostoImport = [
                { data: [this.costosImports[0][1], this.costosImports[1][1], this.costosImports[2][1], this.costosImports[3][1], this.costosImports[4][1], this.costosImports[5][1], this.costosImports[6][1], this.costosImports[7][1], this.costosImports[8][1], this.costosImports[9][1], this.costosImports[10][1], this.costosImports[11][1]], label: '2018' },
                { data: [this.costosImports[0][2], this.costosImports[1][2], this.costosImports[2][2], this.costosImports[3][2], this.costosImports[4][2], this.costosImports[5][2], this.costosImports[6][2], this.costosImports[7][2], this.costosImports[8][2], this.costosImports[9][2], this.costosImports[10][2], this.costosImports[11][2]], label: '2019' },
                { data: [this.costosImports[0][3], this.costosImports[1][3], this.costosImports[2][3], this.costosImports[3][3], this.costosImports[4][3], this.costosImports[5][3], this.costosImports[6][3], this.costosImports[7][3], this.costosImports[8][3], this.costosImports[9][3], this.costosImports[10][3], this.costosImports[11][3]], label: '2020' },
                { data: [this.costosImports[0][4], this.costosImports[1][4], this.costosImports[2][4], this.costosImports[3][4], this.costosImports[4][4], this.costosImports[5][4], this.costosImports[6][4], this.costosImports[7][4], this.costosImports[8][4], this.costosImports[9][4], this.costosImports[10][4], this.costosImports[11][4]], label: '2021' }
            ];
        }
        /***Informe factor compra COMEX***/
        if (this.activeFactorCompra) {
            //this.barChartLabelsFactorCompra = [this.factoresCompras[0][2], this.factoresCompras[1][2], this.factoresCompras[2][2], this.factoresCompras[3][2], this.factoresCompras[4][2], this.factoresCompras[5][2], this.factoresCompras[6][2]];
            //this.barChartLabelsFactorCompra = ['EXTERNO LLANTAS', 'ARANCELES', 'MARÍTIMO', 'NACIONAL', 'PORTUARIOS', 'SEGURO', 'ADUANEROS'];
            this.barChartLabelsFactorCompra = ['MARÍTIMO', 'PORTUARIOS', 'ARANCELES', 'ADUANEROS', 'NACIONAL', 'SEGURO', 'EXTERNO LLANTAS',];
            this.barChartDataFactorCompra = [
                { data: [this.factoresCompras[0][5], this.factoresCompras[1][5], this.factoresCompras[2][5], this.factoresCompras[3][5], this.factoresCompras[4][5], this.factoresCompras[5][5], this.factoresCompras[6][5]], label: this.factoresCompras[0][0] },
            ];
        }  
    }

    private initializeAnnual() {
        if (this.activeSaleAnnual) {
            /***Informe anual***/
            this.barChartDataComercYear = [{
                data: [this.ventasAnuales[0].totalSale, this.ventasAnuales[1].totalSale, this.ventasAnuales[2].totalSale, this.ventasAnuales[3].totalSale],
                label: 'Ventas Anuales'
            }];
        }
        if (this.activeMargeAnnual) {
            /***Informe margen anual***/
            this.barChartDataComercMargeAnnual = [{
                data: [this.ventasAnuales[0].margeSale, this.ventasAnuales[1].margeSale, this.ventasAnuales[2].margeSale, this.ventasAnuales[3].margeSale],
                label: 'Margen Anual'
            }];
        }
    }

    private initializeMonth() {
        if (this.activeSaleMonth) {
            /***Informe mensual***/
            this.barChartDataComercMonth = [{
                data: [this.ventasMensuales[0].totalSale, this.ventasMensuales[1].totalSale, this.ventasMensuales[2].totalSale, this.ventasMensuales[3].totalSale, this.ventasMensuales[4].totalSale, this.ventasMensuales[5].totalSale, this.ventasMensuales[6].totalSale, this.ventasMensuales[7].totalSale, this.ventasMensuales[8].totalSale, this.ventasMensuales[9].totalSale, this.ventasMensuales[10].totalSale, this.ventasMensuales[11].totalSale],
                label: 'Ventas Mensuales'
            }];
        }
        if (this.activeMargeMonth) {
            /***Informe margen mensual***/
            this.barChartDataComercMargeMonth = [{
                data: [this.ventasMensuales[0].margeSale, this.ventasMensuales[1].margeSale, this.ventasMensuales[2].margeSale, this.ventasMensuales[3].margeSale, this.ventasMensuales[4].margeSale, this.ventasMensuales[5].margeSale, this.ventasMensuales[6].margeSale, this.ventasMensuales[7].margeSale, this.ventasMensuales[8].margeSale, this.ventasMensuales[9].margeSale, this.ventasMensuales[10].margeSale, this.ventasMensuales[11].margeSale],
                label: 'Margen Mensual'
            }];
        }
    }

    private cleanSalesAnnual() {
        this.barChartLabelsComercYear = [];
        this.barChartDataComercYear = [{ data: [], label: '' }];
        this.ventasAnuales = new Array<SalesAnnual>();
    }

    private cleanSalesMonthly() {
        this.barChartLabelsComercMonth = [];
        this.barChartDataComercMonth = [{ data: [], label: '' }];
        this.ventasMensuales = new Array<SalesMonthly>();
    }

    private cleanCostoCompra() {
        this.barChartDataCostoCompra = [{ data: [], label: '' }, { data: [], label: '' }, { data: [], label: '' }, { data: [], label: '' }];
        this.costosCompras = new Array<PurchaseCost>();
    }

    private redirectIfSessionInvalid(error) {
        if (error && error.status && error.status == 401) {
            localStorage.removeItem('igb.identity');
            localStorage.removeItem('igb.selectedCompany');
            this._router.navigate(['/']);
        }
    }

    private setMonthName(month: number) {
        switch ((month)) {
            case 0:
                this.monthName = 'Enero';
                break;
            case 1:
                this.monthName = 'Febrero';
                break;
            case 2:
                this.monthName = 'Marzo';
                break;
            case 3:
                this.monthName = 'Abril';
                break;
            case 4:
                this.monthName = 'Mayo';
                break;
            case 5:
                this.monthName = 'Junio';
                break;
            case 6:
                this.monthName = 'Julio';
                break;
            case 7:
                this.monthName = 'Agosto';
                break;
            case 8:
                this.monthName = 'Septiembre';
                break;
            case 9:
                this.monthName = 'Octubre';
                break;
            case 10:
                this.monthName = 'Noviembre';
                break;
            case 11:
                this.monthName = 'Diciembre';
                break;
        }
    }

    public getSalesAnnual() {
        this.cleanSalesMonthly();
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
                this.redirectIfSessionInvalid(error);
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
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    public getCollectMonthly() {
        this.recaudos = new Array<any>();
        this.activeByCollection = false;
        this.activeCollection = true;
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        this._reportService.getSalesCollectMonthly(this.queryParam.id, false).subscribe(
            response => {
                if (response.code == 0) {
                    this.recaudos = response.content;
                    this.totalSinVencer = 0;
                    this.total0a20 = 0;
                    this.total21a55 = 0;
                    this.total56a120 = 0;
                    this.total121a360 = 0;
                    this.totalMayor360 = 0;

                    for (let i = 0; i < this.recaudos.length; i++) {
                        this.totalSinVencer += this.recaudos[i][2];
                        this.total0a20 += this.recaudos[i][3];
                        this.total21a55 += this.recaudos[i][4];
                        this.total56a120 += this.recaudos[i][5];
                        this.total121a360 += this.recaudos[i][6];
                        this.totalMayor360 += this.recaudos[i][7];
                    }

                    $('#modal_transfer_process').modal('hide');
                    this.activeContentCartera = true;
                } else {
                    console.error("No encontro datos para mostar.");
                    $('#modal_transfer_process').modal('hide');
                }
            },
            error => {
                console.error("Ocurrio un error al obtener el recaudo.", error);
                this.activeCollection = false;
                $('#modal_transfer_process').modal('hide');
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    public listOrdersOfDay() {
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        this.ordersOfDay = new Array<any>();
        this._reportService.listOrdersOfDay(this.queryParam.id, false).subscribe(
            response => {
                this.ordersOfDay = response;
                this.barChartDataOrderOfDay = [this.ordersOfDay[0][1], this.ordersOfDay[1][1], this.ordersOfDay[2][1], this.ordersOfDay[3][1], this.ordersOfDay[4][1]];
                $('#modal_transfer_process').modal('hide');
            }, error => {
                console.error("Ocurrio un error listando las ordenes del día.", error);
                $('#modal_transfer_process').modal('hide');
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    public getByCollect() {
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        this.activeCollection = false;
        this.activeByCollection = true;
        this.byCollect = new Array<ByCollect>();

        this._reportService.getSalesByCollect(this.queryParam.id, false).subscribe(
            response => {
                if (response.code == 0) {
                    this.totalByCollect = 0;
                    this.totalCarteraSana = 0;

                    for (let i = 0; i < response.content.length; i++) {
                        this.totalByCollect += response.content[i][1];
                    }

                    for (let i = 0; i < response.content.length; i++) {
                        const byCollect = new ByCollect();
                        byCollect.concept = response.content[i][0];
                        byCollect.subtotal = response.content[i][1];
                        byCollect.porcent = (byCollect.subtotal / this.totalByCollect) * 100;
                        this.byCollect.push(byCollect);
                    }

                    /*TODO: calculando cartera sana primeros 2 conceptos
                    1. Sin vencer
                    2. 0 a 20*/
                    for (let i = 0; i < 2; i++) {
                        this.totalCarteraSana += response.content[i][1];
                    }
                    this.porcentCarteraSana = (this.totalCarteraSana / this.totalByCollect) * 100;

                    $('#modal_transfer_process').modal('hide');
                    this.activeContentCartera = true;
                } else {
                    console.error("No encontro datos para mostar.");
                    $('#modal_transfer_process').modal('hide');
                }
            },
            error => {
                console.error("Ocurrio un error al obtener el recaudo.", error);
                this.activeCollection = false;
                $('#modal_transfer_process').modal('hide');
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    public getStatusOrder() {
        this.activeGraphCedi = false;
        this.activeStatusOrder = true;

        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        this._reportService.getStatesOrder(this.queryParam.id, false).subscribe(
            response => {
                if (response.code == 0) {
                    if (response.content.length == 0) {
                        this.statusOrders = new Array<any>();
                        this.totalPend = 0;
                        this.totalOrder = 0;
                        this.totalInvoice = 0;
                        this.activeContentLogist = true;
                        $('#modal_transfer_process').modal('hide');
                    } else {
                        this.statusOrders = response.content;
                        this.totalPend = 0;
                        this.totalOrder = 0;
                        this.totalInvoice = 0;
                        for (let i = 0; i < this.statusOrders.length; i++) {
                            this.totalPend += this.statusOrders[i].totalPend;
                        }
                        this.totalInvoice = this.statusOrders[0].totalInvoice;
                        this.totalOrder = this.statusOrders[0].totalOrder;
                        this.activeContentLogist = true;
                        $('#modal_transfer_process').modal('hide');
                    }
                } else {
                    console.error("No encontro datos para mostar.");
                    $('#modal_transfer_process').modal('hide');
                }
            },
            error => {
                console.error("Ocurrio un error al obtener las ordenes.", error);
                this.activeStatusOrder = false;
                $('#modal_transfer_process').modal('hide');
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    public getOrdersCedi() {
        this.activeStatusOrder = false;
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        this._reportService.obtainReportsOrders(this.queryParam.id, '01', false).subscribe(
            response => {
                this.doughnutChartData = response.content;
                this.activeGraphCedi = true;
                $('#modal_transfer_process').modal('hide');
                this.activeContentLogist = true;
            }, error => {
                console.error("Ocurrio un error al obtener el estado de las ordnes de bodega cedi.", error);
                $('#modal_transfer_process').modal('hide');
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    public getCostoCompra() {
        this.cleanCostoCompra();
        this.costosCompras = new Array<PurchaseCost>();
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        this._reportService.getPurchaseCost(this.queryParam.id, false).subscribe(
            response => {
                if (response.code == 0) {
                    this.costosCompras = response.content;
                    $('#modal_transfer_process').modal('hide');
                } else {
                    console.error("No encontro datos para mostar.");
                    $('#modal_transfer_process').modal('hide');
                }
            },
            error => {
                console.error(error);
                $('#modal_transfer_process').modal('hide');
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    public getFactorCompra() {
        this.factoresCompras = new Array<any>();
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        this._reportService.getPurchaseFactor(this.selectedYear, this.selectedMonth, this.queryParam.id, false).subscribe(
            response => {
                if (response.code == 0) {
                    this.factoresCompras = response.content;
                    $('#modal_transfer_process').modal('hide');
                    this.getActiveFactorCompra();
                } else {
                    console.error("No encontro datos para mostar.");
                    $('#modal_transfer_process').modal('hide');
                }
            },
            error => {
                console.error(error);
                $('#modal_transfer_process').modal('hide');
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    public getImportCompra() {
        this.costosImports = new Array<any>();
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        this._reportService.getImportCost(this.queryParam.id, false).subscribe(
            response => {
                if (response.code == 0) {
                    this.costosImports = response.content;
                    $('#modal_transfer_process').modal('hide');
                } else {
                    console.error("No encontro datos para mostar.");
                    $('#modal_transfer_process').modal('hide');
                }
            },
            error => {
                console.error(error);
                $('#modal_transfer_process').modal('hide');
                this.redirectIfSessionInvalid(error);
            }
        );
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

        this._reportService.getTrackingOrder(this.trackOrder, this.queryParam.id, false).subscribe(
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

    public getActiveFactorCompra() {
        this.activeContentComex = true;
        this.activeCostoCompra = false;
        this.activeFactorCompra = true;
        this.activeCostoImport = false;
        this.activeTimeImport = false;
        this.initializeComex();
    }

    public getTimeImport() {
        this.activeCostoCompra = false;
        this.activeFactorCompra = false;
        this.activeCostoImport = false;
        this.activeTimeImport = true;
        this.activeTracking = false;
    }

    public getActiveComexCostoCompra() {
        this.activeContentComex = true;
        this.activeCostoCompra = true;
        this.activeFactorCompra = false;
        this.activeCostoImport = false;
        this.activeTimeImport = false;
        this.barChartLabelsCostoCompra = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        this.initializeComex();
    }

    public getActiveComexCostoImport() {
        this.activeContentComex = true;
        this.activeCostoCompra = false;
        this.activeFactorCompra = false;
        this.activeCostoImport = true;
        this.activeTimeImport = false;
        this.barChartLabelsCostoImport = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        this.initializeComex();
    }

    public getActiveSaleAnnual() {
        this.activeSaleMonth = false;
        this.activeMargeMonth = false;
        this.activeMargeAnnual = false;
        this.activeOrderOfDay = false;
        if (this.activeSaleAnnual) {
            this.activeSaleAnnual = false;
        } else {
            this.activeContentGerencia = true;
            this.activeSaleAnnual = true;
            this.getSalesAnnual();
            this.barChartLabelsComercYear = [(this.year - 3).toString(), (this.year - 2).toString(), (this.year - 1).toString(), this.year.toString()];
        }
    }

    public getActiveSaleMonth() {
        this.activeSaleAnnual = false;
        this.activeMargeAnnual = false;
        this.activeMargeMonth = false;
        this.activeOrderOfDay = false;
        if (this.activeSaleMonth) {
            this.activeSaleMonth = false;
        } else {
            this.activeContentGerencia = true;
            this.activeSaleMonth = true;
            this.getSalesMonthly();
            this.barChartLabelsComercMonth = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        }
    }

    public getActiveMargeAnnual() {
        this.activeSaleAnnual = false;
        this.activeSaleMonth = false;
        this.activeMargeMonth = false;
        this.activeOrderOfDay = false;
        if (this.activeMargeAnnual) {
            this.activeMargeAnnual = false;
        } else {
            this.activeContentGerencia = true;
            this.activeMargeAnnual = true;
            this.getSalesAnnual();
            this.barChartLabelsComercMargeAnnual = [(this.year - 3).toString(), (this.year - 2).toString(), (this.year - 1).toString(), this.year.toString()];
        }
    }

    public getActiveMargeMonth() {
        this.activeSaleAnnual = false;
        this.activeSaleMonth = false;
        this.activeMargeAnnual = false;
        this.activeOrderOfDay = false;
        if (this.activeMargeMonth) {
            this.activeMargeMonth = false;
        } else {
            this.activeContentGerencia = true;
            this.activeMargeMonth = true;
            this.getSalesMonthly();
            this.barChartLabelsComercMargeMonth = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        }
    }

    public getActiveOrdersOfDay() {
        this.activeSaleAnnual = false;
        this.activeSaleMonth = false;
        this.activeMargeAnnual = false;
        this.activeMargeMonth = false;
        if (this.activeOrderOfDay) {
            this.activeOrderOfDay = false;
        } else {
            this.activeContentGerencia = true;
            this.activeOrderOfDay = true;
            this.listOrdersOfDay()
        }
    }

    public getActiveComercial() {
        this.activeContentCartera = false;
        this.activeContentLogist = false;
        this.activeContentComex = false;
        this.activeCollection = false;
        this.activeByCollection = false;
        this.activeStatusOrder = false;
        this.activeGraphCedi = false;
        this.activeOrderOfDay = false;
    }

    public getActiveSaleCollect() {
        this.activeContentGerencia = false;
        this.activeContentLogist = false;
        this.activeContentComex = false;
        this.activeSaleAnnual = false;
        this.activeSaleMonth = false;
        this.activeMargeAnnual = false;
        this.activeMargeMonth = false;
        this.activeStatusOrder = false;
        this.activeGraphCedi = false;
        this.activeOrderOfDay = false;
    }

    public getActiveLogistica() {
        this.activeContentCartera = false;
        this.activeContentGerencia = false;
        this.activeContentComex = false;
        this.activeCollection = false;
        this.activeByCollection = false;
        this.activeSaleAnnual = false;
        this.activeSaleMonth = false;
        this.activeMargeAnnual = false;
        this.activeMargeMonth = false;
        this.activeOrderOfDay = false;
    }

    public getActiveComex() {
        this.activeContentCartera = false;
        this.activeContentGerencia = false;
        this.activeContentLogist = false;
        this.activeCollection = false;
        this.activeByCollection = false;
        this.activeSaleAnnual = false;
        this.activeSaleMonth = false;
        this.activeMargeAnnual = false;
        this.activeMargeMonth = false;
        this.activeOrderOfDay = false;
        this.activeCostoCompra = false;
        this.activeFactorCompra = false;
        this.activeCostoImport = false;
        this.activeTimeImport = false;
        this.getCostoCompra();
        this.getImportCompra();
        this.getFactorCompra();
    }

    public getScrollTop() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }
}