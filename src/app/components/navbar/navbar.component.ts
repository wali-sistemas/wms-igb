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
  public logo;
  public ordersModuleAccesible: boolean = false;
  public pickingModuleAccesible: boolean = false;
  public resupplyModuleAccesible: boolean = false;
  public transferModuleAccesible: boolean = false;
  public receptionModuleAccesible: boolean = false;
  public packingModuleAccesible: boolean = false;
  public inventoryModuleAccesible: boolean = false;
  public shippingModuleAccesible: boolean = false;
  public ticketTIModuleAccesible: boolean = false;
  public pickingExpressModuleAccesible: boolean = false;

  constructor(private _userService: UserService, private _route: ActivatedRoute, private _router: Router) { }

  ngOnInit() {
    this.identity = this._userService.getItentity();
    if (this.identity === null) {
      this._router.navigate(['/']);
    }

    if (this.identity.selectedCompany == 'VARROC' || this.identity.selectedCompany == 'VARROCPruebas') {
      this.logo = 'logo-mtz.png';
    } else {
      this.logo = 'logo-igb.png';
    }

    this.initializeAccessParameters();
  }

  private initializeAccessParameters() {
    //valida si ya hay datos en sesion
    let userAccess = JSON.parse(localStorage.getItem('igb.user.access'));
    if (userAccess) {
      this.ordersModuleAccesible = userAccess.ordersModuleAccesible;
      this.pickingModuleAccesible = userAccess.pickingModuleAccesible;
      this.resupplyModuleAccesible = userAccess.resupplyModuleAccesible;
      this.transferModuleAccesible = userAccess.transferModuleAccesible;
      this.receptionModuleAccesible = userAccess.receptionModuleAccesible;
      this.packingModuleAccesible = userAccess.packingModuleAccesible;
      this.inventoryModuleAccesible = userAccess.inventoryModuleAccesible;
      this.shippingModuleAccesible = userAccess.shippingModuleAccesible;
      this.ticketTIModuleAccesible = userAccess.ticketTIModuleAccesible;
      this.pickingExpressModuleAccesible = userAccess.pickingExpressModuleAccesible;
      return;
    }

    userAccess = {
      ordersModuleAccesible: false,
      pickingModuleAccesible: false,
      resupplyModuleAccesible: false,
      transferModuleAccesible: false,
      receptionModuleAccesible: false,
      packingModuleAccesible: false,
      inventoryModuleAccesible: false,
      shippingModuleAccesible: false,
      ticketTIModuleAccesible: false,
      pickingExpressModuleAccesible: false
    };

    localStorage.setItem('igb.user.access', JSON.stringify(userAccess));

    //validar si el usuario puede acceder al modulo de ticketTI
    this._userService.canAccess(this.identity.username, 'ticketTI').subscribe(
      response => {
        if (response.code == 0) {
          this.ticketTIModuleAccesible = true;
          userAccess = JSON.parse(localStorage.getItem('igb.user.access'));
          userAccess.ticketTIModuleAccesible = true;
          localStorage.setItem('igb.user.access', JSON.stringify(userAccess));
        } else {
          this.ticketTIModuleAccesible = false;
        }
      }, error => { console.error(error); }
    );

    //validar si el usuario puede acceder al modulo de ordenes
    this._userService.canAccess(this.identity.username, 'orders').subscribe(
      response => {
        if (response.code == 0) {
          this.ordersModuleAccesible = true;
          userAccess = JSON.parse(localStorage.getItem('igb.user.access'));
          userAccess.ordersModuleAccesible = true;
          localStorage.setItem('igb.user.access', JSON.stringify(userAccess));
        } else {
          this.ordersModuleAccesible = false;
        }
      }, error => { console.error(error); }
    );

    //validar si el usuario puede acceder al modulo de picking
    this._userService.canAccess(this.identity.username, 'picking').subscribe(
      response => {
        if (response.code == 0) {
          this.pickingModuleAccesible = true;
          userAccess = JSON.parse(localStorage.getItem('igb.user.access'));
          userAccess.pickingModuleAccesible = true;
          localStorage.setItem('igb.user.access', JSON.stringify(userAccess));
        } else {
          this.pickingModuleAccesible = false;
        }
      }, error => { console.error(error); }
    );

    //validar si el usuario puede acceder al modulo de packing
    this._userService.canAccess(this.identity.username, 'packing').subscribe(
      response => {
        if (response.code == 0) {
          this.packingModuleAccesible = true;
          userAccess = JSON.parse(localStorage.getItem('igb.user.access'));
          userAccess.packingModuleAccesible = true;
          localStorage.setItem('igb.user.access', JSON.stringify(userAccess));
        } else {
          this.packingModuleAccesible = false;
        }
      }, error => { console.error(error); }
    );

    //validar si el usuario puede acceder al modulo de shipping
    this._userService.canAccess(this.identity.username, 'shipping').subscribe(
      response => {
        if (response.code == 0) {
          this.shippingModuleAccesible = true;
          userAccess = JSON.parse(localStorage.getItem('igb.user.access'));
          userAccess.shippingModuleAccesible = true;
          localStorage.setItem('igb.user.access', JSON.stringify(userAccess));
        } else {
          this.shippingModuleAccesible = false;
        }
      }, error => { console.error(error); }
    );

    //validar si el usuario puede acceder al modulo de inventory
    this._userService.canAccess(this.identity.username, 'inventory').subscribe(
      response => {
        if (response.code == 0) {
          this.inventoryModuleAccesible = true;
          userAccess = JSON.parse(localStorage.getItem('igb.user.access'));
          userAccess.inventoryModuleAccesible = true;
          localStorage.setItem('igb.user.access', JSON.stringify(userAccess));
        } else {
          this.inventoryModuleAccesible = false;
        }
      }, error => { console.error(error); }
    );

    //validar si el usuario puede acceder al modulo de resupply
    this._userService.canAccess(this.identity.username, 'resupply').subscribe(
      response => {
        if (response.code == 0) {
          this.resupplyModuleAccesible = true;
          userAccess = JSON.parse(localStorage.getItem('igb.user.access'));
          userAccess.resupplyModuleAccesible = true;
          localStorage.setItem('igb.user.access', JSON.stringify(userAccess));
        } else {
          this.resupplyModuleAccesible = false;
        }
      }, error => { console.error(error); }
    );

    //validar si el usuario puede acceder al modulo de reception
    this._userService.canAccess(this.identity.username, 'reception').subscribe(
      response => {
        if (response.code == 0) {
          this.receptionModuleAccesible = true;
          userAccess = JSON.parse(localStorage.getItem('igb.user.access'));
          userAccess.receptionModuleAccesible = true;
          localStorage.setItem('igb.user.access', JSON.stringify(userAccess));
        } else {
          this.receptionModuleAccesible = false;
        }
      }, error => { console.error(error); }
    );

    //validar si el usuario puede acceder al modulo de transfer
    this._userService.canAccess(this.identity.username, 'transfer').subscribe(
      response => {
        if (response.code == 0) {
          this.transferModuleAccesible = true;
          userAccess = JSON.parse(localStorage.getItem('igb.user.access'));
          userAccess.transferModuleAccesible = true;
          localStorage.setItem('igb.user.access', JSON.stringify(userAccess));
        } else {
          this.transferModuleAccesible = false;
        }
      }, error => { console.error(error); }
    );

    //validar si el usuario puede acceder a la opción de pickingExpress
    this._userService.canAccess(this.identity.username, 'pickingExpress').subscribe(
      response => {
        if (response.code == 0) {
          this.pickingExpressModuleAccesible = true;
          userAccess = JSON.parse(localStorage.getItem('igb.user.access'));
          userAccess.pickingExpressModuleAccesible = true;
          localStorage.setItem('igb.user.access', JSON.stringify(userAccess));
        } else {
          this.pickingExpressModuleAccesible = false;
        }
      }, error => { console.error(error); }
    );

    localStorage.setItem('igb.user.access', JSON.stringify(userAccess));
  }

  alternateNav() {
    if (document.getElementById('myNav').style.width === '' || document.getElementById('myNav').style.width === '0%') {
      document.getElementById('myNav').style.width = '100%';
      //Configura el icono para cerrar
      document.getElementById('menu-icon').classList.remove('glyphicon-menu-hamburger');
      document.getElementById('menu-icon').classList.add('glyphicon-remove');
    } else {
      document.getElementById('myNav').style.width = '0%';
      //configura el icono de hamburguesa
      document.getElementById('menu-icon').classList.remove('glyphicon-remove');
      document.getElementById('menu-icon').classList.add('glyphicon-menu-hamburger');
    }
  }

  public getSelectedCompany() {
    return localStorage.getItem('igb.selectedCompany');
  }

  cerrarSesion() {
    localStorage.removeItem('igb.identity');
    localStorage.removeItem('igb.selectedCompany');
    localStorage.removeItem('igb.user.access');
    localStorage.removeItem('igb.pruebas');
    localStorage.clear();
    this.identity = null;
    this._router.navigate(['/']);
  }
}