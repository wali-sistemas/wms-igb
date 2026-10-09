import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { UserService } from '../../../services/user.service';
import { WhatsappAgentService } from '../../../services/whatsapp-agent.service';
import { WhatsappActionResponse, WhatsappConversation, WhatsappMessage } from '../../../models/whatsapp/whatsapp-agend';

@Component({
  templateUrl: './support-agent.component.html',
  styleUrls: ['./support-agent.component.css'],
  providers: [
    UserService,
    WhatsappAgentService
  ]
})

export class SupportAgentComponent
  implements OnInit, OnDestroy {
  public identity: any;
  public agentId: string = '';
  public agentName: string = '';
  public waitingConversations: WhatsappConversation[] = [];
  public assignedConversations: WhatsappConversation[] = [];
  public messages: WhatsappMessage[] = [];
  public selectedConversation: WhatsappConversation | null = null;
  public newMessage: string = '';
  public selectedMediaFile: File | null = null;
  public selectedMediaPreview: string = '';
  public selectedMediaType: string = '';
  public expandedImageUrl: string = '';
  public showCloseConfirmation: boolean = false;
  public sendingMedia: boolean = false;
  private mediaObjectUrls: { [key: string]: string } = {};
  private selectedMediaObjectUrl: string = '';
  public loadingQueue: boolean = false;
  public loadingAssigned: boolean = false;
  public loadingMessages: boolean = false;
  public assigningConversation: boolean = false;
  public sendingMessage: boolean = false;
  public closingConversation: boolean = false;
  public errorMessage: string = '';
  public successMessage: string = '';
  private refreshInterval: any;
  private readonly refreshMilliseconds: number = 5000;
  private readonly area: string = 'SUPPORT';

  constructor(private _router: Router, private _userService: UserService, private _whatsappAgentService: WhatsappAgentService, private _sanitizer: DomSanitizer) { }

  ngOnInit() {
    this.identity = this._userService.getItentity();
    if (this.identity === null) {
      this._router.navigate(['/']);
      return;
    }
    this.agentId = this.identity.username || '';
    this.agentName = ((this.identity.name || '') + ' ' + (this.identity.surname || '')).trim();
    if (!this.agentId) {
      this.errorMessage = 'No fue posible identificar el usuario de la intranet.';
      return;
    }
    this.loadDashboard(true);
    this.startAutomaticRefresh();
  }

  ngOnDestroy() {
    this.stopAutomaticRefresh();
    this.clearSelectedMedia();
    this.revokeAllMediaObjectUrls();
  }

  public loadDashboard(showLoading: boolean) {
    this.loadWaitingQueue(showLoading);
    this.loadAssignedConversations(showLoading);
    if (this.selectedConversation) {
      this.loadMessages(
        this.selectedConversation.code,
        false
      );
    }
  }

  public loadWaitingQueue(showLoading: boolean) {
    if (showLoading) {
      this.loadingQueue = true;
    }

    this._whatsappAgentService.getWaitingQueue(this.area).subscribe(
      response => {
        this.waitingConversations = response || [];
        this.loadingQueue = false;
      }, error => {
        this.loadingQueue = false;
        this.handleHttpError(error, 'No fue posible consultar la cola de atención.');
      }
    );
  }

  public loadAssignedConversations(showLoading: boolean) {
    if (showLoading) {
      this.loadingAssigned = true;
    }

    this._whatsappAgentService.getAssignedConversations(this.agentId, this.area).subscribe(
      response => {
        this.assignedConversations = response || [];
        this.loadingAssigned = false;
        this.synchronizeSelectedConversation();
      }, error => {
        this.loadingAssigned = false;
        this.handleHttpError(error, 'No fue posible consultar tus conversaciones.');
      }
    );
  }

  public takeConversation(conversation: WhatsappConversation) {
    if (!conversation || this.assigningConversation) {
      return;
    }
    this.clearAlerts();
    this.assigningConversation = true;
    this._whatsappAgentService.assignConversation(conversation.code, this.agentId, this.agentName).subscribe(
      response => {
        this.assigningConversation = false;
        if (!response || !response.success) {
          this.errorMessage = response && response.message ? response.message : 'No fue posible tomar la conversación.';
          this.loadDashboard(false);
          return;
        }
        conversation.estado = 'ASSIGNED';
        conversation.agenteId = this.agentId;
        conversation.agenteNombre = this.agentName;
        this.successMessage = response.message;
        this.selectedConversation = conversation;
        this.loadWaitingQueue(false);
        this.loadAssignedConversations(false);
        this.loadMessages(conversation.code, true);
      }, error => {
        this.assigningConversation = false;
        this.handleHttpError(error, 'No fue posible tomar la conversación.');
        this.loadDashboard(false);
      }
    );
  }

  public openConversation(conversation: WhatsappConversation) {
    if (!conversation) {
      return;
    }

    this.clearAlerts();
    this.selectedConversation = conversation;
    this.newMessage = '';
    this.clearSelectedMedia();
    this.expandedImageUrl = '';
    this.loadMessages(conversation.code, true);

    if (conversation.noLeidos > 0) {
      this.markSelectedConversationAsRead();
    }
  }

  public loadMessages(conversationCode: string, showLoading: boolean) {
    if (!conversationCode) {
      return;
    }
    if (showLoading) {
      this.loadingMessages = true;
    }

    this._whatsappAgentService.getMessages(conversationCode).subscribe(
      response => {
        if (this.selectedConversation && this.selectedConversation.code === conversationCode) {
          this.messages = response || [];
          this.loadingMessages = false;
          this.resolveMessageMedia(
            conversationCode,
            this.messages
          );
          this.scrollToBottom();
        }
      }, error => {
        this.loadingMessages = false;
        this.handleHttpError(error, 'No fue posible consultar los mensajes.');
      }
    );
  }

  public handleEnterKey(event: any) {
    if (!event || event.shiftKey) {
      return;
    }
    event.preventDefault();
    this.sendCurrent();
  }

  public sendCurrent() {
    if (this.selectedMediaFile) {
      this.sendMedia();
      return;
    }
    this.sendMessage();
  }

  public sendMessage() {
    const message = (this.newMessage || '').trim();
    const conversation = this.selectedConversation;
    if (!message || !conversation || this.sendingMessage) {
      return;
    }
    this.clearAlerts();
    this.sendingMessage = true;

    this._whatsappAgentService.sendMessage(conversation.code, this.agentId, this.agentName, message).subscribe(
      response => {
        this.sendingMessage = false;
        if (!response || !response.success) {
          this.errorMessage = response && response.message ? response.message : 'No fue posible enviar el mensaje.';
          return;
        }
        this.newMessage = '';
        this.loadMessages(conversation.code, false);
        this.loadAssignedConversations(false);
      }, error => {
        this.sendingMessage = false;
        this.handleHttpError(error, 'No fue posible enviar el mensaje.');
      }
    );
  }

  public onMediaSelected(event: any) {
    if (!event || !event.target || !event.target.files) {
      return;
    }
    const file: File = event.target.files.length > 0 ? event.target.files[0] : null;
    if (!file) {
      return;
    }
    this.clearAlerts();
    const contentType = (file.type || '').toLowerCase();
    const imageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    const audioTypes = [
      'audio/ogg',
      'audio/mpeg',
      'audio/mp3',
      'audio/mp4',
      'audio/3gpp',
      'audio/aac',
      'audio/amr',
      'audio/amr-nb',
      'audio/ac3'
    ];
    let mediaType = '';
    let maxBytes = 0;

    if (imageTypes.indexOf(contentType) >= 0) {
      mediaType = 'IMAGE';
      maxBytes = 5 * 1024 * 1024;
    } else if (audioTypes.indexOf(contentType) >= 0) {
      mediaType = 'AUDIO';
      maxBytes = 20 * 1024 * 1024;
    } else {
      this.errorMessage =
        'Solo puedes adjuntar imágenes JPG/PNG o audios OGG, MP3/MPEG, MP4, 3GP, AAC, AMR o AC3.';
      event.target.value = '';
      return;
    }
    if (file.size > maxBytes) {
      this.errorMessage = mediaType === 'IMAGE' ? 'La imagen no puede superar 5 MB.' : 'El audio no puede superar 20 MB.';
      event.target.value = '';
      return;
    }

    this.clearSelectedMedia();
    this.selectedMediaFile = file;
    this.selectedMediaType = mediaType;
    this.selectedMediaObjectUrl = window.URL.createObjectURL(file);
    this.selectedMediaPreview = this._sanitizer.bypassSecurityTrustUrl(this.selectedMediaObjectUrl) as any;
  }

  public clearSelectedMedia() {
    if (this.selectedMediaObjectUrl) {
      try {
        window.URL.revokeObjectURL(this.selectedMediaObjectUrl);
      } catch (exception) { }
    }
    this.selectedMediaObjectUrl = '';
    this.selectedMediaPreview = '';
    this.selectedMediaFile = null;
    this.selectedMediaType = '';
    const input = document.getElementById('whatsappMediaInput') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  public sendMedia() {
    const conversation = this.selectedConversation;
    const file = this.selectedMediaFile;
    const message = (this.newMessage || '').trim();
    const mediaType = this.selectedMediaType;
    if (!conversation || !file || this.sendingMedia) {
      return;
    }
    this.clearAlerts();
    this.sendingMedia = true;
    const mediaMessage = mediaType === 'IMAGE' ? message : '';

    this._whatsappAgentService.sendMedia(conversation.code, this.agentId, this.agentName, mediaMessage, file).subscribe(
      response => {
        this.sendingMedia = false;
        if (!response || !response.success) {
          this.errorMessage = response && response.message ? response.message : 'No fue posible enviar el archivo multimedia.';
          return;
        }
        if (mediaType === 'IMAGE') {
          this.newMessage = '';
        } else if (message) {
          this.successMessage = 'Audio enviado. El texto quedó listo para enviarse por separado.';
        } else {
          this.successMessage = response.message || '';
        }
        this.clearSelectedMedia();
        this.loadMessages(conversation.code, false);
        this.loadAssignedConversations(false);
      }, error => {
        this.sendingMedia = false;
        this.handleHttpError(error, 'No fue posible enviar el archivo multimedia.');
      }
    );
  }

  public openImage(message: WhatsappMessage) {
    if (!message || !message.resolvedMediaUrl) {
      return;
    }
    this.expandedImageUrl = message.resolvedMediaUrl;
  }

  public closeImage() {
    this.expandedImageUrl = '';
  }

  public closeSelectedConversation() {
    if (!this.selectedConversation || this.closingConversation) {
      return;
    }
    this.showCloseConfirmation = true;
  }

  public cancelCloseConversation() {
    if (this.closingConversation) {
      return;
    }
    this.showCloseConfirmation = false;
  }

  public confirmCloseConversation() {
    if (!this.selectedConversation || !this.showCloseConfirmation || this.closingConversation) {
      return;
    }
    this.clearAlerts();
    this.closingConversation = true;

    this._whatsappAgentService.closeConversation(this.selectedConversation.code, this.agentId, this.agentName).subscribe(
      response => {
        this.closingConversation = false;
        if (!response || !response.success) {
          this.showCloseConfirmation = false;
          this.errorMessage = response && response.message ? response.message : 'No fue posible cerrar la conversación.';
          return;
        }
        this.showCloseConfirmation = false;
        this.successMessage = response.message;
        this.selectedConversation = null;
        this.messages = [];
        this.newMessage = '';
        this.loadDashboard(false);
      }, error => {
        this.closingConversation = false;
        this.showCloseConfirmation = false;
        this.handleHttpError(error, 'No fue posible cerrar la conversación.');
      }
    );
  }

  public refreshNow() {
    this.clearAlerts();
    this.loadDashboard(true);
  }

  public getInitials(conversation: WhatsappConversation) {
    if (!conversation) {
      return '?';
    }
    const value = conversation.cliente || conversation.perfil || conversation.telefono || '?';
    const words = value.trim().split(' ');
    let initials = '';
    for (let index = 0; index < words.length && index < 2; index++) {
      if (words[index]) {
        initials += words[index].charAt(0).toUpperCase();
      }
    }
    return initials || '?';
  }

  public getConversationName(conversation: WhatsappConversation) {
    if (!conversation) {
      return '';
    }
    return conversation.cliente || conversation.perfil || conversation.telefono;
  }

  public getMessageClass(message: WhatsappMessage) {
    if (!message) {
      return '';
    }
    if (message.origin === 'SYSTEM') {
      return 'system-message';
    }
    if (message.direction === 'OUTBOUND' || message.origin === 'AGENT' || message.origin === 'BOT') {
      return 'outbound-message';
    }
    return 'inbound-message';
  }

  public isSystemMessage(message: WhatsappMessage) {
    return message && message.origin === 'SYSTEM';
  }

  public isImageMessage(message: WhatsappMessage) {
    return !!(message && message.mediaUrl && message.mediaContentType && message.mediaContentType.toLowerCase().indexOf('image/') === 0);
  }

  public isAudioMessage(message: WhatsappMessage) {
    return !!(message && message.mediaUrl && message.mediaContentType && message.mediaContentType.toLowerCase().indexOf('audio/') === 0);
  }

  public formatConversationDate(conversation: WhatsappConversation) {
    if (!conversation) {
      return '';
    }
    const date = conversation.fechaSolicitud || conversation.fechaCreacion || '';
    const time = conversation.horaSolicitud || conversation.horaCreacion || '';
    return (date + ' ' + time).trim();
  }

  public formatMessageTime(message: WhatsappMessage) {
    if (!message) {
      return '';
    }
    return ((message.date || '') + ' ' + (message.time || '')).trim();
  }

  private markSelectedConversationAsRead() {
    if (!this.selectedConversation) {
      return;
    }
    const conversationCode = this.selectedConversation.code;

    this._whatsappAgentService.markAsRead(conversationCode, this.agentId, this.agentName).subscribe(
      response => {
        if (response && response.success && this.selectedConversation && this.selectedConversation.code === conversationCode) {
          this.selectedConversation.noLeidos = 0;
          this.updateUnreadCounterInAssigned(conversationCode);
        }
      }, error => {
        this.handleHttpError(error, 'No fue posible marcar la conversación como leída.');
      }
    );
  }

  private updateUnreadCounterInAssigned(conversationCode: string) {
    for (let index = 0; index < this.assignedConversations.length; index++) {
      if (this.assignedConversations[index].code === conversationCode) {
        this.assignedConversations[index].noLeidos = 0;
        break;
      }
    }
  }

  private synchronizeSelectedConversation() {
    if (!this.selectedConversation) {
      return;
    }
    const selectedCode = this.selectedConversation.code;
    let updatedConversation: WhatsappConversation | null = null;
    for (let index = 0; index < this.assignedConversations.length; index++) {
      if (this.assignedConversations[index].code === selectedCode) {
        updatedConversation = this.assignedConversations[index];
        break;
      }
    }
    if (updatedConversation) {
      this.selectedConversation = updatedConversation;
      return;
    }
    this.selectedConversation = null;
    this.messages = [];
    this.newMessage = '';
    this.clearSelectedMedia();
    this.expandedImageUrl = '';
  }

  private resolveMessageMedia(conversationCode: string, messages: WhatsappMessage[]) {
    if (!messages || messages.length === 0) {
      return;
    }
    for (let index = 0; index < messages.length; index++) {
      const message = messages[index];
      if ((!this.isImageMessage(message) && !this.isAudioMessage(message)) || !message.code) {
        continue;
      }
      const cachedUrl = this.mediaObjectUrls[message.code];
      if (cachedUrl) {
        message.resolvedMediaUrl = this._sanitizer.bypassSecurityTrustUrl(cachedUrl) as any;
        message.mediaLoading = false;
        continue;
      }
      message.mediaLoading = true;

      this._whatsappAgentService.getMessageMedia(conversationCode, message.code).subscribe(
        response => {
          if (!response || response.size === 0) {
            message.mediaLoading = false;
            return;
          }
          const objectUrl = window.URL.createObjectURL(response);
          this.mediaObjectUrls[message.code] = objectUrl;
          message.resolvedMediaUrl = this._sanitizer.bypassSecurityTrustUrl(objectUrl) as any;
          message.mediaLoading = false;
        }, error => {
          message.mediaLoading = false;
          this.handleHttpError(error, 'No fue posible obtener el archivo multimedia.');
        }
      );
    }
  }

  private revokeAllMediaObjectUrls() {
    const keys = Object.keys(this.mediaObjectUrls);
    for (let index = 0; index < keys.length; index++) {
      const url = this.mediaObjectUrls[keys[index]];
      if (url) {
        try {
          window.URL.revokeObjectURL(url);
        } catch (exception) {
          console.error('Error revoking object URL:', exception);
        }
      }
    }
    this.mediaObjectUrls = {};
  }

  private startAutomaticRefresh() {
    this.stopAutomaticRefresh();
    this.refreshInterval = setInterval(() => {
      this.loadDashboard(false);
    }, this.refreshMilliseconds);
  }

  private stopAutomaticRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  private clearAlerts() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private scrollToBottom() {
    setTimeout(() => {
      const chatWindow = document.getElementById('whatsappChatWindow');
      if (chatWindow) {
        chatWindow.scrollTop = chatWindow.scrollHeight;
      }
    }, 100);
  }

  private handleHttpError(error: any, defaultMessage: string) {
    if (error && error.status === 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
      return;
    }
    let backendMessage = '';
    try {
      const body = error.json();
      if (body && body.message) {
        backendMessage = body.message;
      }
    } catch (exception) {
      backendMessage = '';
    }
    this.errorMessage = backendMessage || defaultMessage;
  }
}
