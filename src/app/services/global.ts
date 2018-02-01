import { Headers } from '@angular/http';

export let GLOBAL = {
    //url: 'http://wali.igbcolombia.com:8080/igb/res/'
    url: 'http://192.168.1.122:8080/igb/res/'
};

export let HEADERS = new Headers({
    'Content-Type': 'application/json',
    'X-Company-Name': localStorage.getItem('igb.selectedCompany')
});

if (localStorage.getItem('igb.identity')) {
    HEADERS.set('Authorization', JSON.parse(localStorage.getItem('igb.identity')).token);
}

export let CONTENT_TYPE_JSON = new Headers({
    'Content-Type': 'application/json'
});
