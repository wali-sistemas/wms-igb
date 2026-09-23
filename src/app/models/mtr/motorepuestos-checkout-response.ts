import { MotorepuestosCheckoutItem } from './motorepuestos-checkout-item';

export class MotorepuestosCheckoutResponse {
  public code: number;
  public message: string;
  public checkoutCode: string;
  public document: string;
  public cardCode: string;
  public customerName: string;
  public city: string;
  public address: string;
  public subtotal: number;
  public iva: number;
  public freight: number;
  public total: number;
  public status: string;
  public payStatus: string;
  public items: MotorepuestosCheckoutItem[];

  constructor() {
    this.code = 0;
    this.message = '';
    this.checkoutCode = '';
    this.document = '';
    this.cardCode = '';
    this.customerName = '';
    this.city = '';
    this.address = '';
    this.subtotal = 0;
    this.iva = 0;
    this.freight = 0;
    this.total = 0;
    this.status = '';
    this.payStatus = '';
    this.items = [];
  }
}
