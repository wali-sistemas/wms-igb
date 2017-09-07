import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { User } from '../../models/user.model';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [UserService]
})
export class LoginComponent implements OnInit {
  public errorMessage: string;
  public identity;
  public token;
  public user: User;

  constructor(private _userService: UserService, private _route: ActivatedRoute, private _router: Router) {
    this.user = new User('', '', '', '', '', '', true);
  }

  ngOnInit() {
    console.log('iniciando componente de login');
    //TODO: validar vigencia del token/identity
    this.identity = this._userService.getItentity();
    if (this.identity !== null) {
      this._router.navigate(['/home']);
    }
  }

  public onSubmit() {
    this.errorMessage = null;
    this._userService.signIn(this.user).subscribe(
      response => {
        if (response.code === 0) {
          this.identity = response.user;
          localStorage.setItem('igb.identity', JSON.stringify(this.identity));
          this.user = new User('', '', '', '', '', '', true);
          console.log('navegando a /home');
          this._router.navigate(['/home']);
        } else {
          this.errorMessage = response.message;
        }
      },
      error => {
        alert('error');
        console.error(error);
      }
    );
  }
}
