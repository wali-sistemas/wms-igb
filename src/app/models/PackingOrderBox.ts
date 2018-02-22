import { PackingOrderItemBin } from './packing-order';
export class PackingOrderBox {

    public boxId: number = 0;
    public boxQuantity: number = 0;
    public boxShowName: String = "";
    public orderBox: String = "";
    public itemBinAbs: number = 0;
    constructor() { }

    public addQuantity(qty) {
        this.boxQuantity += parseInt(qty);
    }
}