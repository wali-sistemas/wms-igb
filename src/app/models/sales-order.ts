export class SalesOrder {
    public docEntry: number;
    public docNum: string;
    public series: string;
    public docDate: Date;
    public docTotal: number;
    public docTotalFC: number;
    public cardCode: string;
    public cardName: string;
    public assignedPickingEmployee: string;
    public confirmed: string;
    public items: number;
    public status: string;
    public lines: Array<SalesOrderLine>;
    public address: string;
    public transp: string;
    public docNumMDL: string;
    public whsName: string;
    public whsCode: string;
    public subTotal: number;
    public comments: string;
    public undEmpStand: number;
    public vlrDeclarStand: number;
    public qty: number;
    public porcFlet: number;
    public condPayment: number;
    public marca: string;
    public promotion: string;

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
