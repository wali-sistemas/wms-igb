import { PackingOrderItemBin } from './packing-order';
export class PackingOrdeBox{

    public boxId: number;
    public boxQuantity: number;
    public boxShowName: String;
    public packingOrderItemBin: Array<PackingOrderItemBin> = new Array<PackingOrderItemBin>();
    constructor() { }

}