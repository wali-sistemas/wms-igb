
export class PackingBox {

    public boxId: number = 0;
    public boxQuantity: number = 0;
    public boxNumber: number = 0;
    public boxDisplayName: String = "";
    public orderBox: String = "";
    public itemBinAbs: number = 0;
    public items: Map<string, number>;
    constructor() {
        this.items = new Map<string, number>();
    }

    public addItem(itemCode: string, qty: number) {
        if (this.items.has(itemCode.trim())) {
            this.items.set(itemCode.trim(), this.items.get(itemCode.trim()) + qty);
        } else {
            this.items.set(itemCode.trim(), qty);
        }
        this.boxQuantity += qty;
    }
}