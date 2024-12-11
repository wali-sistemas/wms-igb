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

export class WalletRedplas implements OnInit {
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
  public totalToPay: number = 0;
  public newTotal: number = 0;
  public timeLeft: number = 600;
  public isButtonEnabled: boolean = false;
  public isLoading: boolean = false;
  public isWompiFormVisible: boolean = false;
  public showAlert: boolean = false;
  public countdownInterval: any;

  constructor(private _router: Router, private _paymentsMicrositeService: PaymentsMicrositeService, private _userService: UserService, private _cdr: ChangeDetectorRef) { }

  ngOnInit() {
    $('#cardCode').focus();
  }

  public loadWompiScript() {
    this.isWompiFormVisible = true;
    this.buildReference();
    this.buildIntegrity();

    const script = document.createElement('script');
    script.src = "https://checkout.wompi.co/widget.js";
    script.setAttribute("data-render", "button");
    script.setAttribute("data-public-key", "pub_prod_xsTrvZjX3GMmcdBJFC1PFBCwJ9HXzhuy");
    script.setAttribute("data-currency", "COP");
    script.setAttribute("data-amount-in-cents", (this.totalToPay * 100).toString());
    script.setAttribute("data-reference", this.fullReference);
    //script.setAttribute("data-reference", "date20241106-154202-631745_55085100-id1001618260");
    script.setAttribute("data-signature:integrity", this.input);
    script.setAttribute("data-redirect-url", "https://redplas.co/");
    script.setAttribute("data-customer-data:email", "contabilidad@redplas.co");
    // Añadir el script al formulario
    const wompiForm = document.getElementById('wompiForm');
    wompiForm.appendChild(script);
    script.onload = () => {
      const wompiButton = wompiForm.querySelector('button');
      if (wompiButton) {
        wompiButton.style.display = 'none';
        wompiButton.click();
      }
    };
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

  public showModal(): void {
    $('#paymentReceiptsModal').modal('show');
  }
  public closeModal(): void {
    $('#paymentReceiptsModal').modal('hide');
  }

  // Método para filtrar las facturas
  public filterOrdersDetail(): void {
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
    if (this.selectedInvoice === invoice) {
      this.selectedInvoice = null;
    } else {
      this.selectedInvoice = invoice;
      this.newTotal = Number(invoice.saldoDocumentoAdicional);
    }
  }

  // Cierra el popover
  public closePopover(): void {
    this.selectedInvoice = null;
  }

  // Método para modificar el valor total
  public updateTotal() {
    if (this.selectedInvoice && this.newTotal > 0) {
      this.selectedInvoice.saldoDocumentoAdicional = Number(this.newTotal);
      this.closePopover();
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

  // Método para formatear  valores del contador a minutos y segundos
  public formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes.toString();
    const formattedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds.toString();
    return `${formattedMinutes}:${formattedSeconds}`;
  }
}
