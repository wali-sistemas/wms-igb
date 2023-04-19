import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
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
  public filter: string = '';
  public searchInvoice: string;
  public invoices: Array<Counted>;
  public filteredInvoices: Array<Counted>;
  public orderNumber: string = '';
  public changeInvoiceErrorMessage: string = null;
  public changeInvoiceMessage: string = null;
  public locations: Array<string>;
  public filteredLocations: Array<string>;
  public selectedValue: string;
  public location: string;
  public docNum: number;

  constructor(private _invoicesService: InvoiceService, private _router: Router) {
  }

  ngOnInit() {
    this.listCashInvoices();
    this.clear()
  }

  public listCashInvoices() {
    this._invoicesService.listCashInvoices().subscribe(
      response => {
        this.invoices = response.content;
        this.filteredInvoices = response.content;
        this.locations = this.invoices.map((item, i) => { return item.location })
        this.filteredLocations = Array.from(new Set(this.locations));
      }, error => {
        this.redirectIfSessionInvalid(error);
      }
    );
    this.clear();
  }

  private redirectIfSessionInvalid(error): void {
    if (error && error.status && error.status == 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

  public filterInvoices() {
    this.searchInvoice = this.filter;
    if (this.filter.length > 0) {
      this.filteredInvoices = new Array<Counted>();
      for (let i = 0; i < this.invoices.length; i++) {
        const inv = this.invoices[i];
        if (inv.docNum.toString().includes(this.searchInvoice)
          || inv.cardCode.toString().includes(this.searchInvoice)
          || inv.cardName.toLocaleLowerCase().includes(this.searchInvoice)
          || inv.location.toString().includes(this.searchInvoice)
        ) {
          this.filteredInvoices.push(inv);
        }
      }
    } else {
      this.filteredInvoices = this.invoices;
    }
  }

  public handleChecked(docNum: number) {
    $('#confirmedModal').modal('show');
    this.docNum = docNum;
  }

  public sendInvoice() {
    this._invoicesService.updateStatusCashInvoice(this.docNum, "Para Despachar").subscribe(
      response => {
        if (response.code == 0) {
          $('#modal_transfer_process').modal('hide');
          this.listCashInvoices();
          this.changeInvoiceMessage = response.content;
          $('#modal_transfer_process').modal('close');
        } else {
          $('#modal_transfer_process').modal('hide');
          this.changeInvoiceErrorMessage = response.content;
        }
      },
      error => {
        $('#modal_transfer_process').modal('hide');
        this.changeInvoiceErrorMessage = 'Ha ocurrido un error de conexion';
        this.redirectIfSessionInvalid(error);
        this.clear()
      }
    );
  }

  public onLocationSelect() {
    this.filteredInvoices = this.invoices.filter(invoices => invoices.location === this.location)
  }

  public getScrollTop() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }

  public clear() {
    this.filter = '';
    this.selectedValue = '';
    this.filteredLocations = new Array<string>();
    this.location = '';
    this.changeInvoiceMessage = '';
    $('#filter').focus();
    this.docNum = 0;
  }
}
