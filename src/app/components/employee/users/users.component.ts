import { Component, OnInit } from "@angular/core";
import { UserService } from "../../../services/user.service";
import { UserWali } from "../../../models/user-wali.model";
import { GLOBAL } from "app/services/global";
import { Router } from "@angular/router";

declare var $: any;

@Component({
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
  providers: [UserService],
})

export class EmployeeUsersComponent implements OnInit {
  public urlShared: string = GLOBAL.urlShared;
  public users: UserWali[] = [];
  public filteredUsers: UserWali[] = [];
  public searchText: string = "";
  public createUserError: string = "";
  public editUserError: string = "";
  public selectedUser: UserWali | null = null;
  public editUser: UserWali | null = null;
  public editIndex: number = -1;
  public membersSelected: string[] = [];
  public newUser: UserWali = this.getEmptyUser();

  constructor(private _userService: UserService, private _router: Router) { }

  ngOnInit() {
    this.loadUsers();
  }

  private redirectIfSessionInvalid(error: any) {
    if (error && error.status && error.status == 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

  private getEmptyUser() {
    return new UserWali("", "", "", "", new Date(), "", "", "", "", "activo");
  }

  public loadUsers() {
    $('#modal_userswali_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });

    this._userService.listUsers().subscribe(
      response => {
        this.users = response || [];
        this.filteredUsers = this.users;

        $('#modal_userswali_process').modal('hide');
      },
      error => {
        this.redirectIfSessionInvalid(error);
        console.error("Error consultando usuarios WALI", error);
        $('#modal_userswali_process').modal('hide');
      },
    );
  }

  public searchByUsername() {
    const term = (this.searchText || "").toLowerCase();

    if (!term) {
      this.filteredUsers = this.users;
      return;
    }

    this.filteredUsers = this.users.filter(
      user =>
        (user.username || "").toLowerCase().includes(term) ||
        (user.name || "").toLowerCase().includes(term) ||
        (user.surname || "").toLowerCase().includes(term) ||
        (user.email || "").toLowerCase().includes(term) ||
        (user.rol || "").toLowerCase().includes(term) ||
        (user.companyName || "").toLowerCase().includes(term) ||
        (user.status || "").toLowerCase().includes(term),
    );
  }

  public openView(user: UserWali) {
    this.selectedUser = user;
    $('#modalViewUser').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });
  }

  public openEdit(user: UserWali) {
    this.editIndex = this.users.indexOf(user);
    this.editUser = Object.assign({}, user);
    this.membersSelected = this.parseMembers(user.memberOf || "");
    this.editUserError = "";

    $('#modalEditUser').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });
  }

  public openCreate() {
    this.newUser = this.getEmptyUser();
    this.membersSelected = [];
    this.createUserError = "";

    $('#modalEmpleado').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });
  }

  public updateUser(form: any) {
    if (this.editIndex < 0 || !this.editUser) {
      return;
    }

    this.editUser.memberOf = this.membersSelected.join("");
    this.editUserError = "";

    this._userService.updateUserWali(this.editUser).subscribe(
      response => {
        if (response) {
          this.users[this.editIndex] = response;
          this.searchByUsername();

          this.editUser = null;
          this.editIndex = -1;
          this.membersSelected = [];
          this.editUserError = "";

          if (form) {
            form.resetForm();
          }

          this.loadUsers();
          $('#modalEditUser').modal('hide');
        } else {
          this.editUserError = "No fue posible actualizar el usuario.";
        }
      },
      error => {
        this.redirectIfSessionInvalid(error);
        console.error("Error actualizando usuario WALI:", error);
        this.editUserError = error._body || "No fue posible actualizar el usuario.";
      },
    );
  }

  public saveUser(form: any) {
    this.createUserError = "";
    this.newUser.memberOf = this.membersSelected.join("");

    this._userService.createUserWali(this.newUser).subscribe(
      response => {
        if (response) {
          this.users.push(response);
          this.filteredUsers = this.users;

          this.newUser = this.getEmptyUser();
          this.membersSelected = [];
          this.createUserError = "";

          if (form) {
            form.resetForm(this.newUser);
          }

          this.loadUsers();
          $('#modalEmpleado').modal('hide');
        } else {
          this.createUserError = "No fue posible crear el usuario.";
        }
      },
      error => {
        this.redirectIfSessionInvalid(error);
        console.error("Error creando usuario WALI:", error);
        this.createUserError = error._body || "El nombre de usuario ya se encuentra registrado.";
      },
    );
  }

  public toggleMember(value: string, checked: boolean) {
    if (checked) {
      if (!this.membersSelected.includes(value)) {
        this.membersSelected.push(value);
      }
    } else {
      this.membersSelected = this.membersSelected.filter((x) => x !== value);
    }
  }

  private parseMembers(memberOf: string) {
    const known = [
      "WMS.ticket",
      "WMS.emp",
      "WMS.merc",
      "WMS.cart",
      "WMS.coord",
      "WMS.admin",
    ];

    return known.filter((k) => (memberOf || "").includes(k));
  }

  public normalizeUsername(value: string) {
    return (value || "").toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
  }

  public getScrollTop() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }
}
