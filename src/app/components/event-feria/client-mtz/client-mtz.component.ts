import { Component, OnInit } from '@angular/core';
import { EventService } from '../../../services/event.service';
import { OpenAIService } from '../../../services/openai.service';

declare var $: any;
declare var MediaRecorder: any;
declare var require: any;
const MicRecorder = require('mic-recorder-to-mp3');

@Component({
  templateUrl: './client-mtz.component.html',
  styleUrls: ['./client-mtz.component.css'],
  providers: [EventService, OpenAIService]
})
export class ClientMtzComponent implements OnInit {
  public identity;
  public contact: string;
  public whsName: string;
  public document: string;
  public departamento: string = "";
  public selectedAsesor: string = "";
  public city: string;
  public phone: string;
  public mail: string;
  public warningMessage: string;
  public exitMessage: string;
  public errorMessage: string;
  public selected: Map<number, string>;
  public validContact: boolean = true;
  public validPhone: boolean = true;
  public validDocument: boolean = true;
  public validMail: boolean = true;
  public validSelectAsesor: boolean = true;
  public authorizeData: boolean = false;
  //Variables OPEN IA
  public isRecording = false;
  public transcribedText: string = '';
  public mediaRecorder: any;
  public transcript: string = '';
  public audioChunks: any[] = [];
  public apiKey: string = '';
  public recorder = new MicRecorder({ bitRate: 128 });
  public stream: MediaStream;

  constructor(private _eventService: EventService, private _openAIService: OpenAIService) {
    this.selected = new Map<number, string>();
  }

  ngOnInit() {
    this._openAIService.getApikeyOpenAI().subscribe(
      response => {
        this.apiKey = response.content;
      }, error => { console.error(error); }
    );
  }

  public selectedInteres(key: number, interes: string) {
    this.errorMessage = "";
    if (this.selected.has(key)) {
      this.selected.delete(key);
    } else {
      this.selected.set(key, interes);
    }
  }

  public captureClient() {
    this.errorMessage = "";
    this.exitMessage = "";
    let interes = "";

    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });

    if (this.contact == null || this.contact.length <= 0) {
      this.validContact = false;
      this.getScrollTop();
      $('#modal_transfer_process').modal('hide');
      return;
    }
    if (this.document == null || this.document.length <= 0) {
      this.validDocument = false;
      this.getScrollTop();
      $('#modal_transfer_process').modal('hide');
      return;
    }
    if (this.phone == null || this.phone.length <= 0) {
      this.validPhone = false;
      this.getScrollTop();
      $('#modal_transfer_process').modal('hide');
      return;
    }
    if (this.mail == null || this.mail.length <= 0) {
      this.validMail = false;
      this.getScrollTop();
      $('#modal_transfer_process').modal('hide');
      return;
    }
    if (this.selectedAsesor == null || this.selectedAsesor.length <= 0) {
      this.validSelectAsesor = false;
      this.getScrollTop();
      $('#modal_transfer_process').modal('hide');
      return;
    }

    for (let key of Array.from(this.selected.keys())) {
      interes += this.selected.get(key) + " ";
    }
    if (interes.length <= 0) {
      this.errorMessage = "Seleccione un interes.";
      this.getScrollTop();
      $('#modal_transfer_process').modal('hide');
      return;
    }

    let clientFeriaDTO = {
      "documento": this.document,
      "nombreCompleto": this.contact.toUpperCase(),
      "telefono": this.phone,
      "correo": this.mail.toUpperCase(),
      "almacen": this.whsName,
      "interes": interes.trim(),
      "regional": this.departamento,
      "ciudad": this.city.toUpperCase(),
      "companyName": "VARROC",
      "asesor": this.selectedAsesor
    }

    this._eventService.captureClient(clientFeriaDTO).subscribe(
      response => {
        if (response.code === 0) {
          this.clearForm();
          this.exitMessage = response.content;
        } else {
          this.errorMessage = response.content + "[" + this.document + "]."
        }
        this.getScrollTop();
        $('#modal_transfer_process').modal('hide');
      },
      error => {
        console.error('Ocurrio un error capturando los datos', error);
        this.getScrollTop();
        this.errorMessage = "Lo sentimos. Se produjo un error interno.";
        $('#modal_transfer_process').modal('hide');
      }
    );
  }

  public startRecording() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.warningMessage = "Tu navegador no soporta grabación de voz.";
      $('#modal_voice_ai').modal('hide');
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      this.stream = stream;

      if (isIOS && isSafari) {
        this.recorder.start()
          .then(() => {
            this.isRecording = true;
          })
          .catch(error => {
            this.errorMessage = "Ocurrió un error al acceder al micrófono en iphone.";
            $('#modal_voice_ai').modal('hide');
            console.error('Ocurrió un error al acceder al micrófono en iphone ', error);
          });
      } else {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
          this.audioChunks = [];
          this.stream = stream;
          this.mediaRecorder = new MediaRecorder(stream);
          this.mediaRecorder.start();
          this.isRecording = true;

          this.mediaRecorder.addEventListener('dataavailable', event => {
            this.audioChunks.push(event.data);
          });
        }).catch(error => {
          this.errorMessage = "Ocurrió un error al acceder el micrófono.";
          $('#modal_voice_ai').modal('hide');
          console.error('Error MediaRecorder:', error);
        });
      }
    });
  }

  public stopRecording() {
    $('#modal_voice_ai').modal('hide');

    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIOS && isSafari) {
      this.recorder.stop().getMp3().then(([buffer, blob]) => {
        const file = new File(buffer, 'voice.mp3', {
          type: blob.type,
          lastModified: Date.now()
        });
        this.transcribeAudio(file);
        this.isRecording = false;

        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }
      }).catch(error => {
        console.error('Error al detener grabación Safari:', error);
      });
    } else {
      if (this.mediaRecorder) {
        this.mediaRecorder.stop();
        this.mediaRecorder.addEventListener('stop', () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          this.transcribeAudio(audioBlob);
          this.isRecording = false;
        });
      }

      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
    }
  }

  private transcribeAudio(audioBlob: Blob) {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'whisper-1');
    formData.append('language', 'es');

    this._openAIService.transcribeVoiceInput(formData, this.apiKey).subscribe(
      response => {
        if (!response.ok) {
          this.interpretWithAI(response.text);
        } else {
          this.warningMessage = "Ocurrio un error al procesar la voz. Inténtalo de nuevo.";
          $('#modal_voice_ai').modal('hide');
        }
      }, error => {
        this.warningMessage = "Ocurrio un error al transcribir el audio en texto. Inténtalo de nuevo.";
        $('#modal_voice_ai').modal('hide');
        console.error(error);
      }
    );
  }

  private interpretWithAI(text: string) {
    const prompt = `Actuar como un asesor que esta capturando datos de un futuro cliente o empresa en una feria expocitora. Los datos capturados son el siguiente mensaje de voz transcrito en texto:
    "${text}"
    Necesito que clasifiques y devuelvas la siguiente información en un objeto JSON, de no tener suficientes datos retornar un mensaje de volver a intentarlo:
    1. "authorizeData": Autorización a MOTOZONE al uso de los datos (Artículo 20 Decreto Reglamentario 1377 de 2013 de la Ley de Habeas Data) (Dato booleano)
    2. "cardName": Nombre del cliente o empresa (Dato string)
    3. "whsName": Nombre del almacén o local (Dato string)
    4. "document": Cédula o NIT (Dato number)
    5. "departamento": Nombre del departamento del país de Colombia (Dato string)
    6. "city": Nombre de la ciudad, localidad, zona o barrio (Dato string)
    7. "phone": Número de contacto, número de teléfono o número de celular (Dato number)
    8. "mail": Correo eléctronico (Dato string) - pattern="[a-zA-Z0-9_]+([.][a-zA-Z0-9_]+)*@[a-zA-Z0-9_]+([.][a-zA-Z0-9_]+)*[.][a-zA-Z]{1,5}"
    9. "selectedAsesor": Obtener solo el value (Dato string) del nombre de quien lo asesora según esta lista:
      value="ADRIÁN MONCADA">ADRIÁN MONCADA
      value="LAURA APARICIO">LAURA APARICIO
      value="JESUS ELIAS PERALTA">JESUS ELIAS PERALTA
      value="SEBASTIAN USUGA">SEBASTIAN USUGA
      value="JENNIFER TRIANA">JENNIFER TRIANA
      value="LISANDRO ARLEY CALISTO">LISANDRO ARLEY CALISTO
      value="ANGIE PEÑA">ANGIE PEÑA
      value="ANGELYS VALLESTEROS">ANGELYS VALLESTEROS
      value="JAVIER MAURICIO BARON">JAVIER MAURICIO BARON
      value="CARLOS ALBERTO MURGAS">CARLOS ALBERTO MURGAS
      value="ORNELLA OJEDA">ORNELLA OJEDA
      value="NESTOR GIRALDO">NESTOR GIRALDO
      value="JORGE ALONSO RESTREPO">JORGE ALONSO RESTREPO
      value="WENDY VELAZQUES">WENDY VELAZQUES
      value="JULIAN ESTRADA">JULIAN ESTRADA
      value="MONICA CARMONA">JULIAN ESTRADA
      value="LUISA FERNANDA MORENO">LUISA FERNANDA MORENO
      value="BORIS FRANCO">BORIS FRANCO
      value="EDELBERTO GONZALEZ">EDELBERTO GONZALEZ
      value="EDWIN OWEIMER RAMIREZ">EDWIN OWEIMER RAMIREZ
      value="GIAN CARLOS PULIDO">GIAN CARLOS PULIDO
      value="MATEO ACOSTA">MATEO ACOSTA
      value="FERNEY DIAZ">FERNEY DIAZ
      value="CLAUDIA FERNANDEZ">CLAUDIA FERNANDEZ
      value="ALEJANDRA MONSALVE">ALEJANDRA MONSALVE
      value="VALENTINA SANCHEZ">VALENTINA SANCHEZ
    10. "selectedInteres": Obtener solo el value (Dato string) del grupo de interes según esta lista y SI son todos obtenerlos:
      value="PARTES PLÁSTICAS" key=0
      value="LUBRICANTES" key=1
      value="REPUESTOS" key=2
      value="LLANTAS" key=3

    Responde únicamente con un objeto JSON válido. No expliques nada más.
    Ejemplo esperado:
    {
     "authorizeData": true,
     "cardName": "JHON RESTREPO",
     "whsName": "TALLER",
     "document": "0123456789",
     "departamento": "ANTIOQUIA",
     "city": "BELLO",
     "phone": "0123456789",
     "mail": "correo@dominio.com",
     "selectedAsesor": "ASESOR",
     "selectedInteres": [
      {
       "key": 0
       "value": PARTES PLÁSTICAS
      },
      {
       "key": 1
       "value": LUBRICANTES
      },
      {
       "key": 2
       "value": REPUESTOS
      },
      {
       "key": 3
       "value": LLANTAS
      }
     ]
    }`;

    const formData = {
      model: "gpt-4",
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2
    };

    this._openAIService.interpretTextInput(formData, this.apiKey).subscribe(
      response => {
        const data = response.json();
        const aiResponse = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

        if (aiResponse) {
          const formJson = JSON.parse(aiResponse);

          this.authorizeData = formJson.authorizeData;
          this.contact = formJson.cardName;
          this.whsName = formJson.whsName;
          this.document = formJson.document;
          this.departamento = formJson.departamento;
          this.city = formJson.city;
          this.phone = formJson.phone;
          this.mail = formJson.mail;
          this.selectedAsesor = formJson.selectedAsesor;

          if (formJson.selectedInteres != null) {
            for (const interesado of formJson.selectedInteres) {
              this.selectedInteres(interesado.key, interesado.value);
            }
          }

          $('#modal_transfer_process').modal('hide');
        } else {
          this.warningMessage = "La respuesta de la IA está vacía o mal estructurada. Inténtalo de nuevo.";
          $('#modal_transfer_process').modal('hide');
        }
      },
      error => {
        $('#modal_transfer_process').modal('hide');
        this.warningMessage = "Lo sentimos, inténtalo de nuevo."
        console.error(error);
      }
    );
  }

  public openAssistantAI() {
    this.clearForm();

    $('#modal_voice_ai').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });
  }

  public getData() {
    this.errorMessage = "";
    this.exitMessage = "";
  }

  public closeModal() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.mediaRecorder.stop();
    this.isRecording = false;
    $('#modal_voice_ai').modal('hide');
  }

  public clearForm() {
    this.document = "";
    this.contact = "";
    this.phone = "";
    this.mail = "";
    this.whsName = "";
    this.departamento = "";
    this.authorizeData = false;
    this.selected = new Map<number, string>();
    this.errorMessage = "";
    this.exitMessage = "";
    this.city = "";
    this.selectedAsesor = "";
  }

  public getScrollTop() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }
}
