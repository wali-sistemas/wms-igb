import { Injectable } from '@angular/core';
import { Http, ResponseContentType } from '@angular/http';
import { WhatsappAgentRequest, WhatsappSendMessageRequest } from '../models/whatsapp/whatsapp-agend';
import 'rxjs/add/operator/map';
import { GLOBAL, IGBHeaders } from './global';

@Injectable()
export class WhatsappAgentService {
  public url: string;

  constructor(private _http: Http) {
    this.url = GLOBAL.urlMtrAgents + 'whatsapp/conversations/';
  }

  public getWaitingQueue(area?: string) {
    let endpoint = this.url + 'queue';
    if (area) {
      endpoint += '/' + encodeURIComponent(area);
    }
    return this._http.get(endpoint, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public getAssignedConversations(agentId: string, area?: string) {
    let endpoint = this.url + 'assigned/' + encodeURIComponent(agentId);
    if (area) {
      endpoint += '/' + encodeURIComponent(area);
    }
    return this._http.get(endpoint, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public getConversation(conversationCode: string) {
    return this._http.get(this.url + encodeURIComponent(conversationCode), { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public getMessages(conversationCode: string) {
    return this._http.get(this.url + encodeURIComponent(conversationCode) + '/messages', { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public getMessageMedia(conversationCode: string, messageCode: string) {
    return this._http.get(this.url + encodeURIComponent(conversationCode) + '/messages/' + encodeURIComponent(messageCode) + '/media', { headers: new IGBHeaders().loadHeaders(), responseType: ResponseContentType.Blob })
      .map(res => res.blob());
  }

  public assignConversation(conversationCode: string, agentId: string, agentName: string) {
    const body = new WhatsappAgentRequest(agentId, agentName);
    return this._http.post(this.url + encodeURIComponent(conversationCode) + '/assign', body, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public sendMessage(conversationCode: string, agentId: string, agentName: string, message: string) {
    const body = new WhatsappSendMessageRequest(agentId, agentName, message);
    return this._http.post(this.url + encodeURIComponent(conversationCode) + '/send', body, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public sendMedia(conversationCode: string, agentId: string, agentName: string, message: string, file: File) {
    const formData = new FormData();
    formData.append('agentId', agentId || '');
    formData.append('agentName', agentName || '');
    formData.append('message', message || '');
    formData.append('file', file, file.name);
    const headers: any = new IGBHeaders().loadHeaders();
    if (headers && headers.delete) {
      headers.delete('Content-Type');
      headers.delete('content-type');
    }
    return this._http.post(this.url + encodeURIComponent(conversationCode) + '/send-media', formData, { headers: headers })
      .map(res => res.json());
  }

  public sendImage(conversationCode: string, agentId: string, agentName: string, message: string, file: File) {
    return this.sendMedia(conversationCode, agentId, agentName, message, file);
  }

  public markAsRead(conversationCode: string, agentId: string, agentName: string) {
    const body = new WhatsappAgentRequest(agentId, agentName);
    return this._http.post(this.url + encodeURIComponent(conversationCode) + '/read', body, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }

  public closeConversation(conversationCode: string, agentId: string, agentName: string) {
    const body = new WhatsappAgentRequest(agentId, agentName);
    return this._http.post(this.url + encodeURIComponent(conversationCode) + '/close', body, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }
}
