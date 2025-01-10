import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CalculatorInvoice } from '../../../models/calculator-invoices';
import { CalculateInvoiceService } from '../../../services/calculator-invoices.service';
import { UserService } from '../../../services/user.service';

declare var $: any;

@Component({
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.css'],
  providers: [CalculateInvoiceService, UserService]
})

export class CalculatorComponent {
  public walletInvoices: CalculatorInvoice[] = [];
  public customerInfo: Partial<CalculatorInvoice> = {};
  public selectedInvoices: CalculatorInvoice[] = [];
  public selectedCompany: string;
  public companyCode: string;
  public cardCode: string;
  public changeErrorMessage: string;
  public changeMessage: string;
  public isInputDisabled: boolean = false;
  public auxiliaryData: { percentage?: number; calculatedValue?: number }[] = [];

  constructor(private _walletService: CalculateInvoiceService, private _router: Router, private _userService: UserService) { }

  ngOnInit() {
    const identity = this._userService.getItentity();
    if (identity) {
      this.selectedCompany = identity.selectedCompany;
      this.companyCode = this.selectedCompany === 'IGB' ? '1' : this.selectedCompany === 'VARROC' ? '2' : null;
    }
  }

  public getDetailsInvoice() {
    $('#modal_transfer_process').modal({ backdrop: 'static', keyboard: false, show: true });
    this._walletService.getInvoicesDetail(this.cardCode, this.selectedCompany).subscribe(
      response => {
        $('#modal_transfer_process').modal('hide');
        this.changeErrorMessage = '';
        this.walletInvoices = response;
        if (this.walletInvoices.length > 0) {
          const { name, nit, address, phone, email } = this.walletInvoices[0];
          this.customerInfo = { name, nit, address, phone, email };
          this.isInputDisabled = true;
        } else {
          this.changeErrorMessage = "No se encontraron facturas para este nit"
        };
      },
      error => {
        $('#modal_transfer_process').modal('hide');
        this.changeErrorMessage = 'Ha ocurrido un error al obtener la lista de facturas'
        console.error('Error al obtener la lista de facturas', error);
      }
    );
  }

  public calculateValue(invoice: CalculatorInvoice) {
    const percentage = invoice.percentage || 0;
    invoice.calculatedValue = (percentage / 100) * invoice.subtotal;
  }

  public handleSelection(invoice: CalculatorInvoice) {
    const percentage = invoice.percentage || 0;
    invoice.calculatedValue = (percentage / 100) * invoice.subtotal;
    if (percentage > 0) {
      if (!this.selectedInvoices.find(selected => selected.id === invoice.id)) {
        this.selectedInvoices.push(invoice);
      }
    } else {
      this.selectedInvoices = this.selectedInvoices.filter(selected => selected.id !== invoice.id);
    }
  }

  public openSummaryModal() {
    $('#summaryModal').modal('show');
  }

  public buildInvoicePayload() {
    return this.selectedInvoices.map(invoice => {
      return {
        NombreCliente: String(invoice.name || ""),
        Nit: String(invoice.nit || ""),
        Telefono: String(invoice.phone || ""),
        Direccion: String(invoice.address || ""),
        Tipo: "Factura",
        NoDoc: String(invoice.id || ""),
        FDoc: String(invoice.createdAt || ""),
        FVen: String(invoice.expirationDate || ""),
        Dias: String(invoice.days || ""),
        Disc: String(invoice.percentage || ""),
        ValorDoc: (invoice.saldoDocumentoAdicional || 0).toLocaleString('en-US'),
        ValorPago: ((invoice.saldoDocumentoAdicional - (invoice.calculatedValue || 0)) || 0).toLocaleString('en-US'),
        ValorDesc: (invoice.calculatedValue || 0).toLocaleString('en-US'),
        companyName: this.companyCode
      };
    });
  }

  public sendSelectedInvoices() {
    const payload = this.buildInvoicePayload();
    console.log('Payload enviado al backend:', payload);
    this._walletService.sendInvoices(payload, this.selectedCompany).subscribe(
      response => {
        $('#summaryModal').modal('hide');
        this.changeMessage = 'Reporte generado Exitosamente'
        window.open(response.content, '_blank');
      },
      error => {
        $('#summaryModal').modal('hide');
        this.changeErrorMessage = 'Ocurrió un error al generar el reporte'
        console.error(error);
      }
    );
  }

  public clear() {
    this.cardCode = '';
    this.walletInvoices = [];
    this.customerInfo = {};
    this.selectedInvoices = [];
    this.changeErrorMessage = '';
    this.changeMessage = '';
    this.isInputDisabled = false;
  }
}
