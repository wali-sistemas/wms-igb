import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'igb-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  providers: [UserService]
})
export class NavBarComponent implements OnInit {
  public identity;
  public token;

  constructor(private _userService: UserService, private _route: ActivatedRoute, private _router: Router) {

  }

  ngOnInit() {
    this.identity = this._userService.getItentity();
    if (this.identity === null) {
      this._router.navigate(['/']);
    }
  }

  alternateNav() {
    if (document.getElementById("myNav").style.width === '' || document.getElementById("myNav").style.width === '0%') {
      document.getElementById("myNav").style.width = "100%";
      //Configura el icono para cerrar
      document.getElementById("menu-icon").classList.remove('glyphicon-menu-hamburger');
      document.getElementById("menu-icon").classList.add('glyphicon-remove');
    } else {
      document.getElementById("myNav").style.width = "0%";
      //configura el icono de hamburguesa
      document.getElementById("menu-icon").classList.remove('glyphicon-remove');
      document.getElementById("menu-icon").classList.add('glyphicon-menu-hamburger');
    }
  }

  public getSelectedCompany() {
    return localStorage.getItem("igb.selectedCompany");
  }

  cerrarSesion() {
    localStorage.removeItem('igb.identity');
    localStorage.removeItem('igb.selectedCompany');
    localStorage.clear();
    this.identity = null;
    this._router.navigate(['/']);
  }
}
