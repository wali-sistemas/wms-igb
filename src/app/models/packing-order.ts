export class PackingOrder{

    public packingOrderId: number;
    public orderNumber: String;
    public cardCode: String;
    public cardName: String;
    public status: String;
    public itemsOrders: Array<PackingOrderItem>;
    constructor() { }

}

export class PackingOrderItem{

    public packingOrderItemId: number;
    public packingOrderId: number;
    public itemCode: String;
    public itemsBin: Array<PackingOrderItemBin>
    constructor() { }

}

export class PackingOrderItemBin {

    public packingOrderItemBinId: number;
    public pakingOrderItemId: number;
    public binCode: String;
    public binAbs: String;
    public pickedQty: number;
    public packedQty: number;
    constructor() { }
}