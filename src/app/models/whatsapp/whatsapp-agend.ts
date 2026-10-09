export class WhatsappConversation {
  public code: string = '';
  public name: string = '';
  public telefono: string = '';
  public perfil: string = '';
  public cardCode: string = '';
  public documento: string = '';
  public cliente: string = '';
  public estado: string = '';
  public modo: string = '';
  public agenteId: string = '';
  public agenteNombre: string = '';
  public ultimoMensaje: string = '';
  public noLeidos: number = 0;
  public fechaCreacion: string = '';
  public horaCreacion: string = '';
  public fechaSolicitud: string = '';
  public horaSolicitud: string = '';
  public fechaAsignacion: string = '';
  public horaAsignacion: string = '';
  public fechaCierre: string = '';
  public horaCierre: string = '';
}

export class WhatsappMessage {
  public code: string = '';
  public name: string = '';
  public conversationCode: string = '';
  public origin: string = '';
  public direction: string = '';
  public agentId: string = '';
  public agentName: string = '';
  public messageType: string = '';
  public body: string = '';
  public mediaUrl: string = '';
  public mediaContentType: string = '';
  public resolvedMediaUrl: string = '';
  public mediaLoading: boolean = false;
  public twilioMessageSid: string = '';
  public status: string = '';
  public date: string = '';
  public time: string = '';
}

export class WhatsappActionResponse {
  public success: boolean = false;
  public message: string = '';
  public conversationCode: string = '';
  public messageCode: string = '';
  public twilioSid: string = '';
  public twilioStatus: string = '';
}

export class WhatsappAgentRequest {
  public agentId: string = '';
  public agentName: string = '';

  constructor(agentId?: string, agentName?: string) {
    this.agentId = agentId || '';
    this.agentName = agentName || '';
  }
}

export class WhatsappSendMessageRequest extends WhatsappAgentRequest {
  public message: string = '';

  constructor(agentId?: string, agentName?: string, message?: string) {
    super(agentId, agentName);
    this.message = message || '';
  }
}
