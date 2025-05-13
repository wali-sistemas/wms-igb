import { Headers } from '@angular/http';

export let GLOBAL = {
  //HTTP
  /*url: 'http://192.168.10.69:8080/igb/res/',
  urlShared: 'http://192.168.10.69:8080/shared/',
  urlManager: 'http://192.168.10.69:8080/manager/res/',
  urlSpring: 'http://192.168.10.69:8080/apiRest/wali/'*/
  //HTTPS
  url: 'https://wali.igbcolombia.com/api/igb/res/',
  urlShared: 'https://wali.igbcolombia.com/api/shared/',
  urlManager: 'https://wali.igbcolombia.com/api/manager/res/',
  urlSpring: 'https://wali.igbcolombia.com/api/apiRest/wali/'
};

export let AIGlobal = {
  url: 'https://api.openai.com/v1/',
  apiKey: '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'
}

export class IGBHeaders {
  public loadHeaders() {
    const ident = localStorage.getItem('igb.identity');
    if (ident) {
      return new Headers({
        'Content-Type': 'application/json',
        'X-Company-Name': localStorage.getItem('igb.selectedCompany'),
        'X-Warehouse-Code': JSON.parse(ident).warehouseCode,
        'Authorization': JSON.parse(ident).token,
        'X-Employee': JSON.parse(ident).username,
        'X-Pruebas': localStorage.getItem('igb.pruebas')
      });
    } else {
      return new Headers({
        'Content-Type': 'application/json',
        'X-Company-Name': localStorage.getItem('igb.selectedCompany')
      });
    }
  }
};

export let CONTENT_TYPE_JSON = new Headers({
  'Content-Type': 'application/json'
});
