export class UserWali {
  public username?: string;
  public name?: string;
  public surname?: string;
  public email?: string;
  public lastUpdate?: Date;
  public password?: string;
  public rol?: string;
  public companyName?: string;
  public memberOf?: string;
  public status?: string;

  constructor(username: string, name: string, surname: string, email: string, lastUpdate: Date, password: string, rol: string, companyName: string, memberOf: string, status: string) {
    this.username = username;
    this.name = name;
    this.surname = surname;
    this.email = email;
    this.lastUpdate = lastUpdate;
    this.password = password;
    this.rol = rol;
    this.companyName = companyName;
    this.memberOf = memberOf;
    this.status = status;
  }
}
