import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../services/user.service';
import { PurchaseOrdersService } from '../../services/purchase-orders.service';
import { PurchaseOrder } from '../../models/purchase-order';
import { PurchaseOrderLine } from '../../models/purchase-order-line';
import { PurchaseOrderUDF } from '../../models/purchase-order-udf';

declare var $: any;

@Component({
  templateUrl: './purchase-order.component.html',
  styleUrls: ['./purchase-order.component.css'],
  providers: [UserService, PurchaseOrdersService]
})
export class PurchaseOrderComponent implements OnInit {
  public identity;
  public token;
  public quantity: number;
  public generalErrorMessage: string;
  public quantityErrorMessage: string;
  public errorMessage: string;
  public scannedText: string;
  public order: PurchaseOrder;
  public receivedItems: Array<PurchaseOrderLine>;
  public processingItem: PurchaseOrderLine;
  public displayType: string = 'UDF';
  private processingItemIndex: number = 0;
  public creatingSAPDocument: boolean = false;
  public editingQuantity: boolean = false;
  private editingPosition: number = -1;
  private received: Map<String, number>;
  //UDF
  private selectedTransport: string = '';
  private dateEmbarq: Date;
  private selectedTermNeg: string = '';
  private selectedModTransp: string = '';
  private selectedPuertoDest: string = '';
  private selectedStatusOC: string = '';
  private selectedEmb: string = '';
  private docBL: string = '';
  private dateEntComex: Date;
  private dateArribPuert: Date;
  private dateArribAlm: Date;
  private selectedEmp: string = '';
  private newNotes: string = '';
  private selectedPuertEmb: string = '';
  private transpTerr: string = '';
  private cbm: string = '';
  private dateArribCed: Date;
  private cantCont: number = 0;
  private dateCargList: Date;
  private tiempTrans: string = '';
  private dateSalPuert: Date;
  private tiempPuert: string = '';
  private tiempEntreg: number = 0;
  private dateConfBooking: Date;
  private tiempEspBooking: number = 0;
  private dateEstEmb: Date;
  private dateEstArribCed: Date;
  private dateLiq: Date;
  private dateLibBL: Date;
  private dateRecDocFin: Date;
  private emisionBLDest: string = '';
  private selectedInspPuerto: string = '';
  private selectedNotifBL: string = '';
  private liqComex: string = '';
  private conductor: string = '';
  private cedCond: number = 0;
  private placVeh: string = '';
  private contenedor: string = '';
  private precinto: string = '';
  private selectedEnvDatCond: string = '';
  private selectedAnalistComex: string = '';

  constructor(private _userService: UserService,
    private _purchaseOrdersService: PurchaseOrdersService,
    private _route: ActivatedRoute, private _router: Router) {
    this.order = new PurchaseOrder(0, '', '', new Date(), 0, 0, '', '', 0, new Array<PurchaseOrderLine>());
    this.receivedItems = new Array<PurchaseOrderLine>();
    this.received = new Map<String, number>();
  }

  ngOnInit() {
    console.log('iniciando componente de orden de compra');
    //TODO: validar vigencia del token/identity
    this.identity = this._userService.getItentity();
    if (this.identity === null) {
      this._router.navigate(['/']);
    }
    $('#modal_quantity').on('shown.bs.modal', function () {
      $('#quantity').focus();
    });
    this.loadSelectedOrder();
  }

  private loadSelectedOrder() {
    this.receivedItems = new Array<PurchaseOrderLine>();
    this._route.params.forEach((params: Params) => {
      if (params['docNum']) {
        this._purchaseOrdersService.loadOrder(params['docNum']).subscribe(
          response => {
            this.order = response;
            //busca si hay ordenes en proceso en el localStorage
            let previousReception = JSON.parse(localStorage.getItem('igb.reception'));
            console.log(previousReception);
            let itemsToRemove = [];
            if (previousReception) {
              this.receivedItems = previousReception;
              //inicializa el mapa con las referencias recibidas y sus posiciones en el arreglo
              for (let i = 0; i < this.receivedItems.length; i++) {
                this.received.set(this.receivedItems[i].itemCode, i);
              }
              for (let i = 0; i < this.order.lines.length; i++) {
                for (let j = 0; j < this.receivedItems.length; j++) {
                  if (this.order.lines[i].itemCode === this.receivedItems[j].itemCode) {
                    if (!this.receivedItems[j].partial) {
                      this.order.lines.splice(i, 1);
                      i = -1;
                    } else {
                      this.order.lines[i].quantity = this.order.lines[i].quantity - this.receivedItems[j].quantity;
                      this.order.lines[i].partial = true;
                    }
                    break;
                  }
                }
                if (this.receivedItems.length === itemsToRemove.length) {
                  break;
                }
              }
            }
          },
          error => {
            this.generalErrorMessage = 'Ocurrió un error al consultar la información de la órden en SAP. Por favor espera un momento o comunícate con el departamento de sistemas.';
            console.error(error);
            const errorResponse = <any>error;
            if (errorResponse !== null) {
              console.error(errorResponse._body);
            }
          }
        );
        this.loadOrderUDF(params['docNum']);
      }
    });
  }

  public loadOrderUDF(order) {
    this._purchaseOrdersService.loadOrderUDF(order).subscribe(
      response => {
        this.selectedTransport = response.transp;
        this.dateEmbarq = response.fembarque;
        this.selectedTermNeg = response.termNeg;
        this.selectedModTransp = response.modTranp;
        this.selectedPuertoDest = response.puertDes;
        this.selectedStatusOC = response.estOC;
        this.selectedEmb = response.embarc;
        this.docBL = response.docTras;
        this.dateEntComex = response.fdocTras;
        this.dateArribPuert = response.farribPuert;
        this.dateArribAlm = response.farribAlm;
        this.selectedEmp = response.tipoEmp;
        this.newNotes = response.observ;
        this.selectedPuertEmb = response.puertEmb;
        this.transpTerr = response.transpTerr;
        this.dateArribCed = response.farriboCed;
        this.cantCont = response.cantCont;
        this.cbm = response.cbm;
        this.dateCargList = response.fcargaList;
        this.tiempTrans = response.tiempTrans;
        this.dateSalPuert = response.fsalPuert;
        this.tiempPuert = response.tiempPuert;
        this.tiempEntreg = response.tiempEntComex;
        this.dateConfBooking = response.fbooking;
        this.tiempEspBooking = response.tiempEspBooking;
        this.dateEstEmb = response.festimEmb;
        this.dateRecDocFin = response.frecDocFin;
        this.emisionBLDest = response.emisBL;
        this.selectedInspPuerto = response.insp;
        this.dateEstArribCed = response.farribCedEst;
        this.selectedNotifBL = response.notifBL;
        this.liqComex = response.liqComex;
        this.dateLiq = response.fliq;
        this.dateLibBL = response.flibBL;
        this.conductor = response.conduct;
        this.cedCond = response.cedulCond;
        this.placVeh = response.placa;
        this.contenedor = response.contened;
        this.precinto = response.precint;
        this.selectedEnvDatCond = response.enviarDatos;
        this.selectedAnalistComex = response.vendedor;
      }, error => {
        this.redirectIfSessionInvalid(error);
        console.error(error);
      }
    );
  }

  public updateUDF() {
    this.generalErrorMessage = '';
    $('#confirmation_udf').modal('hide');
    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });

    let UserFieldDTO = {
      'transp': this.selectedTransport,
      'fembarque': this.dateEmbarq,
      'termNeg': this.selectedTermNeg,
      'modTranp': this.selectedModTransp,
      'puertDes': this.selectedPuertoDest,
      'estOC': this.selectedStatusOC,
      'embarc': this.selectedEmb,
      'docTras': this.docBL,
      'fdocTras': this.dateEntComex,
      'farribPuert': this.dateArribPuert,
      'farribAlm': this.dateArribAlm,
      'tipoEmp': this.selectedEmp,
      'observ': this.newNotes,
      'puertEmb': this.selectedPuertEmb,
      'transpTerr': this.transpTerr,
      'farriboCed': this.dateArribCed,
      'cantCont': this.cantCont,
      'cbm': this.cbm,
      'fcargaList': this.dateCargList,
      'tiempTrans': this.tiempTrans,
      'fsalPuert': this.dateSalPuert,
      'tiempPuert': this.tiempPuert,
      'tiempEntComex': this.tiempEntreg,
      'fbooking': this.dateConfBooking,
      'tiempEspBooking': this.tiempEspBooking,
      'festimEmb': this.dateEstEmb,
      'frecDocFin': this.dateRecDocFin,
      'emisBL': this.emisionBLDest,
      'insp': this.selectedInspPuerto,
      'farribCedEst': this.dateEstArribCed,
      'notifBL': this.selectedNotifBL,
      'liqComex': this.liqComex,
      'fliq': this.dateLiq,
      'flibBL': this.dateLibBL,
      'conduct': this.conductor,
      'cedulCond': this.cedCond,
      'placa': this.placVeh,
      'contened': this.contenedor,
      'precint': this.precinto,
      'enviarDatos': this.selectedEnvDatCond,
      'vendedor': this.selectedAnalistComex,
      'docNum': this.order.docNum
    }

    this._purchaseOrdersService.updateOrderUDF(UserFieldDTO).subscribe(
      response => {
        if (response.code === 0) {
          $('#modal_transfer_process').modal('hide');
          this._router.navigate(['/purchase-orders']);
        } else {
          $('#modal_transfer_process').modal('hide');
          this.generalErrorMessage = 'Lo sentimos. Se produjo un error interno.';
        }
      }, error => {
        this.redirectIfSessionInvalid(error);
        $('#modal_transfer_process').modal('hide');
        console.error(error);
      }
    );
  }

  public scanItem() {
    this.editingQuantity = false;
    this.errorMessage = '';
    this.processingItem = null;
    console.log('validando articulo ' + this.scannedText);
    if (this.scannedText == null || this.scannedText.trim().length == 0) {
      this.scannedText = '';
      return;
    }
    this.scannedText = this.scannedText.replace(/\s/g, '');
    for (let i = 0; i < this.order.lines.length; i++) {
      const line = this.order.lines[i];
      if (line.itemCode.toLowerCase() === this.scannedText.toLowerCase() && line.quantity > 0) {
        //mostrar modal de cantidad
        console.log('el item existe, solicitando cantidad para validar');
        this.scannedText = '';
        this.processingItem = new PurchaseOrderLine(line.docNum, line.itemCode.trim(), line.itemName, line.quantity, line.lineNum);
        this.processingItem.partial = line.partial;
        this.processingItemIndex = i;
        $('#modal_quantity').modal('show');
        return;
      }
    }
    //Si llega hasta aca, es porque la referencia no se encuentra en la orden de compra
    this.errorMessage = 'La referencia ingresada no se encuentra en la orden o no tiene cantidad pendiente por recibir';
    console.log('la referencia ' + this.scannedText + ' no se encuentra en la orden o no tiene cantidad pendiente por recibir');
  }

  public confirmItem() {
    this.quantityErrorMessage = null;
    console.log('validando cantidad para agregar item');
    this.errorMessage = '';
    if (this.quantity === this.processingItem.quantity) {
      $('#modal_quantity').modal('hide');
      console.log('cantidad aceptada');
      this.processingItem.partial = false;
      if (this.received.has(this.processingItem.itemCode)) {
        //Completar item recibido parcialmente
        this.receivedItems[this.received.get(this.processingItem.itemCode.trim())].quantity += this.processingItem.quantity;
        this.receivedItems[this.received.get(this.processingItem.itemCode.trim())].partial = false;
      } else {
        //Agregar item completo
        this.receivedItems.push(this.processingItem);
        this.received.set(this.processingItem.itemCode.trim(), this.receivedItems.length - 1);
      }
      this.order.lines.splice(this.processingItemIndex, 1);
      this.cleanAndSave();
    } else if (this.quantity < this.processingItem.quantity) {
      $('#modal_quantity').modal('hide');
      $('#modal_warning').modal('show');
    } else {
      console.log('la cantidad ingresada es superior a la cantidad de la orden');
      this.quantityErrorMessage = 'La cantidad ingresada es superior a la cantidad de la orden. ';
    }
  }

  public confirmItemPartial() {
    $('#modal_warning').modal('hide');
    console.log('cantidad PARCIAL aceptada');
    this.processingItem.quantity = this.quantity;
    this.processingItem.partial = true;

    this.order.lines[this.processingItemIndex].quantity = this.order.lines[this.processingItemIndex].quantity - this.quantity;
    if (this.order.lines[this.processingItemIndex].quantity > 0) {
      this.order.lines[this.processingItemIndex].partial = true;
    } else {
      this.order.lines[this.processingItemIndex].partial = false;
    }

    if (this.received.has(this.processingItem.itemCode)) {
      //el item ha sido recibido parcialmente
      this.receivedItems[this.received.get(this.processingItem.itemCode)].quantity += this.processingItem.quantity;
    } else {
      //el item no se ha recibido
      this.receivedItems.push(this.processingItem);
      this.received.set(this.processingItem.itemCode.trim(), this.receivedItems.length - 1);
    }

    this.cleanAndSave();
  }

  private cleanAndSave() {
    this.quantity = null;
    this.processingItem = null;
    localStorage.setItem('igb.reception', JSON.stringify(this.receivedItems));
  }

  public confirmReception() {
    this.generalErrorMessage = null;
    console.log('aqui se debe invocar el ws para crear la entrada');
    this.creatingSAPDocument = true;
    let documentLines = [];
    for (let i = 0; i < this.receivedItems.length; i++) {
      let line = {
        docLine: this.receivedItems[i].lineNum,
        itemCode: this.receivedItems[i].itemCode.trim(),
        quantity: this.receivedItems[i].quantity
      };
      documentLines.push(line);
    }
    let document = {
      cardCode: this.order.cardCode,
      docEntry: this.order.docEntry,
      lines: documentLines
    };
    console.log('enviando objeto para crear documento');
    console.log(document);
    this._purchaseOrdersService.createDocument(document).subscribe(
      response => {
        this.creatingSAPDocument = false;
        $('#modal_confirm_reception').modal('hide');
        if (response.code === 0) {
          localStorage.removeItem('igb.reception');
          this._router.navigate(['/purchase-orders']);
        } else {
          this.generalErrorMessage = response.content;
        }
      }, error => { console.error(error); }
    );
  }

  public restart() {
    //TODO: solicitar confirmacion para reiniciar recepcion
    this.received = new Map<String, number>();
    this.receivedItems = new Array<PurchaseOrderLine>();
    localStorage.removeItem('igb.reception');
    this.loadSelectedOrder();
  }

  public modificarRecibido(i) {
    this.editingQuantity = true;
    this.editingPosition = i;
    this.processingItem = this.receivedItems[i];
    this.quantity = this.processingItem.quantity;
    $('#modal_quantity').modal('show');
  }

  public eliminarItem() {
    if (this.editingPosition >= 0) {
      this.receivedItems.splice(this.editingPosition, 1);
      this.received.delete(this.processingItem.itemCode.trim());
      this.editingPosition = -1;
      this.editingQuantity = false;
      this.processingItem = null;
      this.quantity = 0;
      $('#modal_quantity').modal('hide');
      localStorage.setItem('igb.reception', JSON.stringify(this.receivedItems));
    }
  }

  private redirectIfSessionInvalid(error) {
    if (error && error.status && error.status == 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

  public getScrollTop() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }
}