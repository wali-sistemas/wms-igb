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
  public assignableUsers: Array<any>;
  public selectedUser: string = '';
  public validSelectedDelivery: boolean = true;
  public validSelectedUser: boolean = true;
  public pickedItemCodeValidated: boolean = false;
  public confirmingItemQuantity: boolean = false;
  public confirmingItem: boolean = true;
  public detailItemsDelivery: Array<PickingListExpress>;
  public pickedItemCode: string = '';
  public pickedItemQuantity: number;
  public activeBtnConfig: boolean = true;
  public nextBinType: string;
  public nextItemQuantity: number;
  public nextItemCode: string;
  public nextIdPickingExpress: number;
  public nextOrderDelivery: string;
  public nextItemName: string;
  public nextLineNum: number;
  public nextOrderNumber: string;
  public nextTypeOrderNumber: string;
  public nextBinLocationCode: string;

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
    this.warningMessageNoOrders = '';
    this._deliveryService.getNextPickingItem(empIdSet, deliveryOrder).subscribe(
      response => {
        if (response.code == 1) {
          this.warningMessageNoOrders = response.content;
          this.resetForm();
          this.activeBtnConfig = true;
          this.selectedDelivery = '';
          this.selectedUser = '';
        } else if (response.code == 0) {
          this.detailItemsDelivery = response.content;
          this.nextBinLocationCode = this.detailItemsDelivery[0].binCode;
          this.nextItemQuantity = this.detailItemsDelivery[0].qty;
          this.nextItemCode = this.detailItemsDelivery[0].itemCode;
          this.nextItemName = this.detailItemsDelivery[0].itemName;
          this.nextOrderDelivery = this.detailItemsDelivery[0].docNum;
          this.nextBinType = this.detailItemsDelivery[0].binType;
          this.nextIdPickingExpress = this.detailItemsDelivery[0].idPickingExpress;
          this.nextLineNum = this.detailItemsDelivery[0].lineNum;
          this.nextOrderNumber = this.detailItemsDelivery[0].orderNum;
          this.nextTypeOrderNumber = this.detailItemsDelivery[0].whsCode == '30' ? 'MODULA' : 'CEDI';

          this.confirmingItemQuantity = true;
        } else {
          this.errorMessagePickingCarts = response.content;
        }
      },
      error => {
        this.errorMessagePickingCarts = "Lo sentimos. Se produjo un error interno."
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
      },
      error => {
        this.redirectIfSessionInvalid(error);
        console.error(error);
      }
    );
  }

  public startPickingListExprees() {
    this.errorMessageBinLocation = '';
    this.errorMessageNextItem = '';
    this.errorMessagePickingCarts = '';

    $('#modal_assign_delivery').modal('hide');
    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });
    if (this.selectedDelivery == null || this.selectedDelivery.length <= 0) {
      this.validSelectedDelivery = false;
      return;
    }
    if (this.selectedUser == null || this.selectedUser.length <= 0) {
      this.validSelectedUser = false;
      return;
    }

    this._deliveryService.getAssignEmployeePickListExpress(this.selectedDelivery, this.selectedUser).subscribe(
      response => {
        if (response.content == true) {
          this.nextItemToPickListExpress(this.selectedUser, this.selectedDelivery);
          this.activeBtnConfig = false;
          document.getElementById("location").style.display = "block";
          $('#binLoc').focus();
        } else {
          this.errorMessageNextItem = 'Ocurrio un error al asignar entrega';
        }
        $('#modal_transfer_process').modal('hide');
      },
      error => {
        $('#modal_transfer_process').modal('hide');
        this.redirectIfSessionInvalid(error);
        console.error(error);
      }
    );
  }

  public scanBinLocation() {
    this.errorMessageBinLocation = '';
    this.confirmingItemQuantity = false;
    this.confirmBinCode = this.confirmBinCode.trim();
    if (this.confirmBinCode !== this.nextBinLocationCode) {
      this.errorMessageBinLocation = 'No estás en la ubicación correcta. Revisa el número e intenta de nuevo.';
      return;
    }
    document.getElementById("item").style.display = "block";
    $('#input_pickedItem').focus();
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
        this.warningMessageNoOrders = "No se encontraron entregas asignadas para picking list express.";
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
      document.getElementById("qty").style.display = "block";
      $('#input_pickedQuantity').focus();
    }
  }

  public validatePickedQuantity() {
    if (this.nextItemQuantity != this.pickedItemQuantity) {
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
    $('#modal_confirm_quantity_diff').modal('hide');
    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });

    const pickingListExpressDTO = {
      "idPickingExpress": this.nextIdPickingExpress,
      "docNum": this.nextOrderDelivery,
      "lineNum": this.nextLineNum,
      "itemCode": this.nextItemCode,
      "qtyConfirm": this.pickedItemQuantity,
      "observation": "Prueba sistemas",
      "orderNum": this.nextOrderNumber,
      "typeOrderNum": this.nextTypeOrderNumber
    }

    this._deliveryService.checkItemPickListExpress(pickingListExpressDTO).subscribe(
      response => {
        if (response.code === 0) {
          this.resetForm();
          this.startPickingListExprees();
          $('#modal_transfer_process').modal('hide');
        } else {
          $('#modal_transfer_process').modal('hide');
          this.errorMessagePickingCarts = response.content;
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
    this.pickedItemCodeValidated = false;
    this.confirmingItemQuantity = false;
    this.confirmingItem = true;
    this.pickedItemQuantity = null;
    this.pickedItemCode = '';
    this.nextBinLocationCode = null;
    this.nextItemCode = '';
    this.nextItemName = '';
    this.nextItemQuantity = null;
    this.nextBinType = '';
    this.confirmBinCode = '';
    document.getElementById("qty").style.display = "none";
    document.getElementById("item").style.display = "none";
    document.getElementById("location").style.display = "none";
  }
}
