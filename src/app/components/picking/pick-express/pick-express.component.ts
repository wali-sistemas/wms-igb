import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { DeliveryService } from '../../../services/delivery.service';
import { PickingListExpress } from 'app/models/picking-list-express';

declare var $: any;

@Component({
  templateUrl: './pick-express.component.html',
  styleUrls: ['./pick-express.component.css'],
  providers: [UserService, DeliveryService]
})
export class PickExpressComponent implements OnInit {
  public identity;
  public selectedCompany: string;
  public deliveries: Array<any>;
  public selectedDelivery: string = '';
  public errorMessagePickingCarts: string = '';
  public warningMessageNoOrders: string = '';
  public errorMessageBinLocation: string = '';
  public errorMessageNextItem: string = '';
  public confirmBinCode: string = '';
  public nextBinLocationCode: string;
  public assignableUsers: Array<any>;
  public selectedUser: string = '';
  public validSelectedDelivery: boolean = true;
  public validSelectedUser: boolean = true;
  public pickedItemCodeValidated: boolean = false;
  public confirmingItemQuantity: boolean = false;
  public confirmingItem: boolean = true;
  public detailItemsDelivery: Array<PickingListExpress>;
  public nextBinType: string;
  public nextItemQuantity: number;
  public nextItemCode: string;
  public nextIdPickingExpress: number;
  public nextOrderNumber: string;
  public nextItemName: string;
  public nextLineNum: number;
  public pickedItemCode: string = '';
  public nextBinStock: number;
  public pickedItemQuantity: number;

  constructor(private _userService: UserService, private _router: Router, private _deliveryService: DeliveryService) {
  }

  ngOnInit() {
    this.identity = this._userService.getItentity();
    if (this.identity === null) {
      this._router.navigate(['/']);
    }
    this.selectedCompany = this.identity.selectedCompany;
    this.listAssignableEmployees();
  }

  private redirectIfSessionInvalid(error) {
    if (error && error.status && error.status === 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

  public nextItemToPickListExpress(empIdSet: string, deliveryOrder: string) {
    this._deliveryService.getNextPickingItem(empIdSet, deliveryOrder).subscribe(
      response => {
        this.detailItemsDelivery = response.content;

        console.log("***********************");
        console.log(this.detailItemsDelivery);
        console.log("***********************");

        this.nextBinLocationCode = this.detailItemsDelivery[0].binCode;
        this.nextItemQuantity = this.detailItemsDelivery[0].qty;
        this.nextItemCode = this.detailItemsDelivery[0].itemCode;
        this.nextItemName = this.detailItemsDelivery[0].itemName;
        this.nextOrderNumber = this.detailItemsDelivery[0].docNum;
        this.nextBinType = this.detailItemsDelivery[0].binType;
        this.nextIdPickingExpress = this.detailItemsDelivery[0].idPickingExpress;
        this.nextLineNum = this.detailItemsDelivery[0].lineNum;
        this.confirmingItemQuantity = true;

        document.getElementById("loc").style.display = "hidden";
      },
      error => {
        this.redirectIfSessionInvalid(error);
        console.error(error);
      }
    );
  }

  public listOpenDelivery() {
    this.cleanDataDelivery();
    this._deliveryService.listOpenDelivery().subscribe(
      response => {
        this.deliveries = response.content;
        console.log(this.deliveries);
      },
      error => {
        this.redirectIfSessionInvalid(error);
        console.error(error);
      }
    );
  }

  public startPickingListExprees() {
    if (this.selectedDelivery == null || this.selectedDelivery.length <= 0) {
      this.validSelectedDelivery = false;
      return;
    } else if (this.selectedUser == null || this.selectedUser.length <= 0) {
      this.validSelectedUser = false;
      return;
    }

    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });

    this._deliveryService.getAssignEmployeePickListExpress(this.selectedDelivery, this.selectedUser).subscribe(
      response => {
        console.log("***********************");
        console.log(response);
        console.log("***********************");
        if (response.content == true) {
          this.nextItemToPickListExpress(this.selectedUser, this.selectedDelivery);
          $('#modal_assign_delivery').modal('hide');
          //$('#binLoc').focus();
          $('#modal_transfer_process').modal('hide');
        } else {
          $('#modal_transfer_process').modal('hide');
          console.log('Error al asignar entrega');
        }
      },
      error => {
        $('#modal_transfer_process').modal('hide');
        this.redirectIfSessionInvalid(error);
        console.error(error);
      }
    );
  }

  public scanBinLocation() {
    console.log("Entro al metodo");
    this.errorMessageBinLocation = '';
    this.confirmingItemQuantity = false;
    this.confirmBinCode = this.confirmBinCode.trim();
    if (this.confirmBinCode !== this.nextBinLocationCode) {
      this.errorMessageBinLocation = 'No estás en la ubicación correcta. Revisa el número e intenta de nuevo.';
      return;
    }
    this.confirmingItemQuantity = true;
    this.confirmingItem = false;
    document.getElementById("binLoc").style.display = "none";
    $('#input_pickedItem').focus();

    console.log(this.confirmingItemQuantity);

  }

  public getBinDetail(fieldName: string) {
    if (!this.nextBinLocationCode) {
      return '';
    }
    switch (fieldName) {
      case 'whs':
        return this.nextBinLocationCode.substring(0, 2);
      case 'area':
        return this.nextBinLocationCode.substring(2, 4);
      case 'calle':
        return this.nextBinLocationCode.substring(4, 6);
      case 'mod':
        return this.nextBinLocationCode.substring(6, 8);
      case 'nivel':
        return this.nextBinLocationCode.substring(8, 10);
      case 'fila':
        return this.nextBinLocationCode.substring(10, 12);
      case 'col':
        return this.nextBinLocationCode.substring(12, 14);
      case 'prof':
        return this.nextBinLocationCode.substring(14, 16);
      default:
        return '';
    }
  }

  public listAssignableEmployees() {
    this.assignableUsers = new Array<any>();
    this._userService.listUsersByGroup('WMS').subscribe(
      response => {
        this.assignableUsers = response;
      }, error => {
        console.error(error);
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public cleanDataDelivery() {
    this.selectedDelivery = '';
    this.selectedUser = '';
    this.validSelectedDelivery = true;
    this.validSelectedUser = true;
  }

  public getBinLocation(bin) {
    this.confirmBinCode = bin.trim();
    $('#binLoc').focus();
  }

  public getPickedItemCode(item) {
    this.pickedItemCode = item.trim();
    $('#input_pickedItem').focus();
  }

  public confirmItemCode() {
    this.pickedItemCode = this.pickedItemCode.replace(/\s/g, '');
    if (this.pickedItemCode === this.nextItemCode) {
      this.pickedItemCodeValidated = true;
      //document.getElementById("qty").style.display = "inline";
      $('#input_pickedQuantity').focus();
    }
  }

  public getQuantityToPick() {
    /*if (this.nextItemQuantity > this.nextBinStock) {
      return this.nextBinStock;
    }*/
    return this.nextItemQuantity;
  }

  public validatePickedQuantity() {
    if (this.getQuantityToPick() != this.pickedItemQuantity) {
      //show different quantity confirmation
      $('#modal_confirm_quantity_diff').modal({
        backdrop: 'static',
        keyboard: false,
        show: true
      });
    } else {
      this.confirmItemQuantity();
    }
  }

  public confirmItemQuantity() {
    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });

    const pickingListExpressDTO = {
      "idPickingExpress": this.nextIdPickingExpress,
      "docNum": this.nextOrderNumber,
      "lineNum": this.nextLineNum,
      "itemCode": this.nextItemCode,
      "qtyConfirm": this.pickedItemQuantity,
      "observation": "Prueba sistemas"
    }

    this._deliveryService.checkItemPickListExpress(pickingListExpressDTO).subscribe(
      response => {
        if (response.code === 0) {
          //Clears bin location, item code and quantity fields; then loads cart inventory and next item
          this.resetForm();
          this.startPickingListExprees();
          $('#modal_transfer_process').modal('hide');
        } else {
          $('#modal_transfer_process').modal('hide');
          //this.errorMessageBinTransfer = response.content;
          //$('#modal_error').modal('show');
        }
      },
      error => {
        $('#modal_transfer_process').modal('hide');
        console.error(error);
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public resetForm() {
    this.validSelectedDelivery = true;
    this.validSelectedUser = true;
    this.pickedItemCodeValidated = false;
    this.confirmingItemQuantity = false;
    this.confirmingItem = true;

    //clean picked quantity
    this.pickedItemQuantity = null;
    //this.pickedItemQuantityValidated = false;

    //clean pickedItem
    this.pickedItemCode = '';

    //clean next item/location
    this.nextBinLocationCode = null;
    this.nextBinStock = null;
    this.nextItemCode = '';
    this.nextItemName = '';
    this.nextItemQuantity = null;
    this.nextBinType = '';

    //clean selected location
    this.confirmBinCode = '';

    //reload carts and inventory
    //this.loadAvailablePickingCarts();

    //document.getElementById("qty").style.display = "none";
    //document.getElementById("item").style.display = "none";
    //document.getElementById("loc").style.display = "none";

    //reload next item
    //this.position = 0;
    //if (this.selectedCart <= 0) {
    //  this.loadNextItem();
    //}
  }
}
