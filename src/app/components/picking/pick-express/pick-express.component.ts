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
  public assignableUsersCedi: Array<any>;
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
  public nextObservation: string;
  public nextCountRow: number;
  public validNextObservation: boolean = true;
  public position: number = 1;
  public selectedDeliveryMultiple: string = '';

  constructor(private _userService: UserService, private _router: Router, private _deliveryService: DeliveryService) {
  }

  ngOnInit() {
    $('#selectOrders').selectpicker();
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

  public nextItemToPickListExpress(empIdSet: string, deliveryOrder: string, position: number) {
    this.warningMessageNoOrders = '';
    this._deliveryService.getNextPickingItem(empIdSet, deliveryOrder, position).subscribe(
      response => {
        if (response.code == 1) {
          window.location.reload();
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
          this.nextCountRow = this.detailItemsDelivery[0].countRow;

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

        this.deliveries.forEach((opt: string, index: number) => {
          const truncatedText = opt.toString().length > 30 ? opt.toString().substring(0, 30) + '...|' : opt.toString();
          $('#selectOrders').append($('<option>', {
            value: opt.toString().substring(0, 6),
            text: truncatedText.toString().replace(',', ' ').replace(',', ' ')
          }));
        });
        $('#selectOrders').selectpicker('refresh');

        $('#selectOrders').on('change', () => {
          const obj = $("#selectOrders option:selected").text().replace(',', ' ').split('|');
          this.selectedDeliveryMultiple = obj.filter(item => item.trim() !== '');
        });
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
    this.selectedDelivery = this.selectedDeliveryMultiple;

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

    this._deliveryService.getAssignEmployeePickListExpress(this.selectedUser, this.selectedDelivery).subscribe(
      response => {
        if (response.content == true) {
          if (this.identity.username == this.selectedUser) {
            this.nextItemToPickListExpress(this.selectedUser, this.selectedDelivery, 1);
            this.activeBtnConfig = false;
            document.getElementById("location").style.display = "block";
          } else {
            this.warningMessageNoOrders = "El usuario es diferente al que se le asignó la operación.";
            this.selectedDelivery = '';
          }
        } else {
          this.selectedDelivery = '';
          this.selectedUser = '';
          this.errorMessagePickingCarts = '';
          this.warningMessageNoOrders = '';
          this.errorMessageNextItem = 'Lo sentimos. Se produjo un error interno.';
        }
        $('#modal_transfer_process').modal('hide');
        $('#binLoc').focus();
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
    this.confirmBinCode = this.confirmBinCode.trim();
    if (this.confirmBinCode !== this.nextBinLocationCode) {
      this.errorMessageBinLocation = 'No estás en la ubicación correcta. Revisa el número e intenta de nuevo.';
      return;
    }
    this.confirmingItem = false;
    document.getElementById("location").style.display = "none";
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
    this.assignableUsersCedi = new Array<any>();
    this._userService.listUsersByGroup('WMS').subscribe(
      response => {
        for (let user of response) {
          if (user.organization.includes("Cedi")) {
            this.assignableUsersCedi.push(user);
          }
        }
        this.warningMessageNoOrders = "No se encontraron entregas asignadas.";
      }, error => {
        console.error(error);
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public cleanDataDelivery() {
    this.selectedDelivery = '';
    this.selectedDeliveryMultiple = '';
    this.selectedUser = '';
    this.validSelectedDelivery = true;
    this.validSelectedUser = true;
    this.errorMessagePickingCarts = '';
    this.warningMessageNoOrders = '';
    this.errorMessageNextItem = '';
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
      this.nextObservation = '';
      $('#modal_confirm_quantity_diff').modal({
        backdrop: 'static',
        keyboard: false,
        show: true
      });
    } else {
      this.nextObservation = '';
      this.confirmItemQuantity();
    }
  }

  public confirmItemQuantity() {
    if (this.nextObservation == null || this.nextObservation.length <= 0) {
      this.validNextObservation = false;
      return;
    }

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
      "observation": this.nextObservation,
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

  public getBackItem() {
    if (this.position > 1) {
      this.position--;
    } else if (this.position <= 1) {
      this.position = 1;
    }
    console.log("Posición " + this.position + " de " + this.nextCountRow + " para picking");
    this.nextItemToPickListExpress(this.selectedUser, this.selectedDelivery, this.position);
  }

  public getNextItem() {
    if (this.position < this.nextCountRow - 1) {
      this.position++;
    } else {
      this.position = 1;
    }
    console.log("Posición " + this.position + " de " + this.nextCountRow + " para picking");
    this.nextItemToPickListExpress(this.selectedUser, this.selectedDelivery, this.position);
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

  public deleteBinCode() {
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
    document.getElementById("location").style.display = "block";
    this.nextItemToPickListExpress(this.selectedUser, this.selectedDelivery, 1);
    $('#binLoc').focus();
  }
}
