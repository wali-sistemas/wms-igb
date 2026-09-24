import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service'

declare var $: any;

@Component({
  templateUrl: './recover-password.component.html',
  styleUrls: ['./recover-password.component.css'],
  providers: [UserService]
})

export class RecoverPasswordComponent {
  public loadingRecovery: boolean = true;
  public recoveryCode: string = '';
  public newPassword: string = '';
  public confirmPassword: string = '';
  public recoveryError: string = '';
  public user: any;

  constructor(private _userService: UserService, private _router: Router) { }

  ngOnInit() {
    // Simulación de carga
    setTimeout(() => { this.loadingRecovery = false; }, 1500);
  }

  public onSubmit() {
    this.recoveryError = '';

    if (!this.user.username || !this.user.email) {
      this.recoveryError = 'Debe ingresar el usuario y el correo electrónico.';
      return;
    }

    const data = { username: this.user.username, email: this.user.email };
    this.loadingRecovery = true;

    this._userService.requestRecoveryCode(data).subscribe(
      response => {
        if (response.code === 0) {
          this.recoveryCode = '';

          $('#modal_recovery_code').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
          });

          this.loadingRecovery = false;
        } else {
          this.loadingRecovery = false;

          $('#modal_invalid_recovery_data').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
          });
        }
      },
      error => {
        this.loadingRecovery = false;
        this.recoveryError = 'Ocurrió un error solicitando el código de recuperación.';
        console.error('Error al solicitar código de recuperación:', error);
      }
    );
  }

  public validateRecoveryCode() {
    this.recoveryError = '';

    if (!this.recoveryCode || this.recoveryCode.trim() === '') {
      this.recoveryError = 'Debe ingresar el código de recuperación.';
      return;
    }

    const data = {
      username: this.user.username,
      email: this.user.email,
      code: this.recoveryCode
    };

    this.loadingRecovery = true;

    this._userService.verifyRecoveryCode(data).subscribe(
      response => {
        if (response.code === 0) {

          $('#modal_recovery_code').modal('hide');
          this.recoveryError = '';
          this.newPassword = '';
          this.confirmPassword = '';

          setTimeout(() => {
            $('#modal_change_password').modal({
              backdrop: 'static',
              keyboard: false,
              show: true
            });

            this.loadingRecovery = false;
          }, 800);
        } else {
          this.loadingRecovery = false;
          $('#modal_invalid_recovery_data').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
          });
        }
      },
      error => {
        this.loadingRecovery = false;
        this.recoveryError = 'Ocurrió un error validando el código.';
        console.error('Error al validar código de recuperación:', error);
      }
    );
  }

  public changePassword() {
    this.recoveryError = '';

    if (!this.newPassword || !this.confirmPassword) {
      this.recoveryError = 'Debe ingresar y confirmar la nueva contraseña.';
      return;
    }

    const passwordError = this.validatePassword(this.newPassword);

    if (passwordError) {
      this.recoveryError = passwordError;
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.recoveryError = 'Las contraseñas no coinciden.';
      return;
    }

    const data = {
      username: this.user.username,
      email: this.user.email,
      code: this.recoveryCode,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword
    };

    this.loadingRecovery = true;

    this._userService.changeRecoveryPassword(data).subscribe(
      response => {
        this.loadingRecovery = false;

        if (response.code === 0) {
          $('#modal_change_password').modal('hide');

          this.newPassword = '';
          this.confirmPassword = '';
          this.recoveryCode = '';
          this.recoveryError = '';

          setTimeout(() => {
            $('#modal_password_success').modal({
              backdrop: 'static',
              keyboard: false,
              show: true
            });
          }, 900);
        } else { this.recoveryError = response.content; }
      },
      error => {
        this.loadingRecovery = false;
        this.recoveryError = 'Ocurrió un error actualizando la contraseña.';
        console.error('Error al actualizar contraseña:', error);
      }
    );
  }

  private validatePassword(password: string): string {
    if (password.length < 8) { return 'La contraseña debe contener mínimo 8 caracteres.'; }
    if (!/[A-Z]/.test(password)) { return 'La contraseña debe contener al menos una letra mayúscula.'; }
    if (!/[0-9]/.test(password)) { return 'La contraseña debe contener al menos un número.'; }
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password)) { return 'La contraseña debe contener al menos un carácter especial.'; }
    return '';
  }
}
