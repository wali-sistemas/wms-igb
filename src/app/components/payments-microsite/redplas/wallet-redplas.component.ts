import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WalletInvoice } from '../../../models/wallet-invoice';
import { PaymentReceipt } from '../../../models/payment-receipt';
import { PaymentsMicrositeService } from '../../../services/payments-microsite.service';
import { UserService } from '../../../services/user.service';
import { ChangeDetectorRef } from '@angular/core';

declare var $: any;

@Component({
  templateUrl: './wallet-redplas.component.html',
  styleUrls: ['./wallet-redplas.component.css'],
  providers: [PaymentsMicrositeService, UserService]
})

export class WalletRedplasComponent implements OnInit {
  public cardCode: string = '';
  public selectedCompany: string = 'REDPLAS';
  public noInvoicesMessage: string = '';
  public filterDetail: string = '';
  public paymentReference: string;
  public concatenatedInvoices: string = '';
  public fullReference: string = '';
  public dateReference: string = '';
  public keyIntegrity: string = '';
  public input: string = '';
  public walletInvoices: WalletInvoice[] = [];
  public selectedInvoices: WalletInvoice[] = [];
  public filteredInvoices: WalletInvoice[] = [];
  public selectedInvoice: WalletInvoice;
  public paymentsReceipts: PaymentReceipt[] = [];
  public holdInvoices: string[] = [];
  public totalToPay: number = 0;
  public newTotal: number = 0;
  public timeLeft: number = 600;
  public isButtonEnabled: boolean = false;
  public isLoading: boolean = false;
  public isWompiFormVisible: boolean = false;
  public showAlert: boolean = false;
  public isPayButtonDisabled: boolean = true;
  public countdownInterval: any;
  public showPaymentConfirmation: boolean = false;
  public showEditModal: boolean = false;
  public showFAQModal = false;

  constructor(private _router: Router, private _paymentsMicrositeService: PaymentsMicrositeService, private _userService: UserService, private _cdr: ChangeDetectorRef) { }

  ngOnInit() {
    $('#cardCode').focus();
    this.releaseInvoices();
    this.getDetailsInvoice();
  }

  public loadWompiScript() {
    this.isWompiFormVisible = true;

    // 1. Registrar facturas en hold
    this.prepareAndSendPaymentSession();
    this.buildReference(); // Genera la referencia completa
    this.buildIntegrityAndLoadScript(); // Genera la firma y carga el script cuando esté lista
  }

  private buildIntegrityAndLoadScript() {
    const KeyIntegrityWompi = 'prod_integrity_dGmcUuwbu3jJEEICqnC2zR9K4B60eBhD';
    this.keyIntegrity = `${this.fullReference}${(this.totalToPay * 100)}COP${KeyIntegrityWompi}`;

    this._paymentsMicrositeService.getKeySHA256(this.keyIntegrity).subscribe(
      response => {
        this.input = response.content;

        const script = document.createElement('script');
        script.src = "https://checkout.wompi.co/widget.js";
        script.setAttribute("data-render", "button");
        script.setAttribute("data-public-key", "pub_prod_xsTrvZjX3GMmcdBJFC1PFBCwJ9HXzhuy");
        script.setAttribute("data-currency", "COP");
        script.setAttribute("data-amount-in-cents", (this.totalToPay * 100).toString());
        script.setAttribute("data-reference", this.fullReference);
        script.setAttribute("data-signature:integrity", this.input);
        script.setAttribute("data-redirect-url", "https://redplas.co/");
        script.setAttribute("data-customer-data:email", "contabilidad@redplas.co");

        const wompiForm = document.getElementById('wompiForm');
        wompiForm.innerHTML = ''; // Limpia scripts anteriores si los hay
        wompiForm.appendChild(script);

        script.onload = () => {
          const wompiButton = wompiForm.querySelector('button');
          if (wompiButton) {
            wompiButton.style.display = 'none';
            wompiButton.click(); // Opcional: abre el widget automáticamente
          }
        };
      },
      error => {
        console.error('Error al obtener el token SHA256', error);
      }
    );
  }

  // Facturas en hold
  public prepareAndSendPaymentSession() {
    if (this.selectedInvoices.length === 0) return;
    const invoiceReferences = this.selectedInvoices.map(inv => inv.reference).join(',');
    let payerDocument = this.selectedInvoices[0].document.split('-')[0];
    const paymentSession = {
      u_invoice_id: invoiceReferences,
      u_user_id: payerDocument,
      u_status: "Y"
    };
    this._paymentsMicrositeService.sendPaymentSession(paymentSession, this.selectedCompany).subscribe(
      response => {
        console.info("Facturas en hold registradas:", response);
        this.getHoldInvoices(); // actualiza visualmente las facturas retenidas
      },
      error => {
        console.error("Error al registrar la sesión de pago:", error);
      }
    );
  }

  public releaseInvoices() {
    this._paymentsMicrositeService.releaseInvoices(this.selectedCompany).subscribe(
      response => {
        console.log("Facturas expiradas liberadas:", response.message);
      },
      error => {
        console.error("Error al liberar facturas expiradas:", error);
      }
    );
  }

  public getHoldInvoices() {
    this._paymentsMicrositeService.getHoldInvoices(this.cardCode, this.selectedCompany).subscribe(
      response => {
        this.holdInvoices = response.invoices; // lista de referencias
        this.updateInvoicesStatus(); // marca cuáles están en hold
      },
      error => {
        console.error("Error al obtener facturas en hold:", error);
      }
    );
  }

  public updateInvoicesStatus() {
    this.walletInvoices.forEach(invoice => {
      invoice.isHold = this.holdInvoices.includes(invoice.reference);
    });
  }

  // Método para construir llave de integridad
  public buildIntegrity() {
    const KeyIntegrityWompi = 'prod_integrity_dGmcUuwbu3jJEEICqnC2zR9K4B60eBhD'
    this.keyIntegrity = `${this.fullReference}${(this.totalToPay * 100).toString()}${'COP'}${KeyIntegrityWompi}`;
    this.generateKeySHA256();
  };

  // Método para generar token y construirlo en cadena256
  public generateKeySHA256() {
    this._paymentsMicrositeService.getKeySHA256(this.keyIntegrity).subscribe(
      response => {
        this.input = response.content;
      },
      error => {
        console.error('Error al obtener el token', error);
      }
    )
  }

  // Método para generar la referencia de pago con fecha y hora
  public generateReference() {
    const now = new Date();
    const year = now.getFullYear();
    const month = ('0' + (now.getMonth() + 1)).slice(-2);
    const day = ('0' + now.getDate()).slice(-2);
    const hours = ('0' + now.getHours()).slice(-2);
    const minutes = ('0' + now.getMinutes()).slice(-2);
    const seconds = ('0' + now.getSeconds()).slice(-2);
    // Concatenar los valores en el formato deseado y asignar a paymentReference
    this.paymentReference = `date${year}${month}${day}-${hours}${minutes}${seconds}datef`;
  }

  // Verificar si el input tiene valor para habilitar el botón
  public checkInput() {
    this.isButtonEnabled = this.cardCode.trim() !== '';
  }

  // Método para obtener los documentos por cliente
  public getDetailsInvoice() {
    this.isLoading = true;

    this._paymentsMicrositeService.getInvoicesDetail(this.cardCode, this.selectedCompany).subscribe(
      response => {
        this.walletInvoices = response;
        this.filteredInvoices = [...this.walletInvoices];
        if (this.walletInvoices.length > 0) {
          this.getHoldInvoices(); // Marca las facturas en hold una vez estén cargadas
          this.startCountdown();
        } else {
          this.noInvoicesMessage = 'No se encontraron documentos relacionados';
        }
        this.isLoading = false;
      },
      error => {
        console.error('Error al obtener la lista de facturas', error);
        this.isLoading = false;
      }
    );
  }

  // Obtener los recibos y mostrar el modal
  public getPaymentsReceipt() {
    $('#modal_transfer_process').modal({ backdrop: 'static', keyboard: false, show: true });
    this._paymentsMicrositeService.getPaymentReceipt(this.cardCode, this.selectedCompany).subscribe(
      response => {
        $('#modal_transfer_process').modal('hide');
        this.paymentsReceipts = response;
        this.showModal();
      },
      error => {
        $('#modal_transfer_process').modal('hide');
        console.error('Error al obtener los recibos de pago', error);
      }
    );
  }

  public showModal() {
    $('#paymentReceiptsModal').modal('show');
  }
  public closeModal() {
    $('#paymentReceiptsModal').modal('hide');
  }

  // Método para filtrar las facturas
  public filterOrdersDetail() {
    const filterValue = this.filterDetail.toLowerCase();
    if (filterValue) {
      this.filteredInvoices = this.walletInvoices.filter(invoice =>
        invoice.id.toString().includes(filterValue)
      );
    } else {
      this.filteredInvoices = [...this.walletInvoices];
    }
  }

  // Método para filtrar las facturas
  public toggleInvoiceSelection(invoice: WalletInvoice) {
    const index = this.selectedInvoices.findIndex(selected => selected.id === invoice.id);
    if (index >= 0) {
      this.selectedInvoices.splice(index, 1);
    } else {
      this.selectedInvoices.push(invoice);
    }
    this.totalToPay = this.selectedInvoices.reduce((acc, inv) => {
      const value = Number(inv.saldoDocumentoAdicional);
      return acc + (isNaN(value) ? 0 : value);
    }, 0);
    this.isWompiFormVisible = false;
    this.updateConcatenatedInvoices();
    this.isPayButtonDisabled = this.selectedInvoices.length === 0;
  }

  // Método para actualizar la variable de concatenación con valores sin puntos decimales
  private updateConcatenatedInvoices() {
    this.concatenatedInvoices = this.selectedInvoices
      .map(invoice => `${invoice.id}_${this.formatWithoutDecimals(invoice.saldoDocumentoAdicional)}`)
      .join('-');
  }

  // Método auxiliar para formatear el valor sin puntos
  private formatWithoutDecimals(value: number): string {
    return value.toFixed(2).replace('.', '');
  }

  // Método para construir la referencia completa y asignarla a fullReference
  public buildReference() {
    this.generateReference();
    const invoicesReference = this.concatenatedInvoices;
    this.fullReference = `${this.paymentReference}-${invoicesReference}-idC${this.cardCode}id`;
  }

  // Método para abrir el modal
  public openPaymentConfirmation() {
    this.showPaymentConfirmation = true;
  }

  // Método para confirmar el pago
  public confirmPayment() {
    this.showPaymentConfirmation = false;
    this.clearInput();
  }

  // Método para cancelar el pago
  public cancelPayment() {
    this.showPaymentConfirmation = false;
  }

  //Abrir Modal preguntas frecuentes
  openFAQModal() {
    this.showFAQModal = true;
  }

  // Cerrar Modal preguntas frecuentes
  closeFAQModal() {
    this.showFAQModal = false;
  }

  public get formattedNewTotal(): string {
    return this.newTotal.toLocaleString('es-CO');
  }

  // Cierra el popover
  public closePopover() {
    this.selectedInvoice = null;
    this.showEditModal = false;
  }

  public updateTotal(invoice: WalletInvoice) {
    if (invoice && this.newTotal > 0) {
      invoice.saldoDocumentoAdicional = Number(this.newTotal);
      this.closePopover();

      // Vuelve a calcular el total a pagar
      this.totalToPay = this.selectedInvoices.reduce((acc, inv) => {
        const value = Number(inv.saldoDocumentoAdicional);
        return acc + (isNaN(value) ? 0 : value);
      }, 0);

      // También actualiza la concatenación para la referencia
      this.updateConcatenatedInvoices();
    }
  }

  // Método sacar usuario a login principal
  public clearInput() {
    this.walletInvoices = [];
    this.cardCode = '';
    this.noInvoicesMessage = '';
    this.selectedInvoices = [];
    this.totalToPay = 0;
    this.input = '';
    this.fullReference = '';
    this.isPayButtonDisabled = true;
    $('#cardCode').focus();
  }

  // Método para vaciar llave antes de construirla
  public prepareKey() {
    this.paymentReference = '';
    this.fullReference = '';
    this.dateReference = '';
    this.keyIntegrity = '';
  }

  // Método para vaciar listas
  public clear() {
    this.selectedInvoices = [];
    this.totalToPay = 0;
    this.isWompiFormVisible = false;
    this.isPayButtonDisabled = true;
  }

  // Método para iniciar contador
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

  // Método para sacar cliente si expira sesión
  public handleSessionExpiration() {
    this.clearCountdown();
    this.clearInput();
    this.showAlert = true;
  }

  public closeAlert() {
    this.showAlert = false;
  }

  // Método paara reestablecer contador
  private clearCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  // Método para abrir modal de modificar valor
  public togglePopover(invoice: WalletInvoice) {
    this.showEditModal = true;
    if (this.selectedInvoice === invoice) {
      this.selectedInvoice = null;
    } else {
      this.selectedInvoice = invoice;
      this.newTotal = Number(invoice.saldoDocumentoAdicional);
    }
  }

  // Método para formatear  valores del contador a minutos y segundos
  public formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes.toString();
    const formattedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds.toString();
    return `${formattedMinutes}:${formattedSeconds}`;
  }

  // Método para manejar el input sin afectar el valor real
  public formatInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const rawValue = inputElement.value.replace(/[^0-9]/g, '');
    this.newTotal = Number(rawValue);
  }
}
