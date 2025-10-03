import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PublicTrackingService } from '../../services/public-tracking.service';
import { PublicInvoiceRow } from '../../models/trackingGuides/public-Invoice-row';
import { UserService } from '../../services/user.service';

type TrackingRecord = {
  carrier: string;
  guide: string;
  status: string;
  shipped_at: string;
  delivered_at?: string;
  city: string;
  invoice: string;
  events?: Array<{ at: string; title: string; description: string }>;
};

type InvoiceRow = PublicInvoiceRow;

@Component({
  templateUrl: './tracking-guides.component.html',
  styleUrls: ['./tracking-guides.component.css'],
  providers: [PublicTrackingService, UserService]
})

export class TrackingGuidesComponent implements OnInit {
  public phase: 'lookup' | 'list' | 'detail' = 'lookup';
  public identity: any;
  public selectedCompany: string;
  public isPublic = true;
  public idNumber: string = '';
  public loading: boolean = false;
  public errorMessage: string = '';
  public warningMessage: string = '';
  public invoices: InvoiceRow[] = [];
  public record: TrackingRecord | null = null;
  public stepsOrder: string[] = ['DESPACHADA', 'EN REPARTO', 'ENTREGADO', 'NOVEDAD', 'DEVOLUCION'];
  public whatsAppUrl = 'https://wa.me/573104197063';

  constructor(private _router: Router, private _publicTrackingService: PublicTrackingService, private _userService: UserService) { }

  ngOnInit() {
    this.identity = this._userService.getItentity();
    this.isPublic = !this.identity;
    if (this.identity && this.identity.selectedCompany) {
      this.selectedCompany = this.identity.selectedCompany;
    } else {
      this.selectedCompany = 'IGB';
    }
  }

  @HostListener('document:click')
  public resetInlineMessages() {
    this.errorMessage = '';
    this.warningMessage = '';
  }

  private cleanQuotes(v: string): string {
    if (!v) return v as any;
    return v.replace(/^"+|"+$/g, '');
  }

  private normalizeStatus(stRaw: string): string {
    const s = (stRaw || '').toUpperCase().trim();
    if (s === 'DESPACHADA' || s === 'EN REPARTO' || s === 'ENTREGADO' || s === 'NOVEDAD' || s === 'DEVOLUCION') {
      return s;
    }
    if (s === 'OUT_FOR_DELIVERY') return 'EN REPARTO';
    if (s === 'DELIVERED') return 'ENTREGADO';
    if (s === 'CREATED' || s === 'PICKED' || s === 'IN_TRANSIT') return 'DESPACHADA';
    return 'DESPACHADA';
  }

  public statusLabelEs(st: string) {
    const n = this.normalizeStatus(st);
    switch (n) {
      case 'DESPACHADA': return 'Despachada';
      case 'EN REPARTO': return 'En reparto';
      case 'ENTREGADO': return 'Entregado';
      case 'NOVEDAD': return 'Novedad';
      case 'DEVOLUCION': return 'Devolución';
      default: return 'Despachada';
    }
  }

  public statusBadgeClass(st: string) {
    const n = this.normalizeStatus(st);
    switch (n) {
      case 'ENTREGADO': return 'badge status-ENTREGADO';
      case 'EN REPARTO': return 'badge status-ENREPARTO';
      case 'DESPACHADA': return 'badge status-DESPACHADA';
      case 'NOVEDAD': return 'badge status-NOVEDAD';
      case 'DEVOLUCION': return 'badge status-DEVOLUCION';
      default: return 'badge status-DESPACHADA';
    }
  }

  public showWhatsApp(st?: string) {
    const n = this.normalizeStatus(st || '');
    return n === 'NOVEDAD' || n === 'DEVOLUCION';
  }

  public searchByDocument() {
    const typed = (this.idNumber || '').trim();
    if (!typed) {
      this.warningMessage = 'Ingresa tu número de documento.';
      return;
    }
    const cardCode = typed.toUpperCase().startsWith('C') ? typed.toUpperCase() : ('C' + typed);

    this.loading = true;
    this.errorMessage = '';
    this.warningMessage = '';
    this.invoices = [];
    this.record = null;

    this._publicTrackingService.getClientInvoices(this.selectedCompany, cardCode).subscribe(
      response => {
        this.loading = false;
        if (response && response.code === 0) {
          const list = (response.content || []).map((it) => {
            const anyIt: any = it || {};
            if (anyIt.city) anyIt.city = this.cleanQuotes(anyIt.city);
            if (anyIt.status) anyIt.status = this.normalizeStatus(anyIt.status);
            return anyIt as InvoiceRow;
          });
          this.invoices = list;
          if (this.invoices.length > 0) {
            this.phase = 'list';
          } else {
            this.warningMessage = 'No se encontraron facturas en los últimos 45 días.';
            this.phase = 'lookup';
          }
        } else {
          this.errorMessage = 'No fue posible obtener las facturas.';
          this.phase = 'lookup';
        }
      },
      error => {
        this.loading = false;
        this.errorMessage = 'Error consultando las facturas.';
        this.phase = 'lookup';
        console.error(error);
      }
    );
  }

  public invoiceHasGuide(inv: InvoiceRow) {
    const anyInv: any = inv || {};
    return !!anyInv.guide || !!anyInv.has_guide || !!anyInv.status;
  }

  public invoiceStatusLabel(inv: InvoiceRow) {
    if (!this.invoiceHasGuide(inv)) return 'Sin guía';
    const anyInv: any = inv || {};
    const st = anyInv.status || 'DESPACHADA';
    return this.statusLabelEs(st);
  }

  public invoiceStatusBadge(inv: InvoiceRow) {
    if (!this.invoiceHasGuide(inv)) return 'badge status-NOGUIA';
    const anyInv: any = inv || {};
    const st = anyInv.status || 'DESPACHADA';
    return this.statusBadgeClass(st);
  }

  public openTracking(inv: InvoiceRow) {
    if (!this.invoiceHasGuide(inv)) return;

    this.loading = true;
    this.errorMessage = '';
    this.warningMessage = '';
    this.record = null;
    this.phase = 'detail';

    const anyInv: any = inv || {};
    this._publicTrackingService.getLatestTrackingByInvoice(this.selectedCompany, anyInv.invoice).subscribe(
      response => {
        this.loading = false;
        if (response && response.code === 0) {
          if (response.content) {
            const t: any = response.content;
            const normalizedStatus = this.normalizeStatus(t.status);
            const r: TrackingRecord = {
              carrier: t.carrier,
              guide: t.guide,
              status: normalizedStatus,
              shipped_at: t.shipped_at,
              delivered_at: t.delivered_at,
              city: this.cleanQuotes(t.city),
              invoice: t.invoice,
              events: this.buildSummaryEvents(normalizedStatus, t.shipped_at, t.delivered_at)
            };
            this.record = r;
          } else {
            this.record = null;
            this.warningMessage = 'Esta factura aún no tiene guía/tracking registrado.';
            this.phase = 'list';
          }
        } else {
          this.errorMessage = 'No fue posible obtener el tracking.';
          this.phase = 'list';
        }
      },
      error => {
        this.loading = false;
        this.errorMessage = 'Error consultando el tracking.';
        this.phase = 'list';
        console.error(error);
      }
    );
  }

  private buildSummaryEvents(status: string, shippedAt?: string, deliveredAt?: string) {
    const n = this.normalizeStatus(status);
    const evDesp = { at: shippedAt || '—', title: 'Despachada', description: 'Se creó la guía y se despachó el envío.' };
    const evRep = { at: shippedAt || '—', title: 'En reparto', description: 'Llegó al centro logístico y salió a reparto.' };
    const evEnt = { at: deliveredAt || '—', title: 'Entregado', description: 'El destinatario recibió el envío.' };
    if (n === 'DESPACHADA') return [evDesp];
    if (n === 'EN REPARTO') return [evDesp, evRep];
    return [evDesp, evRep, evEnt];
  }

  public currentStepIndex(): number {
    const st = this.record ? this.normalizeStatus(this.record.status) : 'DESPACHADA';
    if (st === 'DESPACHADA') return 0;
    if (st === 'EN REPARTO') return 1;
    return 2;
  }

  public progressPercent(): number {
    const idx = this.currentStepIndex();
    const max = 2;
    return Math.round((idx / max) * 100);
  }

  public connectorFill(prevIndex: number): boolean {
    return this.currentStepIndex() > prevIndex;
  }

  public stepClassFor(step: string): string {
    const s = this.record ? this.normalizeStatus(this.record.status) : 'DESPACHADA';
    if (step === 'DESPACHADA') {
      if (s === 'DESPACHADA') return 'step active-green';
      return 'step done-green';
    }
    if (step === 'EN REPARTO') {
      if (s === 'DESPACHADA') return 'step';
      if (s === 'EN REPARTO') return 'step active-green';
      return 'step done-green';
    }
    if (step === 'ENTREGADO') {
      if (s === 'ENTREGADO') return 'step active-green';
      if (s === 'NOVEDAD') return 'step active-red';
      if (s === 'DEVOLUCION') return 'step active-yellow';
      return 'step';
    }
    return 'step';
  }

  public backToList() {
    this.phase = 'list';
    this.record = null;
  }

  public backToLookup() {
    this.phase = 'lookup';
    this.invoices = [];
    this.record = null;
    this.idNumber = '';
  }
}
