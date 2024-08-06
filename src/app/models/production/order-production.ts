export class OrderProduction {
  public cardCode: string;
  public cardName: string;
  public docNum: number;
  public state: string;
  public docTotal: string;
  public date: Date;
  public countArticles: number;
  public sumArticles: number;
  public address: string;
  public city: string;
  public block: string;

  constructor(cardCode: string, cardName: string, docNum: number, state: string, docTotal: string, date: Date, countArticles: number, sumArticles: number, address: string, city: string, block: string) {
    this.cardCode = cardCode;
    this.cardName = cardName;
    this.docNum = docNum;
    this.state = state;
    this.docTotal = docTotal;
    this.date = date;
    this.countArticles = countArticles;
    this.sumArticles = sumArticles;
    this.address = address;
    this.city = city;
    this.block = block;
  }
}
