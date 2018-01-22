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

  constructor(private _stockTransferService: StockTransferService, private _inventoryService: InventoryService) {
  }

  ngOnInit() {
    console.log('iniciando componente de inventario');
    //Buscar si hay un conteo iniciado
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
      itemCode: this.item,
      quantity: this.quantity
    }

    this.item = '';
    this.quantity = null;

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
}
