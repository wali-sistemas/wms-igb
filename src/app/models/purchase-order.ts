import { PurchaseOrderLine } from './purchase-order-line';

export class PurchaseOrder {
  constructor(
    public docEntry: Number,
    public docNum: String,
    public series: String,
    public docDate: Date,
    public docTotal: Number,
    public docTotalFC: Number,
    public cardCode: String,
    public cardName: String,
    public items: Number,
    public lines: Array<PurchaseOrderLine>
  ) { }
}
