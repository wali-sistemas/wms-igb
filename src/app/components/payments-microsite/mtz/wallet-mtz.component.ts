import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WalletInvoice } from '../../../models/wallet-invoice';
import { PaymentReceipt } from '../../../models/payment-receipt';
import { PaymentsMicrositeService } from '../../../services/payments-microsite.service';
import { ChangeDetectorRef } from '@angular/core';

declare var $: any;

@Component({
  templateUrl: './wallet-mtz.component.html',
  styleUrls: ['./wallet-mtz.component.css'],
  providers: [PaymentsMicrositeService]
})

export class WalletMTZComponent implements OnInit {
  public selectedCompany: string = 'VARROC';
  public cardCode: string = '';
  public noInvoicesMessage: string = '';
  public filterDetail: string = '';
  public paymentReference: string;
  public concatenatedInvoices: string = '';
  public fullReference: string = '';
  public keyIntegrity: string = '';
  public input: string = '';
  public walletInvoices: WalletInvoice[] = [];
  public selectedInvoices: WalletInvoice[] = [];
  public filteredInvoices: WalletInvoice[] = [];
  public selectedInvoice: WalletInvoice;
  public paymentsReceipts: PaymentReceipt[] = [];
  public holdInvoices: string[] = [];
  public paymentRequest: any = null;
  public countdownInterval: any;
  public totalToPay: number = 0;
  public newTotal: number = 0;
  public timeLeft: number = 600;
  public isButtonEnabled: boolean = false;
  public isLoading: boolean = false;
  public showAlert: boolean = false;
  public showPaymentConfirmation: boolean = false;
  public showEditModal: boolean = false;
  public showFAQModal = false;
  public isPayButtonDisabled: boolean = true;

  constructor(private _router: Router, private _paymentsMicrositeService: PaymentsMicrositeService, private _cdr: ChangeDetectorRef) { }

  ngOnInit() {

    const hashValue = window.location.hash.substring(1);
    if (hashValue) {
      const params = hashValue.split('-');
      this.cardCode = params[0];
      if (params.length > 1) {
        this.filterDetail = params[1];
      }

      this.getDetailsInvoice();
      const filterInput = document.querySelector('#filter');
      if (filterInput instanceof HTMLElement) {
        filterInput.click();
      }

      $('#cardCode').focus();
      this.selectedCompany = "VARROC";
    }
  }

  // Simular Click y enter
  public simulateClickOnFilter() {
    setTimeout(() => {
      const filterInput = document.querySelector('#filter') as HTMLElement;

      if (filterInput) {
        filterInput.focus();
        filterInput.click();
        filterInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
      } else {
        console.warn("No se encontró el input con ID 'filter'.");
      }
    }, 400);
  }

  // Contruir Ref P2P
  public loadP2PScript() {
    this.buildReference();
    this.buildIntegrity();
    this.buildPaymentRequest();
  }

  // Método para construir llave de integridad
  public buildIntegrity() {
    const KeyIntegrity = 'prod_integrity_dGmcUuwbu3jJEEICqnC2zR9K4B60eBhD'
    this.keyIntegrity = `${this.fullReference}${(this.totalToPay * 100).toString()}${'COP'}${KeyIntegrity}`;
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
    this.releaseInvoice();
    this.getHoldInvoices();
    this.isLoading = true;
    this._paymentsMicrositeService.getInvoicesDetail(this.cardCode, this.selectedCompany).subscribe(
      response => {
        this.walletInvoices = response;
        this.filteredInvoices = [...this.walletInvoices];
        if (this.walletInvoices.length > 0) {
          this.updateInvoicesStatus();
          this.startCountdown();
        } else {
          this.noInvoicesMessage = 'No se encontraron documentos relacionados';
        }
        this.isLoading = false;
        this.simulateClickOnFilter();
      },
      error => {
        console.error('Error al obtener la lista de facturas', error);
        this.isLoading = false;
      }
    );
    this.simulateClickOnFilter();
  }

  //Metodo para obtener las facturas retenidas por proceso de pago
  public getHoldInvoices() {
    this._paymentsMicrositeService.getHoldInvoices(this.cardCode, this.selectedCompany).subscribe(
      response => {
        this.holdInvoices = response.invoices; // Guardamos las facturas en hold
        this.updateInvoicesStatus(); // Llamamos a la función para actualizar el estado de la lista general
      },
      error => {
        console.error("Error al obtener facturas en hold:", error);
      }
    );
  }

  //Marcar facturas en hold
  public updateInvoicesStatus() {
    this.walletInvoices.forEach(invoice => {
      invoice.isHold = this.holdInvoices.includes(invoice.reference);
    });
  }

  // Liberar facturas en Hold
  public releaseInvoice() {
    this._paymentsMicrositeService.releaseInvoices(this.selectedCompany).subscribe(
      response => {
        if (response.code === 0) {
          this.updateInvoicesStatus();
        } else {
          console.warn("No se pudieron liberar las facturas:", response.message);
        }
      },
      error => { console.error("Error al obtener facturas en hold:", error); }
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

  //Abrir modal confirmacion de pago
  public showModal() {
    $('#paymentReceiptsModal').modal('show');
  }

  //Cerrar modal confirmacion de pago
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
    this.updateConcatenatedInvoices();
    this.isPayButtonDisabled = this.selectedInvoices.length === 0;
  }

  //Registrar facturas en Hold
  public prepareAndSendPaymentSession() {
    if (this.selectedInvoices.length === 0) {
      console.warn("No hay facturas seleccionadas.");
      return;
    }
    const invoiceReferences = this.selectedInvoices.map(inv => inv.reference).join(',');
    let payerDocument = this.selectedInvoices[0].document.split('-')[0];
    const paymentSession = {
      u_invoice_id: invoiceReferences,
      u_user_id: payerDocument,
      u_status: "Y"
    };
    // Enviar la solicitud al backend
    this._paymentsMicrositeService.sendPaymentSession(paymentSession, this.selectedCompany).subscribe(
      response => {
        console.info("Sesión de pago registrada correctamente:", response);
      },
      error => { console.error("Error al registrar la sesión de pago:", error); }
    );
  }

  //Construir cuerpo de envío hacia comercio
  public buildPaymentRequest() {
    if (this.selectedInvoices.length === 0) {
      this.paymentRequest = null;
      return;
    }
    const reference = this.concatenatedInvoices;
    const total = this.totalToPay;
    const firstInvoice = this.selectedInvoices[0];
    const cleanedDocument = firstInvoice.document.replace(/-\d+$/, '');
    this.paymentRequest = {
      payment: {
        reference: this.selectedCompany,
        description: this.fullReference,
        amount: {
          currency: "COP",
          total: total
        }
      },
      buyer: {
        documentType: firstInvoice.documentType,
        document: cleanedDocument,
        name: firstInvoice.name,
        surname: firstInvoice.surname,
        email: firstInvoice.email
      }
    };
    this.sendPaymentRequest();
  }

  //Enviar cuerpo hacia Backend
  public sendPaymentRequest() {
    this._paymentsMicrositeService.sendRequestPayment(this.paymentRequest, this.selectedCompany).subscribe(
      response => {
        $('#modal_transfer_process').modal('hide');
        if (response.code === 0 && response.content) {
          window.open(response.content, '_blank');
        } else {
          console.error('Error en la respuesta del servidor:', response);
          alert('Hubo un error al procesar el pago. Intente nuevamente.');
        }
      },
      error => {
        $('#modal_transfer_process').modal('hide');
        console.error('Error al enviar la petición al comercio', error);
        alert('Hubo un error al conectar con el servicio de pagos.');
      }
    );
    this.prepareAndSendPaymentSession()
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

  // Cierra el popover
  public closePopover() {
    this.selectedInvoice = null;
    this.showEditModal = false;
  }

  // Método para modificar el valor total
  public updateTotal() {
    if (this.selectedInvoice && this.newTotal > 0) {
      this.selectedInvoice.saldoDocumentoAdicional = Number(this.newTotal);
      this.closePopover();
    }
  }

  // Método para vaciar llave antes de construirla
  public prepareKey() {
    this.paymentReference = '';
    this.fullReference = '';
    this.keyIntegrity = '';
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

  // Método para formatear  valores del contador a minutos y segundos
  public formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes.toString();
    const formattedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds.toString();
    return `${formattedMinutes}:${formattedSeconds}`;
  }

  // Método para abrir el modal
  public openPaymentConfirmation() {
    this.showPaymentConfirmation = true;
  }

  // Método para confirmar el pago
  public confirmPayment() {
    this.showPaymentConfirmation = false;
    this.loadP2PScript();
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

  // Formatea el número a nivel visual con separadores de miles
  public get formattedNewTotal(): string {
    return this.newTotal.toLocaleString('es-CO');
  }

  // Método para manejar el input sin afectar el valor real
  public formatInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const rawValue = inputElement.value.replace(/[^0-9]/g, '');
    this.newTotal = Number(rawValue);
  }

  // Método paara reestablecer contador
  private clearCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  // Método para vaciar listas
  public clear() {
    this.selectedInvoices = [];
    this.totalToPay = 0;
    this.isPayButtonDisabled = true;
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
    this.isButtonEnabled = false;
    $('#cardCode').focus();
  }
}
