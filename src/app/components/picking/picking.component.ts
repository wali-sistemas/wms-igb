import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../services/user.service'

declare var $: any;

@Component({
    templateUrl: './picking.component.html',
    styleUrls: ['./picking.component.css'],
    providers: [UserService]
})
export class PickingComponent implements OnInit {
    public identity;
    public selectedCompany: String;

    constructor(private _router: Router, private _userService: UserService) {
    }

    ngOnInit() {
      this.identity = this._userService.getItentity();
      if (this.identity === null) {
          this._router.navigate(['/']);
      }
      this.selectedCompany = this.identity.selectedCompany;
  }
}
