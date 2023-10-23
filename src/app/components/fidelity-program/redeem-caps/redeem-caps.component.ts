import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { RedeemPoint } from 'app/models/redeem-point';
import { CalidosoService } from '../../../services/calidoso.service';

declare var $: any;

@Component({
  templateUrl: './redeem-caps.component.html',
  styleUrls: ['./redeem-caps.component.css'],
  providers: [CalidosoService]
})

export class RedeemCapsComponent {
  public redeemPoint: RedeemPoint = new RedeemPoint();
  public amount: number;
  public isFormValid: boolean = false;
  public changeInvoiceErrorMessage: string;
  public changeInvoiceMessage: string;

  constructor(private _router: Router, private _calidosoService: CalidosoService) {
    this.redeemPoint.docType = 'CT';
    this.redeemPoint.concept = '';
  }

  ngOnInit() {
    this.isFormValid = false;
    $('#cardCode').focus();
  }

  private redirectIfSessionInvalid(error): void {
    if (error && error.status && error.status == 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

  @HostListener('document:click')
  public onClick(): void {
    this.changeInvoiceErrorMessage = '';
    this.changeInvoiceMessage = '';
  }

  public calculatevalue() {
    this.redeemPoint.point = this.amount * 500;
    this.validateForm();
  }

  public sendPoints() {
    this.redeemPoint.cardCode = 'C' + this.redeemPoint.cardCode;
    this.redeemPoint.docDate = this.getCurrentDateFormatted();
    $('#modal_transfer_process').modal('show');
    this._calidosoService.redeemPointsClubVip(this.redeemPoint).subscribe(
      response => {
        if (response.code === 0) {
          this.changeInvoiceMessage = response.content;
        } else {
          this.changeInvoiceErrorMessage = response.content;
        }
        $('#modal_transfer_process').modal('hide');
        this.clear();
      },
      error => {
        this.changeInvoiceErrorMessage = 'Ha ocurrido un error de conexión';
        $('#modal_transfer_process').modal('hide');
        this.clear();
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public handleChecked() {
    if (this.isFormValid) {
      $('#confirmedModal').modal('show');
    }
  }

  public validateForm() {
    this.isFormValid = !!this.redeemPoint.cardCode && !!this.amount && !!this.redeemPoint.transferDate;
  }

  public clear() {
    this.redeemPoint = new RedeemPoint();
    this.amount = null;
    this.redeemPoint.docType = 'CT';
    this.redeemPoint.concept = '';
    this.isFormValid = false;
    $('#cardCode').focus();
  }

  private addLeadingZero(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }

  private getCurrentDateFormatted(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = this.addLeadingZero(today.getMonth() + 1);
    const day = this.addLeadingZero(today.getDate());
    return `${year}-${month}-${day}`;
  }
}
