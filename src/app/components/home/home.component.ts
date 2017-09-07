import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
//import { User } from '../../models/user.model';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [UserService]
})
export class HomeComponent implements OnInit {
  public errorMessage: string;
  public identity;
  //public user: User;

  constructor(private _userService: UserService, private _route: ActivatedRoute, private _router: Router) {
    //this.user = new User('', '', '', '', '', '', true);
  }

  ngOnInit() {
    console.log('iniciando componente de home');
    this.identity = this._userService.getItentity();
    //TODO: validar vigencia del token/identity
    if (this.identity === null) {
      this._router.navigate(['/']);
    }
  }

  cerrarSesion() {
    localStorage.removeItem('igb.identity');
    localStorage.clear();
    this.identity = null;
    this._router.navigate(['/']);
  }

}
