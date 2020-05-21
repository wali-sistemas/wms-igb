import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { GLOBAL } from '../../services/global';

import { UserService } from '../../services/user.service';
import { TicketTIService } from '../../services/ticket-TI.service';

import 'rxjs/Rx'
import { ResupplyComponent } from '../resupply/resupply.component';
import { from } from 'rxjs/observable/from';

declare var $: any;

@Component({
    templateUrl: './ticket-TI.component.html',
    styleUrls: ['./ticket-TI.component.css'],
    providers: [UserService, TicketTIService]
})
export class TicketTIComponent implements OnInit {
    public identity;
    public urlShared: string = GLOBAL.urlShared;

    constructor(private _ticketTIService: TicketTIService, private _userService: UserService, private _router: Router) {
    }

    ngOnInit() {
        this.identity = this._userService.getItentity();
        if (this.identity === null) {
            this._router.navigate(['/']);
        }
        this.listTickets();
    }

    private redirectIfSessionInvalid(error) {
        if (error && error.status && error.status == 401) {
            localStorage.removeItem('igb.identity');
            localStorage.removeItem('igb.selectedCompany');
            this._router.navigate(['/']);
        }
    }

    private listTickets() {
        this._ticketTIService.ticketList().subscribe(
            response => {
                console.log(response);
            }, error => {
                console.error(error);
                this.redirectIfSessionInvalid(error);
            }
        );
    }

    public getScrollTop() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }
}