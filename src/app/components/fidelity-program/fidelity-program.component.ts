import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../services/user.service'

declare var $: any;

@Component({
  templateUrl: './fidelity-program.component.html',
  styleUrls: ['./fidelity-program.component.css'],
  providers: [UserService]
})

export class FidelityProgramComponent {
  public identity;
  public selectedCompany: string;

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
