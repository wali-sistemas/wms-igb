import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { PaymentsMicrositeService } from '../../../services/payments-microsite.service';
import { MotorepuestosCheckoutResponse } from '../../../models/mtr/motorepuestos-checkout-response';
import { MotorepuestosCheckoutItem } from '../../../models/mtr/motorepuestos-checkout-item';
import { WompiPaymentResponse } from '../../../models/mtr/wompi-payment-response';

declare var $: any;
declare var WidgetCheckout: any;

@Component({
  templateUrl: './wallet-mtr.component.html',
  styleUrls: ['./wallet-mtr.component.css'],
  providers: [PaymentsMicrositeService]
})

export class WalletMTRComponent implements OnInit, OnDestroy {
  public document: string = '';
  public cardCode: string = '';
  public customerName: string = '';
  public isButtonEnabled: boolean = false;
  public isLoading: boolean = false;
  public isCreatingPayment: boolean = false;
  public errorMessage: string = '';
  public checkoutResponse: MotorepuestosCheckoutResponse = new MotorepuestosCheckoutResponse();
  public checkoutCode: string = '';
  public items: MotorepuestosCheckoutItem[] = [];
  public city: string = '';
  public address: string = '';
  public subtotal: number = 0;
  public iva: number = 0;
  public freight: number = 0;
  public totalToPay: number = 0;
  public checkoutLoaded: boolean = false;
  public showPaymentConfirmation: boolean = false;
  public showAlert: boolean = false;
  public showFAQModal: boolean = false;
  public countdownInterval: any;
  public timeLeft: number = 600;

  constructor(private _router: Router, private _paymentsMicrositeService: PaymentsMicrositeService, private _cdr: ChangeDetectorRef) { }

  ngOnInit() {
    const hashValue = window.location.hash.substring(1);

    if (hashValue) {
      this.document = hashValue.trim();
      this.checkInput();
      this.getCheckout();
    } else {
      setTimeout(() => {
        $('#document').focus();
      }, 200);
    }
  }

  ngOnDestroy() {
    this.clearCountdown();
  }

  public checkInput() {
    this.document = this.document.replace(/[^0-9]/g, '');
    this.isButtonEnabled = this.document !== null && this.document !== undefined && this.document.trim() !== '';
  }

  public getCheckout() {
    if (this.document === null || this.document === undefined || this.document.trim() === '') {
      this.errorMessage = 'Ingrese un documento válido.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this._paymentsMicrositeService.getMotorepuestosCheckout(this.document).subscribe(
      response => {
        this.isLoading = false;
        if (response && response.code === 0 && response.checkoutCode) {
          this.checkoutResponse = response;
          this.checkoutCode = response.checkoutCode || '';
          this.cardCode = response.cardCode || '';
          this.customerName = response.customerName || '';
          this.city = response.city || '';
          this.address = response.address || '';
          this.subtotal = Number(response.subtotal || 0);
          this.iva = Number(response.iva || 0);
          this.freight = Number(response.freight || 0);
          this.totalToPay = Number(response.total || 0);
          this.items = response.items || [];
          this.checkoutLoaded = true;
          this.startCountdown();
        } else {
          this.clearCheckoutInformation();
          this.errorMessage = response && response.message ? response.message : 'No encontramos una compra pendiente de pago para este documento.';
        }
      }, error => {
        this.isLoading = false;
        this.clearCheckoutInformation();
        this.errorMessage = 'No fue posible consultar tu compra en este momento. Intenta nuevamente.';
        console.error('Error al consultar checkout de Motorepuestos:', error);
      }
    );
  }

  public openPaymentConfirmation() {
    if (!this.checkoutLoaded || !this.checkoutCode || !this.totalToPay || this.totalToPay <= 0) {
      return;
    }
    this.showPaymentConfirmation = true;
  }

  public confirmPayment() {
    this.showPaymentConfirmation = false;
    this.sendPaymentRequest();
  }

  public cancelPayment() {
    this.showPaymentConfirmation = false;
  }

  public sendPaymentRequest() {
    if (!this.checkoutLoaded || !this.checkoutCode || !this.document || !this.totalToPay || this.totalToPay <= 0 || this.isCreatingPayment) {
      return;
    }
    const paymentRequest = {
      checkoutCode: this.checkoutCode,
      document: this.document
    };
    this.isCreatingPayment = true;
    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });

    this._paymentsMicrositeService.createMotorepuestosWompiPaymentSession(paymentRequest).subscribe(
      response => {
        this.isCreatingPayment = false;
        $('#modal_transfer_process').modal('hide');
        if (response && response.code === 0 && response.reference && response.publicKey && response.currency && response.amountInCents && response.integritySignature) {
          this.openWompiPayment(response);
        } else {
          this.errorMessage = response && response.message ? response.message : 'No fue posible preparar el pago con Wompi. Intenta nuevamente.';
        }
      }, error => {
        this.isCreatingPayment = false;
        $('#modal_transfer_process').modal('hide');
        this.errorMessage = 'No fue posible conectar con el servicio de pagos Wompi.';
        console.error('Error al crear sesión de pago Wompi:', error);
      }
    );
  }

  private loadWompiWidget(onLoaded: () => void) {
    if (typeof WidgetCheckout !== 'undefined') {
      onLoaded();
      return;
    }
    const existingScript = document.getElementById('wompi-widget-script') as HTMLScriptElement;
    if (existingScript) {
      existingScript.onload = () => {
        onLoaded();
      };
      existingScript.onerror = () => {
        this.handleWompiScriptError();
      };
      return;
    }
    const script = document.createElement('script');
    script.id = 'wompi-widget-script';
    script.type = 'text/javascript';
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;
    script.onload = () => {
      onLoaded();
    };
    script.onerror = () => {
      this.handleWompiScriptError();
    };
    document.head.appendChild(script);
  }

  private openWompiPayment(response: WompiPaymentResponse) {
    this.loadWompiWidget(() => {
      try {
        const checkout = new WidgetCheckout({
          currency: response.currency,
          amountInCents: Number(response.amountInCents),
          reference: response.reference,
          publicKey: response.publicKey,
          signature: {
            integrity: response.integritySignature
          }
        });
        checkout.open((result: any) => {
          if (
            result &&
            result.transaction &&
            result.transaction.id
          ) {
            const transactionId = result.transaction.id;
            this.registerWompiTransaction(
              response.reference,
              transactionId,
              result.transaction.status
            );
          }
        });
      } catch (error) {
        this.errorMessage = 'No fue posible abrir la ventana segura de Wompi.';
      }
    });
  }

  private registerWompiTransaction(
    reference: string,
    transactionId: string,
    widgetStatus: string
  ) {
    this._paymentsMicrositeService.registerMotorepuestosWompiTransaction(reference, transactionId).subscribe(
      response => {
        if (
          !response ||
          response.code !== 0
        ) {
          this.errorMessage =
            'La transacción fue recibida por Wompi, pero no pudimos registrar ' +
            'su identificador para la confirmación automática. ' +
            'El pago quedará pendiente de conciliación.';
        }
      }, error => {
        this.errorMessage =
          'La transacción fue recibida por Wompi, pero no pudimos completar ' +
          'la confirmación automática. El pago quedará pendiente de conciliación.';
      }
    );
  }

  private handleWompiScriptError() {
    this.isCreatingPayment = false;
    this.errorMessage =
      'No fue posible cargar el servicio de pagos Wompi. Intenta nuevamente.';
  }

  private startCountdown() {
    this.clearCountdown();
    this.timeLeft = 600;
    this.countdownInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.handleSessionExpiration();
      }
      this._cdr.detectChanges();
    }, 1000);
  }

  private clearCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  public handleSessionExpiration() {
    this.clearCountdown();
    this.clearInput();
    this.showAlert = true;
  }

  public closeAlert() {
    this.showAlert = false;
    setTimeout(() => {
      $('#document').focus();
    }, 100);
  }

  public formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes.toString();
    const formattedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds.toString();
    return formattedMinutes + ':' + formattedSeconds;
  }

  public openFAQModal() {
    this.showFAQModal = true;
  }

  public closeFAQModal() {
    this.showFAQModal = false;
  }

  private clearCheckoutInformation() {
    this.checkoutResponse = new MotorepuestosCheckoutResponse();
    this.checkoutCode = '';
    this.cardCode = '';
    this.customerName = '';
    this.city = '';
    this.address = '';
    this.subtotal = 0;
    this.iva = 0;
    this.freight = 0;
    this.totalToPay = 0;
    this.items = [];
    this.checkoutLoaded = false;
    this.clearCountdown();
  }

  public clearInput() {
    this.clearCountdown();
    this.clearCheckoutInformation();
    this.document = '';
    this.errorMessage = '';
    this.isButtonEnabled = false;
    this.isLoading = false;
    this.isCreatingPayment = false;
    this.showPaymentConfirmation = false;

    setTimeout(() => {
      $('#document').focus();
    }, 100);
  }
}
