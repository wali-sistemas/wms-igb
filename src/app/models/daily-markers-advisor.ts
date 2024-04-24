export class DailyMarkers {
  public id: string;
  public name: string;
  public card: string;
  public quantity: string;

  constructor(id: string, name: string, card: string, quantity: string) {
    this.id = id;
    this.name = name;
    this.card = card;
    this.quantity = quantity;
  }
}
