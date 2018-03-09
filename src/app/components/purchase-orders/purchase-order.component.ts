import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../services/user.service';
import { PurchaseOrdersService } from '../../services/purchase-orders.service';
import { PurchaseOrder } from '../../models/purchase-order';
import { PurchaseOrderLine } from '../../models/purchase-order-line';

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
  public displayType: string = 'table';
  private processingItemIndex: number = 0;
  public creatingSAPDocument: boolean = false;
  public editingQuantity: boolean = false;
  private editingPosition: number = -1;
  private received: Map<String, number>;

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
            if (errorResponse != null) {
              console.error(errorResponse._body);
            }
          }
        );
      }
    });
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
    for (let i = 0; i < this.order.lines.length; i++) {
      let line = this.order.lines[i];
      if (line.itemCode.toLowerCase() === this.scannedText.toLowerCase() && line.quantity > 0) {
        //mostrar modal de cantidad
        console.log('el item existe, solicitando cantidad para validar');
        this.scannedText = '';
        this.processingItem = new PurchaseOrderLine(line.docNum, line.itemCode, line.itemName, line.quantity, line.lineNum);
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
      //TODO: validar item parcial
      console.log('cantidad aceptada');
      this.receivedItems.push(this.processingItem);
      this.received.set(this.processingItem.itemCode, this.receivedItems.length - 1);
      this.order.lines.splice(this.processingItemIndex, 1);
      this.quantity = null;
      localStorage.setItem('igb.reception', JSON.stringify(this.receivedItems));
      this.processingItem = null;
    } else if (this.quantity < this.processingItem.quantity) {
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
    this.order.lines[this.processingItemIndex].partial = true;

    //TODO: validar item parcial
    if (this.received.has(this.processingItem.itemCode)) {
      //el item ha sido recibido parcialmente
      this.receivedItems[this.received.get(this.processingItem.itemCode)].quantity += this.processingItem.quantity;
    } else {
      //el item no se ha recibido parcialmente
      this.receivedItems.push(this.processingItem);
      this.received.set(this.processingItem.itemCode, this.receivedItems.length - 1);
    }

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
        itemCode: this.receivedItems[i].itemCode,
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
      this.received.delete(this.processingItem.itemCode);
      this.editingPosition = -1;
      this.editingQuantity = false;
      this.processingItem = null;
      this.quantity = 0;
      $('#modal_quantity').modal('hide');
      localStorage.setItem('igb.reception', JSON.stringify(this.receivedItems));
    }
  }

  public toggleDisplayType() {
    if (this.displayType === 'table') {
      this.displayType = 'grid';
    } else {
      this.displayType = 'table';
    }
  }
}
