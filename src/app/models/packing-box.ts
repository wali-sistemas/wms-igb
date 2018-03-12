
export class PackingBox {

    public boxId: number = 0;
    public boxQuantity: number = 0;
    public boxNumber: number = 0;
    public boxDisplayName: String = "";
    public orderBox: String = "";
    public itemBinAbs: number = 0;
    constructor() { }

    public addQuantity(qty) {
        this.boxQuantity += parseInt(qty);
    }
}