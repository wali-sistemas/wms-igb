import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../services/user.service'

declare var $: any;

@Component({
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.css'],
  providers: [UserService]
})

export class EmployeeComponent {
  public identity;
  public selectedCompany: string;
  public custodyEmployeeModuleAccesible: boolean = false;

  constructor(private _router: Router, private _userService: UserService) {
  }

  ngOnInit() {
    this.identity = this._userService.getItentity();
    if (this.identity === null) {
      this._router.navigate(['/']);
    }
    this.selectedCompany = this.identity.selectedCompany;

    //TODO: Se debe definir que usuarios pueden asignar y cambiar la prioridad.
    if (this.identity.username !== "rmoncada" && this.identity.username !== "jguisao" && this.identity.username !== "rzapata" && this.identity.username !== "jlondonoc") {
      this.custodyEmployeeModuleAccesible = false;
    } else {
      //Autorizados para ver modulo de custodias
      this.custodyEmployeeModuleAccesible = true;
    }
  }
}
