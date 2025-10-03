import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { GLOBAL, IGBHeaders } from './global';
import { GuideUpload } from '../models/trackingGuides/guide-upload';

@Injectable()
export class UploadGuideService {
  public urlSpring: string;

  constructor(private _http: Http) {
    this.urlSpring = GLOBAL.urlSpring;
  }

  public uploadGuides(payload: GuideUpload[], companyName: string) {
    return this._http.post(this.urlSpring + 'public-tracking/upload-guides?company=' + companyName, payload, { headers: new IGBHeaders().loadHeaders() })
      .map(res => res.json());
  }
}
