import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { InvoiceService } from '../../../services/invoice.service';
import { Counted } from '../../../models/counted';

declare var $: any;

@Component({
  templateUrl: './approve.component.html',
  styleUrls: ['./approve.component.css'],
  providers: [InvoiceService]
})

export class ApproveComponent {
  public idChecked: boolean = false;
  public alertVisible: boolean = false;
  public invoices: Array<Counted>;
  public filter: string = '';
  public searchInvoice: string;
  public filteredInvoices: Array<Counted>;
  public orderNumber: string = '';
  public changeInvoiceErrorMessage: string = null;
  public changeInvoiceMessage: string = null;

  constructor(private _invoicesService: InvoiceService, private _router: Router) {
  }

  ngOnInit() {
    this.listCashInvoices();
  }

  public showAlert() {
    this.alertVisible = true;
  }

  public listCashInvoices() {
    this._invoicesService.listCashInvoices().subscribe(
      response => {
        this.invoices = response.content;
        this.filteredInvoices = response.content;
      }, error => {
        console.error(error);
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  private redirectIfSessionInvalid(error) {
    if (error && error.status && error.status == 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

  public filterInvoices(force) {
    this.searchInvoice = this.filter;
    if (this.filter.length > 0) {
      this.filteredInvoices = new Array<Counted>();
      for (let i = 0; i < this.invoices.length; i++) {
        const inv = this.invoices[i];
        if (inv.docNum.toString().includes(this.searchInvoice)) {
          this.filteredInvoices.push(inv);
        }
      }
    } else {
      this.filteredInvoices = this.invoices;
    }
  }

  public handleChecked(data) {
    this.changeInvoiceErrorMessage = '';
    $('#modal_transfer_process').modal({
      backdrop: 'static',
      Keyboard: false,
      show: true
    });
    this._invoicesService.updateStatusCashInvoice(data, "Para Despachar").subscribe(
      response => {
        if (response.code == 0) {
          $('#modal_transfer_process').modal('hide');
          this.listCashInvoices();
          this.changeInvoiceMessage = response.content;
        } else {
          $('#modal_transfer_process').modal('hide');
          this.changeInvoiceErrorMessage = response.content;
        }
      },
      error => {
        console.error(error);
        $('#modal_transfer_process').modal('hide');
        this.changeInvoiceErrorMessage = 'Ha ocurrido un error de conexion';
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public getScrollTop() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }

  public clear() {
    this.filter = '';
    $('#invoice').focus();
  }
}
