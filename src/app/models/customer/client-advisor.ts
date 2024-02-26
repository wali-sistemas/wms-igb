export class Advisor {
  public id: string;
  public name: string;
  public region: string;
  public code: string;

  constructor(id: string, name: string, region: string, code: string) {
    this.id = id;
    this.name = name;
    this.region = region;
    this.code = code;
  }
}
