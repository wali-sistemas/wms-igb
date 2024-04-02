export class Advisor {
  public id: string;
  public name: string;
  public code: string;
  public zone: string;
  public region: string;

  constructor(id: string, name: string, code: string, zone: string, region: string) {
    this.id = id;
    this.name = name;
    this.code = code;
    this.zone = zone;
    this.region = region;
  }
}
