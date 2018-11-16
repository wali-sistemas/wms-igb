import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { User } from '../../models/user.model';
import { Company } from '../../models/company';
import { UserService } from '../../services/user.service';
import { GenericService } from '../../services/generic';

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [UserService, GenericService]
})
export class LoginComponent implements OnInit {
  public errorMessage: string;
  public identity;
  public token;
  public user: User;
  public companies: Array<Company>;
  public selectedCompany: string = '';

  constructor(private _userService: UserService, private _genericService: GenericService, private _route: ActivatedRoute, private _router: Router) {
    this.user = new User('', '', '', '', '', '', true);
    this.companies = new Array<Company>();
  }

  ngOnInit() {
    console.log('iniciando componente de login');
    //TODO: validar vigencia del token/identity
    this.identity = this._userService.getItentity();
    if (this.identity !== null) {
      this._router.navigate(['/home']);
    }
    this.loadAvailableCompanies();
  }

  private loadAvailableCompanies() {
    this._genericService.listAvailableCompanies().subscribe(
      response => {
        this.companies = response;
        console.log('se encontraron las siguientes empresas para hacer login: ', this.companies);
      }, error => { console.error(error); }
    );
  }

  public onSubmit() {
    this.errorMessage = null;
    this._userService.signIn(this.user, this.selectedCompany).subscribe(
      response => {
        if (response.code === 0) {
          this.identity = response.user;
          localStorage.setItem('igb.identity', JSON.stringify(this.identity));
          localStorage.setItem('igb.selectedCompany', this.selectedCompany);

          for (let i = 0; i < this.companies.length; i++) {
            if (this.companies[i].companyId == this.selectedCompany) {
              if (this.companies[i].companyName.toLowerCase().indexOf('prueba') >= 0) {
                localStorage.setItem('igb.pruebas', 'true');
              }
            }
          }

          this.user = new User('', '', '', '', '', '', true);
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
