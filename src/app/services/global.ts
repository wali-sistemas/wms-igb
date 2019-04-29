import { Headers } from '@angular/http';

export let GLOBAL = {
    url: 'http://wali.igbcolombia.com:8080/igb/res/',
    urlShared: 'http://wali.igbcolombia.com:8080/shared/',
    urlManager: 'http://wali.igbcolombia.com:8080/manager/res/'
};

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
