import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import { AIGlobal, GLOBAL } from './global';

@Injectable()
export class OpenAIService {
  public url: string;
  public urlManager: string;

  constructor(private _http: Http) {
    this.url = AIGlobal.url;
    this.urlManager = GLOBAL.urlManager;
  }

  public getApikeyOpenAI() {
    return this._http.get(this.urlManager + 'chatbot/open-ai/apikey')
      .map(res => res.json());
  }

  public transcribeVoiceInput(formData, apiKey: string) {
    let igbHeaders = new Headers({
      'Authorization': 'Bearer ' + apiKey
    });
    return this._http.post(this.url + 'audio/transcriptions', formData, { headers: igbHeaders })
      .map(res => res.json());
  }

  public interpretTextInput(formData: any, apiKey: string) {
    let igbHeaders = new Headers({
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    });
    return this._http.post(this.url + 'chat/completions', formData, { headers: igbHeaders });
  }
}
