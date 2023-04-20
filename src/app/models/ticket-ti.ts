export class TicketTI {
    public idTicket: number;
    public idTypeTicket: number;
    public asunt: string;
    public typeTicket: string;
    public dateTicket: Date;
    public department: string;
    public empAdd: string;
    public empSet: string
    public urlAttached: string;
    public priority: string;
    public company: string;
    public status: string;
    public notes: Array<TicketTINotes>;
    public type: string;
    public dateEnd: Date;
    constructor() { }
}

export class TicketTINotes {
    public idTicket: number;
    public dateNote: Date;
    public empNote: string;
    public note: string;
    constructor() { }
}
