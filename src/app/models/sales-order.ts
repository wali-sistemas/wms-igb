export class SalesOrder {
  public docEntry: number = 0;
  public docNum: string = '';
  public series: string = '';
  public docDate: Date = new Date();
  public docTotal: number = 0;
  public docTotalFC: number = 0;
  public cardCode: string = '';
  public cardName: string = '';
  public assignedPickingEmployee: string = '';
  public confirmed: string = '';
  public items: number = 0;
  public status: string = '';
  public lines: Array<SalesOrderLine> = [];
  public address: string = '';
  public transp: string = '';
  public docNumMDL: string = '';
  public whsName: string = '';
  public whsCode: string = '';
  public subTotal: number = 0;
  public comments: string = '';
  public undEmpStand: number = 0;
  public vlrDeclarStand: number = 0;
  public qty: number = 0;
  public porcFlet: number = 0;
  public condPayment: number = 0;
  public marca: string = '';
  public promotion: string = '';
  public groupCardCode?: string;

  constructor() { }
}

export class SalesOrderLine {
  public partial: boolean = false;
  public docNum: String = '';
  public itemCode: String = '';
  public itemName: String = '';
  public quantity: number = 0;
  public lineNum: number = 0;

  constructor() { }
}
