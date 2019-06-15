export class PackingCheckOut {
    constructor(
        public orderNumber: number,
        public deliveryNumber: number,
        public itemCode: string,
        public qtyOrder: number,
        public qtyScan: number,
        public status: string,
        public empId: string,
        public datetimeCheckout: Date,
        public boxNumber: number,
        public companyName: string
    ) { }
}