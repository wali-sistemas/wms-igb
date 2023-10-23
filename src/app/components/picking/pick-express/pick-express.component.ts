import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../../services/user.service'

declare var $: any;

@Component({
  templateUrl: './pick-express.component.html',
  styleUrls: ['./pick-express.component.css'],
  providers: [UserService]
})
export class PickExpressComponent implements OnInit {
  public identity;
  public selectedCompany: String;
  public document: String;

  constructor(private _userService: UserService, private _router: Router) {
  }

  ngOnInit() {
    this.identity = this._userService.getItentity();
    if (this.identity === null) {
      this._router.navigate(['/']);
    }
    this.selectedCompany = this.identity.selectedCompany;
  }

  private redirectIfSessionInvalid(error) {
    if (error && error.status && error.status === 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }
}
