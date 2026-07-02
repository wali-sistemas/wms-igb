import { Component, OnInit, Renderer2 } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'igb-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  providers: [UserService]
})
export class NavBarComponent implements OnInit {
  public identity: any;
  public logo: string = '';
  public count: number = 0;
  public minWidth: number = 0;
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
  public compraTrackingModuleAccesible: boolean = false;
  public collectionModuleAccesible: boolean = false;
  public employeeModuleAccesible: boolean = false;
  public fidelityProgramModuleAccesible: boolean = false;
  public geoLocationModuleAccesible: boolean = false;
  public assistantAIModuleAccesible: boolean = false;

  constructor(private _userService: UserService, private _route: ActivatedRoute, private _router: Router, private renderer: Renderer2) { }

  ngOnInit() {
    this.identity = this._userService.getItentity();
    if (this.identity === null) {
      this._router.navigate(['/']);
    }

    switch (this.identity.selectedCompany) {
      case 'IGB':
        this.logo = 'logo-igb.png';
        break;
      case 'IGBPruebas':
        this.logo = 'logo-igb.png';
        break;
      case 'VARROC':
        this.logo = 'logo-mtz.png';
        break;
      case 'VARROCPruebas':
        this.logo = 'logo-mtz.png';
        break;
      case 'REDPLAS':
        this.logo = 'logo-redplas.png';
        break;
      case 'REDPLASPruebas':
        this.logo = 'logo-redplas.png';
        break;
      case 'VELEZ':
        this.logo = 'logo-mr.png';
        break;
      case 'VELEZPruebas':
        this.logo = 'logo-mr.png';
        break;
    }

    this.initializeAccessParameters();
    //Llamar a la función para contar los módulos accesibles
    this.count = this.countAccessibleModules();
    this.minWidth = this.count < 10 ? 1200 : 1550;
    this.setDynamicMediaQuery();
  }

  public setDynamicMediaQuery() {
    const styleEl = this.renderer.createElement('style');

    // Crear los media queries dinámicos para cambiar la vista entre móvil y escritorio
    const mediaQuery = `
      @media screen and (min-width: ${this.minWidth}px) {
        #desktopNav {
          display: block;
        }
        #mobileNav, #myNav {
          display: none;
        }
      }
      @media screen and (max-width: ${this.minWidth - 1}px) {
        #mobileNav, #myNav {
          display: block;
        }
        #desktopNav {
          display: none;
        }
      }
    `;

    const text = this.renderer.createText(mediaQuery);
    this.renderer.appendChild(styleEl, text);
    this.renderer.appendChild(document.head, styleEl);
  }

  private initializeAccessParameters() {
    //valida si ya hay datos en sesion
    const storedUserAccess = localStorage.getItem('igb.user.access');
    let userAccess = storedUserAccess ? JSON.parse(storedUserAccess) : null;
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
      this.compraTrackingModuleAccesible = userAccess.compraTrackingModuleAccesible;
      this.collectionModuleAccesible = userAccess.collectionModuleAccesible;
      this.fidelityProgramModuleAccesible = userAccess.fidelityProgramModuleAccesible;
      this.employeeModuleAccesible = userAccess.employeeModuleAccesible;
      this.geoLocationModuleAccesible = userAccess.geoLocationModuleAccesible;
      this.assistantAIModuleAccesible = userAccess.assistantAIModuleAccesible;
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
      pickingExpressModuleAccesible: false,
      compraTrackingModuleAccesible: false,
      collectionModuleAccesible: false,
      fidelityProgramModuleAccesible: false,
      employeeModuleAccesible: false,
      geoLocationModuleAccesible: false,
      assistantAIModuleAccesible: false
    };

    localStorage.setItem('igb.user.access', JSON.stringify(userAccess));

    //validar si el usuario puede acceder al modulo de ticketTI
    this._userService.canAccess(this.identity.username, 'ticketTI').subscribe(
      response => {
        if (response.code == 0) {
          this.ticketTIModuleAccesible = true;
          const storedUserAccess = localStorage.getItem('igb.user.access');
          let userAccess = storedUserAccess ? JSON.parse(storedUserAccess) : null;
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
          const storedUserAccess = localStorage.getItem('igb.user.access');
          let userAccess = storedUserAccess ? JSON.parse(storedUserAccess) : null;
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
          const storedUserAccess = localStorage.getItem('igb.user.access');
          let userAccess = storedUserAccess ? JSON.parse(storedUserAccess) : null;
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
          const storedUserAccess = localStorage.getItem('igb.user.access');
          let userAccess = storedUserAccess ? JSON.parse(storedUserAccess) : null;
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
          const storedUserAccess = localStorage.getItem('igb.user.access');
          let userAccess = storedUserAccess ? JSON.parse(storedUserAccess) : null;
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
          const storedUserAccess = localStorage.getItem('igb.user.access');
          let userAccess = storedUserAccess ? JSON.parse(storedUserAccess) : null;
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
          const storedUserAccess = localStorage.getItem('igb.user.access');
          let userAccess = storedUserAccess ? JSON.parse(storedUserAccess) : null;
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
          const storedUserAccess = localStorage.getItem('igb.user.access');
          let userAccess = storedUserAccess ? JSON.parse(storedUserAccess) : null;
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
          const storedUserAccess = localStorage.getItem('igb.user.access');
          let userAccess = storedUserAccess ? JSON.parse(storedUserAccess) : null;
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
          const storedUserAccess = localStorage.getItem('igb.user.access');
          let userAccess = storedUserAccess ? JSON.parse(storedUserAccess) : null;
          userAccess.pickingExpressModuleAccesible = true;
          localStorage.setItem('igb.user.access', JSON.stringify(userAccess));
        } else {
          this.pickingExpressModuleAccesible = false;
        }
      }, error => { console.error(error); }
    );

    //validar si el usuario puede acceder a la opción de employee
    this._userService.canAccess(this.identity.username, 'employee').subscribe(
      response => {
        if (response.code == 0) {
          this.employeeModuleAccesible = true;
          const storedUserAccess = localStorage.getItem('igb.user.access');
          let userAccess = storedUserAccess ? JSON.parse(storedUserAccess) : null;
          userAccess.employeeModuleAccesible = true;
          localStorage.setItem('igb.user.access', JSON.stringify(userAccess));
        } else {
          this.employeeModuleAccesible = false;
        }
      }, error => { console.error(error); }
    );

    //validar si el usuario puede acceder a la opción de compras(tracking)
    this._userService.canAccess(this.identity.username, 'tracking').subscribe(
      response => {
        if (response.code == 0) {
          this.compraTrackingModuleAccesible = true;
          const storedUserAccess = localStorage.getItem('igb.user.access');
          let userAccess = storedUserAccess ? JSON.parse(storedUserAccess) : null;
          userAccess.compraTrackingModuleAccesible = true;
          localStorage.setItem('igb.user.access', JSON.stringify(userAccess));
        } else {
          this.compraTrackingModuleAccesible = false;
        }
      }, error => { console.error(error); }
    );

    //validar si el usuario puede acceder al modulo de cartera
    this._userService.canAccess(this.identity.username, 'collection').subscribe(
      response => {
        if (response.code == 0) {
          this.collectionModuleAccesible = true;
          const storedUserAccess = localStorage.getItem('igb.user.access');
          let userAccess = storedUserAccess ? JSON.parse(storedUserAccess) : null;
          userAccess.collectionModuleAccesible = true;
          localStorage.setItem('igb.user.access', JSON.stringify(userAccess));
        } else {
          this.collectionModuleAccesible = false;
        }
      }, error => { console.error(error); }
    );

    //validar si el usuario puede acceder al modulo de fidelización, solo si es MOTOZONE
    if (this.getSelectedCompany() == "VARROC" || this.getSelectedCompany() == "IGB") {
      this._userService.canAccess(this.identity.username, 'fidelityProgram').subscribe(
        response => {
          if (response.code == 0) {
            this.fidelityProgramModuleAccesible = true;
            const storedUserAccess = localStorage.getItem('igb.user.access');
            let userAccess = storedUserAccess ? JSON.parse(storedUserAccess) : null;
            userAccess.fidelityProgramModuleAccesible = true;
            localStorage.setItem('igb.user.access', JSON.stringify(userAccess));
          } else {
            this.fidelityProgramModuleAccesible = false;
          }
        }, error => { console.error(error); }
      );
    } else {
      this.fidelityProgramModuleAccesible = false;
    }

    //validar si el usuario puede acceder al modulo de geolocalizador
    this._userService.canAccess(this.identity.username, 'geolocation').subscribe(
      response => {
        if (response.code == 0) {
          this.geoLocationModuleAccesible = true;
          const storedUserAccess = localStorage.getItem('igb.user.access');
          let userAccess = storedUserAccess ? JSON.parse(storedUserAccess) : null;
          userAccess.geoLocationModuleAccesible = true;
          localStorage.setItem('igb.user.access', JSON.stringify(userAccess));
        } else {
          this.geoLocationModuleAccesible = false;
        }
      }, error => { console.error(error); }
    );

    //validar si el usuario puede acceder al modulo de asistente de IA, solo si es IGB
    if (this.getSelectedCompany() == "IGB") {
      this._userService.canAccess(this.identity.username, 'assistantAI').subscribe(
        response => {
          if (response.code == 0) {
            this.assistantAIModuleAccesible = true;
            const storedUserAccess = localStorage.getItem('igb.user.access');
            let userAccess = storedUserAccess ? JSON.parse(storedUserAccess) : null;
            userAccess.assistantAIModuleAccesible = true;
            localStorage.setItem('igb.user.access', JSON.stringify(userAccess));
          } else {
            this.assistantAIModuleAccesible = false;
          }
        }, error => { console.error(error); }
      );
    } else {
      this.assistantAIModuleAccesible = false;
    }

    localStorage.setItem('igb.user.access', JSON.stringify(userAccess));
  }

  public alternateNav() {
    const myNav = document.getElementById('myNav');
    const menuIcon = document.getElementById('menu-icon');

    if (!myNav || !menuIcon) {
      return;
    }

    if (myNav.style.width === '' || myNav.style.width === '0%') {
      myNav.style.width = '100%';
      //Configura el icono para cerrar
      menuIcon.classList.remove('glyphicon-menu-hamburger');
      menuIcon.classList.add('glyphicon-remove');
    } else {
      myNav.style.width = '0%';
      //configura el icono de hamburguesa
      menuIcon.classList.remove('glyphicon-remove');
      menuIcon.classList.add('glyphicon-menu-hamburger');
    }
  }

  public getSelectedCompany() {
    return localStorage.getItem('igb.selectedCompany');
  }

  public cerrarSesion() {
    localStorage.removeItem('igb.identity');
    localStorage.removeItem('igb.selectedCompany');
    localStorage.removeItem('igb.user.access');
    localStorage.removeItem('igb.pruebas');
    localStorage.clear();
    this.identity = null;
    this._router.navigate(['/']);
  }

  public countAccessibleModules(): number {
    let accessibleModulesCount = 0;

    const modules = [
      { name: 'ordersModuleAccesible', value: this.ordersModuleAccesible },
      { name: 'pickingModuleAccesible', value: this.pickingModuleAccesible },
      { name: 'resupplyModuleAccesible', value: this.resupplyModuleAccesible },
      { name: 'transferModuleAccesible', value: this.transferModuleAccesible },
      { name: 'receptionModuleAccesible', value: this.receptionModuleAccesible },
      { name: 'packingModuleAccesible', value: this.packingModuleAccesible },
      { name: 'inventoryModuleAccesible', value: this.inventoryModuleAccesible },
      { name: 'shippingModuleAccesible', value: this.shippingModuleAccesible },
      { name: 'ticketTIModuleAccesible', value: this.ticketTIModuleAccesible },
      { name: 'pickingExpressModuleAccesible', value: this.pickingExpressModuleAccesible },
      { name: 'compraTrackingModuleAccesible', value: this.compraTrackingModuleAccesible },
      { name: 'collectionModuleAccesible', value: this.collectionModuleAccesible },
      { name: 'employeeModuleAccesible', value: this.employeeModuleAccesible },
      { name: 'fidelityProgramModuleAccesible', value: this.fidelityProgramModuleAccesible },
      { name: 'geoLocationModuleAccesible', value: this.geoLocationModuleAccesible }
    ];
    modules.forEach(module => {
      if (module.value) {
        accessibleModulesCount++;
      }
    });
    return accessibleModulesCount;
  }
}
