export class TicketTI {
    public idTicket: Number;
    public idTypeTicket: Number;
    public asunt: String;
    public typeTicket: String;
    public dateTicket: Date;
    public department: String;
    public empAdd: String;
    public empSet: String
    public urlAttached: String;
    public priority: String;
    public company: String;
    public status: String;
    public notes: Array<TicketTINotes>;
    public type: String;
    public dateEnd: Date;
    constructor() { }
}

export class TicketTINotes {
    public idTicket: Number;
    public dateNote: Date;
    public empNote: String;
    public note: String;
    constructor() { }
}