import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { StockTransferService } from '../../services/stock-transfer.service';
import { InventoryService } from '../../services/inventory.service';

declare var $: any;

@Component({
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css'],
  providers: [StockTransferService, InventoryService]
})
export class InventoryComponent implements OnInit {

  public idInventory: number;
  public quantity: number;
  public messageError: string;
  public messageInfo: string;
  public location: string;
  public item: string;
  public itemTmp: any;
  public itemVisible: any;
  public differences: Array<any>;
  public history: Array<any>;

  constructor(private _stockTransferService: StockTransferService, private _inventoryService: InventoryService) {
    this.itemTmp = {
      idInventory: null,
      item: null,
      quantity: null
    };
    this.itemVisible = this.itemTmp;
    this.differences = new Array<any>();
    this.history = new Array<any>();
  }

  ngOnInit() {
    console.log('iniciando componente de inventario');
    //Buscar si hay un conteo iniciado
    this.validateInventoryOpen();
  }

  public validateInventoryOpen() {
    this._inventoryService.inventoryOpen('01').subscribe(
      response => {
        console.log(response);
        if (response !== -1) {
          this.idInventory = response.id;
          this.location = response.location;
        }
      }, error => {
        console.log(error);
      }
    );
  }

  public preparateCreateInventory() {
    console.log('Se abrira un nuevo inventario');
    if (!this.location || this.location === null || this.location.length === 0) {
      this.messageError = 'Se debe ingresar una ubicación para empezar el inventario.';
      return;
    }

    $('#modalConfirmacion').modal('show');
  }

  public createInventory() {
    this._stockTransferService.openInventory('01', this.location).subscribe(
      response => {
        console.log(response);
        if (response === -1) {
          this.messageError = 'No fue posible iniciar el inventario solicitado.';
          console.log('No fue posible iniciar el inventario solicitado.');
        } else {
          this.idInventory = response.content.id;
          $('#modalConfirmacion').modal('hide');
          this.messageInfo = 'Se creo correctamente el inventario';
        }
      }, error => {
        this.messageError = 'No fue posible iniciar el inventario solicitado.';
        console.log(error);
      }
    );
  }

  public addItem() {
    if (!this.item || this.item === null || this.item.length === 0) {
      this.messageError = 'Debe escanear un ítem para agregarlo al inventario';
      return;
    }
    if (!this.quantity || this.quantity === null || this.quantity === 0) {
      this.quantity = 1;
    }

    this.itemVisible = {
      idInventory: this.idInventory,
      item: this.item,
      quantity: this.quantity
    }

    this.item = '';
    this.quantity = null;
    this.itemTmp = this.itemVisible;

    console.log(this.itemVisible);
    this.saveAddItem();
  }

  public saveAddItem() {
    this._inventoryService.addItem(this.itemTmp).subscribe(
      response => {
        console.log(response);
      }, error => {

      }
    );
  }

  public inventoryHistory() {
    if (this.history != null && this.history.length > 0) {
      console.log('Cerrando historial');
      this.history = new Array<any>();
    } else {
      console.log('Obteniendo historial');
      this._inventoryService.inventoryHistory('01', this.idInventory).subscribe(
        response => {
          console.log(response);
          if (response !== -1) {
            this.history = response;
          }
        }, error => {
          console.log(error);
        }
      );
    }
  }

  public finishInventory() {
    this._stockTransferService.finishInventory(this.idInventory).subscribe(
      response => {
        console.log(response);
        this.differences = response;
        if (this.differences != null && this.differences.length > 0) {
          $('#modalDiferencias').modal('show');
        }
        console.log(this.differences);
      }, error => {
        console.log(error);
      }
    );
  }

  public cleanData() {
    this.idInventory = null;
    this.quantity = null;
    this.messageError = null;
    this.messageInfo = null;
    this.location = null;
    this.item = null;
    this.itemTmp = null;
    this.itemVisible = null;
    this.differences = new Array<any>();
    $('#modalDiferencias').modal('hide');
  }
}
