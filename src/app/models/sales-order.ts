export class SalesOrder {
    public docEntry: Number;
    public docNum: String;
    public series: String;
    public docDate: Date;
    public docTotal: Number;
    public docTotalFC: Number;
    public cardCode: String;
    public cardName: String;
    public assignedPickingEmployee: String;
    public confirmed: String;
    public items: Number;
    public lines: Array<SalesOrderLine>;
    constructor() { }
}

export class SalesOrderLine {
    public partial: boolean = false;
    public docNum: String;
    public itemCode: String;
    public itemName: String;
    public quantity: number;
    public lineNum: number;

    constructor() { }
}