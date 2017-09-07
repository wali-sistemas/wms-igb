export class PurchaseOrderLine {
  public partial: boolean = false;
  constructor(
    public docNum: String,
    public itemCode: String,
    public itemName: String,
    public quantity: number,
    public lineNum: number
  ) { }
}
