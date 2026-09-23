import { Headers } from '@angular/http';

export let GLOBAL = {
  //HTTPS
  url: 'https://wali.igbcolombia.com/api/igb/res/',
  urlShared: 'https://wali.igbcolombia.com/api/shared/',
  urlManager: 'https://wali.igbcolombia.com/api/manager/res/',
  urlSpring: 'https://wali.igbcolombia.com/api/apiRest/wali/',
  urlClaude: 'https://wali.igbcolombia.com/api/apiRestClaude/wali/',
  urlMeta: 'https://wali.igbcolombia.com/api/apiRestMeta/wali/',
  urlMtr: 'https://wali.igbcolombia.com/api/apiRestMtr/wali/'
};

export let AIGlobal = {
  url: 'https://api.openai.com/v1/'
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
