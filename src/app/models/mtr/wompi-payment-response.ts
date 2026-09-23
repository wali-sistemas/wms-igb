export class WompiPaymentResponse {
  public code: number;
  public message: string;
  public reference: string;
  public publicKey: string;
  public currency: string;
  public amountInCents: number;
  public integritySignature: string;
  public environment: string;

  constructor() {
    this.code = 0;
    this.message = '';
    this.reference = '';
    this.publicKey = '';
    this.currency = 'COP';
    this.amountInCents = 0;
    this.integritySignature = '';
    this.environment = '';
  }
}
