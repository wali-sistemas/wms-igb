import { Component, OnInit } from "@angular/core";
import { UserService } from "../../../services/user.service";
import { UserWali } from "../../../models/user-wali.model";

@Component({
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
  providers: [UserService],
})

export class EmployeeUsersComponent implements OnInit {
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

  constructor(private userService: UserService) { }

  ngOnInit() {
    this.loadUsers();
  }

  private getEmptyUser() {
    return new UserWali("", "", "", "", new Date(), "", "", "", "", "activo");
  }

  public loadUsers() {
    this.userService.listUsers().subscribe(
      response => {
        this.users = response || [];
        this.filteredUsers = this.users;
        console.log("Usuarios WALI:", this.users);
      },
      error => { console.error("Error consultando usuarios WALI", error); },
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
    (window as any).$("#modalViewUser").modal("show");
  }

  public openEdit(user: UserWali) {
    this.editIndex = this.users.indexOf(user);
    this.editUser = Object.assign({}, user);
    this.editUser.oldUsername = user.username;
    this.membersSelected = this.parseMembers(user.memberOf);
    this.editUserError = "";

    (window as any).$("#modalEditUser").modal("show");
  }

  public openCreate() {
    this.newUser = this.getEmptyUser();
    this.membersSelected = [];
    this.createUserError = "";
    (window as any).$("#modalEmpleado").modal("show");
  }

  public updateUser(form: any) {
    if (this.editIndex < 0 || !this.editUser) return;

    this.editUser.memberOf = this.membersSelected.join("");
    this.editUserError = "";

    this.userService.updateUserWali(this.editUser).subscribe(
      (updatedUser: UserWali) => {
        if (updatedUser) {
          this.users[this.editIndex] = updatedUser;
          this.searchByUsername();

          this.editUser = null;
          this.editIndex = -1;
          this.membersSelected = [];
          this.editUserError = "";

          if (form) {
            form.resetForm();
          }

          (window as any).$("#modalEditUser").modal("hide");
        } else {
          this.editUserError = "No fue posible actualizar el usuario.";
        }
      },
      error => {
        console.error("Error actualizando usuario WALI:", error);
        this.editUserError = error._body || "No fue posible actualizar el usuario.";
      },
    );
  }

  public saveUser(form: any) {
    this.createUserError = "";
    this.newUser.memberOf = this.membersSelected.join("");

    this.userService.createUserWali(this.newUser).subscribe(
      (createdUser: UserWali) => {
        if (createdUser) {
          this.users.push(createdUser);
          this.filteredUsers = this.users;

          this.newUser = this.getEmptyUser();
          this.membersSelected = [];
          this.createUserError = "";

          if (form) {
            form.resetForm(this.newUser);
          }

          (window as any).$("#modalEmpleado").modal("hide");
        } else {
          this.createUserError = "No fue posible crear el usuario.";
        }
      },
      error => {
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

  publicpublicgetInitials(user: UserWali) {
    if (!user) {
      return "U"
    };

    const n1 = (user.name || "").trim().charAt(0);
    const n2 = (user.surname || "").trim().charAt(0);
    const ini = (n1 + n2).toUpperCase();

    return ini || "U";
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
}
