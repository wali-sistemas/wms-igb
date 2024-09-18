import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CalidosoService } from '../../../services/calidoso.service';
import { UserService } from '../../../services/user.service';

declare var $: any;

@Component({
  templateUrl: './redeem-points.component.html',
  styleUrls: ['./redeem-points.component.css'],
  providers: [CalidosoService, UserService]
})

export class RedeemPointsComponent {
  public selectedCompany: string;
  public cardCode: string;
  public changeErrorMessage: string;
  public customer: string;
  public points: string;
  public concept: string;
  public state: boolean = false;

  constructor(private _router: Router, private _calidosoService: CalidosoService, private _userService: UserService) { }

  ngOnInit() {
    const identity = this._userService.getItentity();
    if (identity) {
      this.selectedCompany = identity.selectedCompany;
    }
    $('#cardCode').focus();
  }

  private redirectIfSessionInvalid(error): void {
    if (error && error.status && error.status == 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

  public getPoints() {
    this.changeErrorMessage = "";
    $('#modal_transfer_process').modal('show');
    this._calidosoService.getAvailablePoints(this.cardCode, this.selectedCompany).subscribe(
      response => {
        if (response && response.length > 0) {
          response.forEach(item => {
            this.customer = item.cardCode;
            this.concept = item.concept;
            this.points = item.point;
            this.state = true;
          });
        } else if (response.length === 0) {
          this.state = false;
          this.changeErrorMessage = "No se encontraron datos.";
          this.clear();
        }
        $('#modal_transfer_process').modal('hide');
      },
      error => {
        this.changeErrorMessage = 'Ha ocurrido un error de conexión.';
        $('#modal_transfer_process').modal('hide');
        this.clear();
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public clear() {
    this.state = false;
    this.cardCode = "";
    $('#cardCode').focus();
  }
}
