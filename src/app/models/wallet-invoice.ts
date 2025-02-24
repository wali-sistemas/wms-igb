export class WalletInvoice {
    id: number;
    status: string;
    document: string;
    name: string;
    surname: string;
    documentType: string;
    email: string;
    reference: string;
    description: string;
    createdAt: string;
    expirationDate: string;
    valueAddedTax: number;
    subtotal: number;
    total: number;
    saldoDocumentoAdicional: number;
    currency: string;
    urlDoc: string;
    isHold?: boolean;

    constructor() {}
  }
