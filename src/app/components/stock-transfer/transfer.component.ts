import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

declare var $: any;

@Component({
    templateUrl: './transfer.component.html',
    styleUrls: ['./transfer.component.css'],
})

export class TransferComponent implements OnInit {

    constructor(private _router: Router) {
    }

    ngOnInit() {
    }
}