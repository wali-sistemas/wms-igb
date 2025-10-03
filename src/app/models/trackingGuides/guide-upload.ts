export class GuideUpload {
  public U_factura: string;
  public U_transportadora: string;
  public U_guia: string;
  public U_estado: string;
  public U_fecha_despacho: string;
  public U_fecha_entrega: string;
  public U_ciudad: string;

  constructor(U_factura: string, U_guia: string, U_estado: string, U_transportadora?: string, U_fecha_despacho?: string, U_fecha_entrega?: string, U_ciudad?: string) {
    this.U_factura = U_factura;
    this.U_guia = U_guia;
    this.U_estado = U_estado;
    this.U_transportadora = U_transportadora || null;
    this.U_fecha_despacho = U_fecha_despacho || null;
    this.U_fecha_entrega = U_fecha_entrega || null;
    this.U_ciudad = U_ciudad || null;
  }
}
