import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import { GLOBAL } from './global';
import { AiChatRequest } from '../models/ai-analysis-response';

@Injectable()
export class AiAssistantService {
  public urlClaude: string;

  constructor(private _http: Http) {
    this.urlClaude = GLOBAL.urlClaude;
  }

  public analyze(message: string) {
    let body = new AiChatRequest();
    body.message = message;

    let headers = new Headers({
      'Content-Type': 'application/json'
    });

    return this._http.post(
      this.urlClaude + 'bot/ai/analyze',
      body,
      { headers: headers }
    ).map(res => res.json());
  }
}
