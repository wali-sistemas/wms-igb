import { Component, OnInit } from '@angular/core';

declare var $: any;

@Component({
    templateUrl: './withholding-taxes.component.html',
    styleUrls: ['./withholding-taxes.component.css']
})
export class WithholdingTaxesComponent implements OnInit {
    public identity;
    public document: string;
    public selectedType: string = "";
    public errorMessage: string;
    public exitMessage: string;

    constructor() {
    }

    ngOnInit() { }

    public captureClient() {
        this.errorMessage = "";
        this.exitMessage = "";

        $('#modal_transfer_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
        /*
        if (this.document == null || this.document.length <= 0) {
            this.getScrollTop();
            $('#modal_transfer_process').modal('hide');
            return;
        }*/
    }

    public getScrollTop() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }
}