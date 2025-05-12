import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import { AIGlobal } from './global';

@Injectable()
export class OpenAIService {
  public url: string;
  public apiKey: string;

  constructor(private _http: Http) {
    this.url = AIGlobal.url;
    this.apiKey = AIGlobal.apiKey;
  }

  public transcribeVoiceInput(formData) {
    let igbHeaders = new Headers({
      'Authorization': 'Bearer ' + this.apiKey
    });
    return this._http.post(this.url + 'audio/transcriptions', formData, { headers: igbHeaders })
      .map(res => res.json());
  }

  public interpretTextInput(formData: any) {
    let igbHeaders = new Headers({
      'Authorization': 'Bearer ' + this.apiKey,
      'Content-Type': 'application/json'
    });
    return this._http.post(this.url + 'chat/completions', formData, { headers: igbHeaders });
  }
}
