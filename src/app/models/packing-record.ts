export class PackingRecord {
    public idPackingList: number;
    public idPackingOrder: number;
    public orderNumber: number;
    public customerId: string;
    public customerName: string;
    public pickingOrder: number;
    public itemCode: string;
    public quantity: number;
    public binAbs: number;
    public binCode: string;
    public boxNumber: number;
    public employee: string;
    public status: string;
    
    constructor() { }
}
