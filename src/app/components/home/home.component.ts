import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../services/user.service';
import { GenericService } from '../../services/generic';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [UserService, GenericService]
})
export class HomeComponent implements OnInit {
  public errorMessage: string;
  public identity;

  constructor(private _userService: UserService,
    private _genericService: GenericService,
    private _route: ActivatedRoute,
    private _router: Router) {
  }

  ngOnInit() {
    this.validateStatus();
    this.identity = this._userService.getItentity();
    if (this.identity === null) {
      this._router.navigate(['/']);
    }
  }

  private validateStatus() {
    this._genericService.validateStatus().subscribe(
      response => { console.log('status ok', response); },
      error => {
        console.error(error);
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  cerrarSesion() {
    localStorage.removeItem('igb.identity');
    localStorage.removeItem('igb.selectedCompany');
    localStorage.clear();
    this.identity = null;
    this._router.navigate(['/']);
  }

  private redirectIfSessionInvalid(error) {
    if (error && error.status && error.status == 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

}
