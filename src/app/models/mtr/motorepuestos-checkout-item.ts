export class MotorepuestosCheckoutItem {
  public lineNum: number;
  public itemCode: string;
  public description: string;
  public quantity: number;
  public price: number;
  public subtotal: number;
  public iva: number;
  public total: number;

  constructor() {
    this.lineNum = 0;
    this.itemCode = '';
    this.description = '';
    this.quantity = 0;
    this.price = 0;
    this.subtotal = 0;
    this.iva = 0;
    this.total = 0;
  }
}
