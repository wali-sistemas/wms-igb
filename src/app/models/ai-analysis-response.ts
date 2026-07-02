export class AiChatRequest {
  public message: string = '';

  constructor() { }
}

export class AiAnalysisResponse {
  public sql: string = '';
  public data: any[] = [];
  public analysis: string = '';

  constructor() { }
}
