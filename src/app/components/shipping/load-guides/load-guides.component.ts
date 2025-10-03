import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UploadGuideService } from '../../../services/upload-guideService';
import { GuideUpload } from '../../../models/trackingGuides/guide-upload';
import { UserService } from '../../../services/user.service';

declare var $: any;

type UploadSummary = {
  jobId?: number | string;
  rows_total?: number;
  rows_ok?: number;
  rows_error?: number;
  errors_url?: string;
};

@Component({
  templateUrl: './load-guides.component.html',
  styleUrls: ['./load-guides.component.css'],
  providers: [UploadGuideService, UserService]
})

export class LoadGuidesComponent implements OnInit {
  public file: File | null = null;
  public isCsv = false;
  public isXlsx = false;
  public dragOver = false;
  public errorMessage = '';
  public successMessage = '';
  public warningMessage = '';
  public uploading = false;
  public uploadProgress = 0;
  public summary: UploadSummary | null = null;
  public previewHeaders: string[] = [];
  public previewRows: string[][] = [];
  public maxSizeBytes = 10 * 1024 * 1024; // 10 MB
  public requiredHeaders: string[] = ['carrier', 'guide', 'status', 'shipped_at', 'delivered_at', 'city', 'invoice'];
  public identity: any;
  public selectedCompany: string;

  constructor(private _router: Router, private _uploadGuidesService: UploadGuideService, private _userService: UserService) { }

  ngOnInit() {
    this.identity = this._userService.getItentity();
    if (this.identity === null) {
      this._router.navigate(['/']);
    }
    this.selectedCompany = this.identity.selectedCompany;
  }

  private redirectIfSessionInvalid(error: any) {
    if (error && error.status && error.status == 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

  @HostListener('document:click')
  public resetInlineMessages() {
    this.errorMessage = '';
    this.successMessage = '';
    this.warningMessage = '';
  }

  public onDragOver(ev: DragEvent) {
    ev.preventDefault();
    this.dragOver = true;
  }
  public onDragLeave(ev: DragEvent) {
    ev.preventDefault();
    this.dragOver = false;
  }
  public onDrop(ev: DragEvent) {
    ev.preventDefault();
    this.dragOver = false;
    const dt: DataTransfer | null = (ev as any).dataTransfer || null;
    if (dt && dt.files && dt.files.length > 0) {
      this.handleFile(dt.files[0]);
    }
  }

  public onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (input && input.files && input.files.length > 0) {
      const file: File = input.files[0];
      if (file) this.handleFile(file);
    }
  }

  private handleFile(file: File) {
    this.clearFeedback();
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    this.isCsv = ext === 'csv';
    this.isXlsx = ext === 'xlsx' || ext === 'xls';

    if (!this.isCsv && !this.isXlsx) {
      this.errorMessage = 'Formato no admitido. Sube un CSV o Excel (.csv, .xlsx, .xls).';
      this.file = null;
      return;
    }
    if (file.size > this.maxSizeBytes) {
      this.errorMessage = 'El archivo supera 10 MB.';
      this.file = null;
      return;
    }

    this.file = file;
    if (this.isCsv) {
      this.generateCsvPreview(file);
    } else {
      this.previewHeaders = [];
      this.previewRows = [];
      this.warningMessage = 'Soporte para Excel no implementado en la vista previa. Usa CSV por ahora.';
    }
  }

  private detectDelimiter(headerLine: string): string {
    const commas = (headerLine.match(/,/g) || []).length;
    const semis = (headerLine.match(/;/g) || []).length;
    if (semis > commas) return ';';
    return ','; // default
  }

  private splitCsvLine(line: string, delimiter: string) {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        out.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map(c => {
      let v = c.trim();
      if (v.startsWith('"') && v.endsWith('"')) {
        v = v.substring(1, v.length - 1);
      }
      return v;
    });
  }

  private stripBOM(s: string) {
    return s.replace(/^\uFEFF/, '');
  }

  private generateCsvPreview(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const txtRaw = (reader.result as string) || '';
        const txt = this.stripBOM(txtRaw);
        const lines: string[] = txt.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length === 0) return;
        const delimiter = this.detectDelimiter(lines[0]);
        const headersRaw = this.splitCsvLine(lines[0], delimiter);
        if (headersRaw.length > 0) headersRaw[0] = this.stripBOM(headersRaw[0]);
        this.previewHeaders = headersRaw;
        const body: string[][] = lines.slice(1, 1 + 20).map(l => this.splitCsvLine(l, delimiter));
        this.previewRows = body;
        const headersLower = headersRaw.map(h => h.trim().toLowerCase());
        const missing: string[] = [];
        for (let i = 0; i < this.requiredHeaders.length; i++) {
          if (headersLower.indexOf(this.requiredHeaders[i]) === -1) {
            missing.push(this.requiredHeaders[i]);
          }
        }
        if (missing.length > 0) {
          const esMap: Record<string, string> = {
            carrier: 'Transportadora',
            guide: 'Guía',
            status: 'Estado',
            shipped_at: 'Fecha Despacho',
            delivered_at: 'Fecha Entrega',
            city: 'Ciudad',
            invoice: 'Factura'
          };
          const faltantesEs = missing.map(k => esMap[k] || k);
          this.warningMessage = 'Faltan cabeceras obligatorias: ' + faltantesEs.join(', ');
        }
      } catch (_e) {
        this.errorMessage = 'No fue posible leer el CSV para previsualización.';
      }
    };
    reader.onerror = () => { this.errorMessage = 'Error leyendo el archivo.'; };
    reader.readAsText(file, 'utf-8');
  }

  private buildGuidesFromCsv(headersLower: string[], rows: string[][]): { guides: GuideUpload[]; errors: string[] } {
    const idx: Record<string, number> = {};
    headersLower.forEach((h, i) => { idx[h.trim().toLowerCase()] = i; });
    const required = ['invoice', 'guide', 'status'];
    const missingReq = required.filter(k => idx[k] == null);
    if (missingReq.length) {
      return { guides: [], errors: [`Faltan columnas requeridas: ${missingReq.join(', ')}`] };
    }

    const toIso = (s?: string): string | null => {
      if (!s) return null;
      const t = s.trim();
      if (!t) return null;

      const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
      if (isoMatch) {
        return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
      }

      const slashMatch = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(t);
      if (slashMatch) {
        const day = slashMatch[1];
        const month = slashMatch[2];
        const year = slashMatch[3];
        return `${year}-${month}-${day}`;
      }

      const dashDMY = /^(\d{2})-(\d{2})-(\d{4})/.exec(t);
      if (dashDMY) {
        const day = dashDMY[1];
        const month = dashDMY[2];
        const year = dashDMY[3];
        return `${year}-${month}-${day}`;
      }

      return null;
    };

    const guides: GuideUpload[] = [];
    const errors: string[] = [];

    rows.forEach((r, ri) => {
      if (!r || r.length === 0) return;

      const get = (k: string): string => {
        const i = idx[k];
        return (i == null || r[i] == null) ? '' : String(r[i]).trim();
      };

      const carrier = get('carrier');
      const guide = get('guide');
      const status = get('status');
      const shipped_at = get('shipped_at');
      const delivered_at = get('delivered_at');
      const city = get('city');
      const invoice = get('invoice');

      if (!invoice || !guide || !status) {
        errors.push(`Fila ${ri + 2}: faltan requeridos (invoice/guide/status).`);
        return;
      }

      const dto = new GuideUpload(
        invoice,
        guide,
        status.toUpperCase(),
        carrier ? carrier.toUpperCase() : null,
        toIso(shipped_at),
        toIso(delivered_at),
        city ? city.toUpperCase() : null
      );

      guides.push(dto);
    });

    return { guides, errors };
  }

  public upload() {
    if (!this.file) {
      this.errorMessage = 'Adjunta un archivo primero.';
      return;
    }
    this.clearFeedback();
    this.uploading = true;
    this.uploadProgress = 10;
    this.summary = null;

    $('#modal_transfer_process').modal({ backdrop: 'static', keyboard: false, show: true });

    if (this.isCsv) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const raw = (reader.result as string) || '';
          const text = this.stripBOM(raw);
          const lines: string[] = text.split(/\r?\n/).filter(l => l.trim().length > 0);
          if (!lines.length) throw new Error('Archivo CSV vacío.');
          const delimiter = this.detectDelimiter(lines[0]);
          const headerArr = this.splitCsvLine(lines[0], delimiter);
          if (headerArr.length > 0) headerArr[0] = this.stripBOM(headerArr[0]);
          const headersLower: string[] = headerArr.map(h => h.trim().toLowerCase());
          const rows: string[][] = lines.slice(1).map(l => this.splitCsvLine(l, delimiter));
          const { guides, errors } = this.buildGuidesFromCsv(headersLower, rows);
          if (errors.length) {
            this.uploading = false;
            this.uploadProgress = 0;
            $('#modal_transfer_process').modal('hide');
            this.errorMessage = errors.join(' | ');
            return;
          }
          this.sendGuidesToBackend(guides);
        } catch (e) {
          this.uploading = false;
          this.uploadProgress = 0;
          $('#modal_transfer_process').modal('hide');
          const msg = e && (e as any).message ? (e as any).message : 'No fue posible procesar el CSV.';
          this.errorMessage = msg;
        }
      };
      reader.readAsText(this.file, 'utf-8');
    } else {
      this.uploading = false;
      $('#modal_transfer_process').modal('hide');
      this.errorMessage = 'Soporte para Excel no implementado. Sube un CSV por ahora.';
    }
  }

  private sendGuidesToBackend(guides: GuideUpload[]) {
    const company = this.selectedCompany;
    this.uploadProgress = 40;
    this._uploadGuidesService.uploadGuides(guides, company).subscribe(
      response => {
        this.uploadProgress = 90;
        if (response.code === 0) {
          this.successMessage = response.content || 'Guías insertadas correctamente';
          this.summary = {
            rows_total: guides.length,
            rows_ok: guides.length,
            rows_error: 0
          };
        } else {
          this.errorMessage = response.content || 'No fue posible procesar el archivo.';
        }
      },
      error => {
        console.error('Error al enviar guías:', error);
        this.errorMessage = 'Ocurrió un error al enviar los datos.';
        this.redirectIfSessionInvalid(error);
        this.uploadProgress = 100;
        this.uploading = false;
        $('#modal_transfer_process').modal('hide');
      }
    );
  }

  public clearAll() {
    this.file = null;
    this.isCsv = false;
    this.isXlsx = false;
    this.uploading = false;
    this.uploadProgress = 0;
    this.summary = null;
    this.previewHeaders = [];
    this.previewRows = [];
    this.clearFeedback();
    const el = document.getElementById('fileInput') as HTMLInputElement;
    if (el) { el.value = ''; }
  }

  private clearFeedback() {
    this.errorMessage = '';
    this.successMessage = '';
    this.warningMessage = '';
  }

  public downloadTemplate() {
    const headers = this.requiredHeaders.join(',');
    const sample = [
      // carrier,guide,status,shipped_at,delivered_at,city,invoice
      'COORDINADORA,TRK-123456,IN_TRANSIT,2025-09-10 14:30,,"MEDELLÍN",10001',
      'EXXE,TRK-556677,DELIVERED,2025-09-11 09:10,2025-09-12 16:45,"BOGOTÁ",10002',
      'TCC,TRK-778899,PICKED,2025-09-12 08:20,,"CALI",10003'
    ].join('\n');
    const csv = headers + '\n' + sample + '\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_carga_guias.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
