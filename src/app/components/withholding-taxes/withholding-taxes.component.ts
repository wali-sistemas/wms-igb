import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { GLOBAL } from '../../services/global';
import { ReportService } from '../../services/report.service'

declare var $: any;

@Component({
    templateUrl: './withholding-taxes.component.html',
    styleUrls: ['./withholding-taxes.component.css'],
    providers: [ReportService]
})
export class WithholdingTaxesComponent implements OnInit {
    public urlShared: string = GLOBAL.urlShared;
    public identity;
    public queryParam;
    public logo: string;
    public document: string;
    public selectedType: string = "";
    public selectedYear: string = "";
    public validDocument: boolean = true;
    public validType: boolean = true;
    public validYear: boolean = true;
    public selectedUser: string = "P";
    public validUser: boolean = true;

    constructor(private _reportService: ReportService, private _router: Router, private _routerParam: ActivatedRoute) {
        this._reportService = _reportService;
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
        } else {
            this._router.navigate(['/']);
            return;
        }
        $('#user').focus();
    }

    public getUrlReport() {
        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        if (this.selectedUser == null || this.selectedUser.length <= 0) {
            this.validUser = false;
            $('#modal_transfer_process').modal('hide');
            return;
        } else if (this.document == null || this.document.length <= 0) {
            this.validDocument = false;
            $('#modal_transfer_process').modal('hide');
            $('#doc').focus();
            return;
        } else if (this.selectedYear == null || this.selectedYear.length <= 0) {
            this.validYear = false;
            $('#modal_transfer_process').modal('hide');
            return;
        } else if (this.selectedUser == 'P') {
            if (this.selectedType == null || this.selectedType.length <= 0) {
                this.validType = false;
                $('#modal_transfer_process').modal('hide');
                return;
            }
        }

        let printReportDTO = {
            "id": this.selectedUser == 'P' ? this.document : "C" + this.document,
            "copias": 0,
            "documento": this.selectedUser == 'P' ? "withholding" : "shopping",
            "companyName": this.queryParam.id,
            "origen": "W",
            "imprimir": false,
            "filtro": this.selectedType,
            "filtroSec": this.selectedYear
        }

        this._reportService.generateReportManager(printReportDTO).subscribe(
            response => {
                if (response.code == 0) {
                    let landingUrl = this.urlShared + printReportDTO.companyName + "/" + printReportDTO.documento + "/" + printReportDTO.filtro + "/" + printReportDTO.id + ".pdf";
                    window.open(landingUrl, "_self");
                }
                this.clear();
                $('#modal_transfer_process').modal('hide');
            },
            error => {
                console.error('Ocurrio un error al generar el certificado.', error);
                this.clear();
                $('#modal_transfer_process').modal('hide');
            }
        );
    }

    private clear() {
        this.document = "";
        this.selectedType = "";
        this.selectedYear = "";
    }
}