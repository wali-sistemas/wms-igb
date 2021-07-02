import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { GLOBAL } from '../../../services/global';
import { ModulaService } from '../../../services/modula.service';
import { UserService } from '../../../services/user.service';

declare var $: any;

@Component({
    templateUrl: './modula.component.html',
    styleUrls: ['./modula.component.css'],
    providers: [ModulaService, UserService]
})
export class ModulaComponent implements OnInit {
    private itemsDifferences: Array<any>;
    private errorMessage: String;
    public identity;
    public urlShared: String = GLOBAL.urlShared;

    constructor(private _modulaService: ModulaService, private _router: Router, private _userService: UserService) {
        this.itemsDifferences = new Array<any>();
    }

    ngOnInit() {
        this.identity = this._userService.getItentity();
        if (this.identity === null) {
            this._router.navigate(['/']);
        }
        this.listItems();
    }

    private redirectIfSessionInvalid(error) {
        if (error && error.status && error.status == 401) {
            localStorage.removeItem('igb.identity');
            localStorage.removeItem('igb.selectedCompany');
            this._router.navigate(['/']);
        }
    }

    public listItems() {
        $('#modal_process').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        this._modulaService.getStockMissing().subscribe(
            response => {
                console.log(response);
                this.itemsDifferences = response;
                $('#modal_process').modal('hide');
            },
            error => {
                $('#modal_process').modal('hide');
                this.errorMessage = "Ocurrio un error invoncando el servicio de comparación.";
                console.error(error);
                this.redirectIfSessionInvalid(error);
            }
        )
    }

    public getScrollTop() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }
}