import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AiAssistantService } from '../../services/ai-assistant.service';
import { GLOBAL } from 'app/services/global';

declare var $: any;

@Component({
  templateUrl: './ai-assistant.component.html',
  styleUrls: ['./ai-assistant.component.css'],
  providers: [UserService, AiAssistantService]
})

export class AiAssistantComponent implements OnInit {
  public identity: any = [];
  public selectedCompany: string = '';
  public name: string = '';
  public userName: string = '';
  public userMessage: string = '';
  public isLoading: boolean = false;
  public urlShared: string = GLOBAL.urlShared;
  public messages: any[] = [
    {
      role: 'assistant',
      text: 'Hola 👋 Soy tu asistente gerencial IA. Puedes preguntarme sobre ventas, clientes, productos, facturas o resultados comerciales de SAP.',
      sql: '',
      data: [],
      showSql: false,
      showData: false
    }
  ];

  constructor(private _router: Router, private _userService: UserService, private _aiAssistantService: AiAssistantService) { }

  ngOnInit() {
    this.identity = this._userService.getItentity();

    if (this.identity === null) {
      this._router.navigate(['/']);
      return;
    }

    this.selectedCompany = this.identity.selectedCompany;
    this.name = this.identity.name;
    this.userName = this.identity.username;
  }

  private redirectIfSessionInvalid(error: any) {
    if (error && error.status && error.status == 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

  public sendMessage() {
    let question = this.userMessage.trim();

    if (!question || this.isLoading) {
      return;
    }

    this.messages.push({
      role: 'user',
      text: question,
      sql: '',
      data: [],
      showSql: false,
      showData: false
    });

    this.userMessage = '';
    this.isLoading = true;

    this._aiAssistantService.analyze(question).subscribe(
      response => {
        this.messages.push({
          role: 'assistant',
          text: response.analysis || 'No se recibió análisis.',
          sql: response.sql || '',
          data: response.data || [],
          showSql: false,
          showData: true
        });

        this.isLoading = false;
        this.scrollToBottom();
      },
      error => {
        this.redirectIfSessionInvalid(error);
        this.messages.push({
          role: 'assistant',
          text: '⚠️ Ocurrió un error al analizar la información. Por favor intenta nuevamente.',
          sql: '',
          data: [],
          showSql: false,
          showData: false
        });

        this.isLoading = false;
        this.scrollToBottom();
      }
    );

    setTimeout(() => {
      this.scrollToBottom();
    }, 100);
  }

  public clearChat() {
    this.messages = [
      {
        role: 'assistant',
        text: 'Chat limpiado 🧹. Puedes hacer una nueva pregunta gerencial.',
        sql: '',
        data: [],
        showSql: false,
        showData: false
      }
    ];

    this.userMessage = '';
  }

  public toggleSql(msg: any) {
    msg.showSql = !msg.showSql;
  }

  public toggleData(msg: any) {
    msg.showData = !msg.showData;
  }

  public hasData(msg: any) {
    return msg.data && msg.data.length > 0;
  }

  public getColumns(data: any[]) {
    if (!data || data.length === 0) {
      return [];
    }

    return Object.keys(data[0]);
  }

  public askExample(question: string) {
    this.userMessage = question;
    this.sendMessage();
  }

  private scrollToBottom() {
    setTimeout(() => {
      let chatWindow = document.getElementById('chatWindow');
      if (chatWindow) {
        chatWindow.scrollTop = chatWindow.scrollHeight;
      }
    }, 200);
  }

  public isNumericValue(value: any) {
    return value !== null
      && value !== undefined
      && value !== ''
      && !isNaN(Number(value));
  }


  public formatTableValue(column: string, value: any) {
    if (value === null || value === undefined) {
      return '';
    }

    if (!this.isNumericValue(value)) {
      return value;
    }

    const numberValue = Number(value);
    const columnName = column.toLowerCase();

    const isMoneyColumn =
      columnName.includes('total')
      || columnName.includes('venta')
      || columnName.includes('cifra')
      || columnName.includes('comercial')
      || columnName.includes('costo')
      || columnName.includes('utilidad')
      || columnName.includes('margen')
      || columnName.includes('precio');

    const isCodeColumn =
      columnName.includes('codigo')
      || columnName.includes('code')
      || columnName.includes('nit')
      || columnName.includes('documento')
      || columnName.includes('anio')
      || columnName.includes('mes');

    if (isCodeColumn) {
      return String(value);
    }

    if (isMoneyColumn) {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(numberValue);
    }

    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(numberValue);
  }
}
