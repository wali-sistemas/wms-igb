export class UserWali {
  public oldUsername?: string;

  constructor(
    public username: string,
    public name: string,
    public surname: string,
    public email: string,
    public lastUpdate: Date,
    public password: string,
    public rol: string,
    public companyName: string,
    public memberOf: string,
    public status: string) { }
}
