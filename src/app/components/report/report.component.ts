import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { ReportService } from '../../services/report.service';
import { log } from 'util';

declare var $: any;

@Component({
    templateUrl: './report.component.html',
    styleUrls: ['./report.component.css'],
    providers: [ReportService]
})
export class ReportComponent implements OnInit {

    public doughnutChartType: string = 'doughnut';
    public doughnutChartData: number[] = [0, 0];
    public doughnutChartLabels: string[] = ['Ordenes sin asignar', 'Ordenes asignadas'];
    public users: Array<any>;
    public pickingProgress: Array<any>;
    public clientsOrders: Array<any>;

    constructor(private _router: Router, private _reportService: ReportService) {
        this.users = new Array<any>();
        this.pickingProgress = new Array<any>();
        this.clientsOrders = new Array<any>();
    }

    ngOnInit() {
        this.obtainOrdersStatus();
        this.listEmployees();
        this.listPickingProgress();
        this.listReportsOrdersClient();
    }

    private obtainOrdersStatus() {
        this._reportService.obtainReportsOrders().subscribe(
            response => {
                this.doughnutChartData = response.content;
            }, error => { console.log(error); }
        );
    }

    public listEmployees() {
        this.users = new Array<any>();
        this._reportService.obtainReportsEmployeeAssigned('WMS').subscribe(
            response => {
                this.users = response.content;
            }, error => { console.error(error); }
        );
    }

    public listPickingProgress() {
        this.pickingProgress = new Array<any>();
        this._reportService.listPickingProgress().subscribe(
            response => {
                this.pickingProgress = response.content;
            }, error => { console.error(error); }
        );
    }

    public listReportsOrdersClient() {
        this.clientsOrders = new Array<any>();
        this._reportService.listReportsOrdersClient().subscribe(
            response => {
                this.clientsOrders = response.content;
            }, error => { console.error(error); }
        );
    }
}