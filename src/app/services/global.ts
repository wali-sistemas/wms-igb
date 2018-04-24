import { Headers } from '@angular/http';

export let GLOBAL = {
    //url: 'http://wali.igbcolombia.com:8080/igb/res/'
    url: 'http://192.168.1.12:8080/igb/res/'
};

export class IGBHeaders {
    public loadHeaders() {
        let ident = localStorage.getItem('igb.identity');
        if (ident) {
            return new Headers({
                'Content-Type': 'application/json',
                'X-Company-Name': localStorage.getItem('igb.selectedCompany'),
                'Authorization': JSON.parse(ident).token,
                'X-Employee': JSON.parse(ident).username
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
