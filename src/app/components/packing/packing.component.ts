import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { GLOBAL } from '../../services/global';

import { PackingBox } from '../../models/packing-box';
import { PackingRecord } from '../../models/packing-record';
import { Printer } from '../../models/printer';

import { UserService } from '../../services/user.service';
import { PackingService } from '../../services/packing.service';
import { InvoiceService } from '../../services/invoice.service';
import { PrintService } from '../../services/print.service';
import { GenericService } from '../../services/generic';
import { ReportService } from '../../services/report.service';
import { HealthchekService } from '../../services/healthchek.service';
import { CubicService } from '../../services/cubic.service';
import { MotorepuestoService } from '../../services/motorepuesto.service';

import 'rxjs/Rx'

declare var $: any;

@Component({
  templateUrl: './packing.component.html',
  styleUrls: ['./packing.component.css'],
  providers: [UserService, PackingService, InvoiceService, PrintService, GenericService, ReportService, HealthchekService, CubicService, MotorepuestoService]
})
export class PackingComponent implements OnInit {
  public urlShared: string = GLOBAL.urlShared;
  public processDeliveryStatus: string = 'none';
  public processClosePackingOrderStatus: string = 'none';
  public processPrintLabelsStatus: string = 'none';
  public processInvoiceStatus: string = 'none';
  public processOrderLinkStatus: string = 'none';
  public selectedPrinter: string = '';
  public deliveryErrorMessage: string = '';
  public itemCodeErrorMessage: string = '';
  public quantityErrorMessage: string = '';
  public binErrorMessage: string = '';
  public binCode: string = '';
  public itemCode: string = '';
  public itemName: string = '';
  public dscripction: string = '';
  public selectedCustomer: string = '';
  public selectedOrderByInvoice: string = '';
  public errorMessage: string;
  public errorMessageModal: string;
  public warnMessageOrdersByInvoice: string;
  public exitMessage: string;
  public selectedOrder: number = 0;
  public qtyBox: number = null;
  public boxTotal: number = 0;
  public expectedItemQuantity: number;
  public itemQuantity: number;
  public orderNumber: number;
  public idPackingList: number;
  public idPackingOrder: number;
  public picked: number;
  public docEntryDelivery: number;
  public docEntryInvoice: number;
  public idCubic: number;
  public isVisibleItemCode: boolean = false;
  public addNewBoxEnabled: boolean = false;
  public customersListDisabled: boolean = false;
  public packingOrdersComplete: boolean = false;
  public autoBox: boolean = false;
  public disabledAutoBox: boolean = false;
  public ordersList: Array<number>;
  public customersList: Array<any>;
  public orderItemsList: Array<any>;
  public specialPacking: Array<any>;
  public ordersByInvoice: Array<any>;
  public usedBoxesList: Array<PackingBox>;
  public boxes: Array<PackingBox>;
  public printersList: Array<Printer>;
  public selectedBox: PackingBox = new PackingBox();
  public selectedBoxItems: Map<string, number> = this.selectedBox.items;
  public selectedSalesPerson: string;
  public salesPersonList: Array<any>;
  public identity;
  //Variables creadas para la session de impresión
  public schema: string = '';
  public currentUser: string = '';
  public histLoaded = false;
  public prevSessions: any[] = [];
  public prevSessionsCount = 0;
  public prevTotalBoxes = 0;
  public prevLastAt = '';
  public prevLastUser = '';
  public prevLastPrinter = '';
  public lastHistoryForOrder: number = null;

  constructor(private _userService: UserService, private _packingService: PackingService, private _invoiceService: InvoiceService, private _printService: PrintService, private _router: Router, private _generic: GenericService, private _reportService: ReportService, private _healthchekService: HealthchekService, private _cubicService: CubicService, private _motorepuestoService: MotorepuestoService) {
    this.start();
  }

  private start() {
    this.customersList = new Array<any>();
    this.ordersList = new Array<any>();
    this.orderItemsList = new Array<any>();
    this.boxes = new Array<PackingBox>();
    this.selectedBox = new PackingBox();
    this.selectedBoxItems = this.selectedBox.items;
    this.selectedCustomer = '';
    this.selectedOrder = 0;
    this.specialPacking = new Array<any>();
    this.ordersByInvoice = new Array<any>();
    this.salesPersonList = new Array<any>();
    this.selectedSalesPerson = '';
  }

  ngOnInit() {
    this.identity = this._userService.getItentity();
    if (this.identity === null) {
      this._router.navigate(['/']);
    }
    $('#modal_quantity').on('shown.bs.modal', function () {
      $('#quantity').focus();
    });
    this.loadCustomers();
    this.listOpenJobs();
    this.isPackingComplete();

    this.schema = this.identity.selectedCompany;
    this.currentUser = this.identity.username;
  }

  public onOrderBlur() {
    this.histLoaded = false;
    this.prevSessions = [];
    this.prevSessionsCount = 0;
    this.prevTotalBoxes = 0;
    this.prevLastAt = '';
    this.prevLastUser = '';
    this.prevLastPrinter = '';
    if (typeof this.lastHistoryForOrder !== 'undefined') {
      this.lastHistoryForOrder = null;
    }

    if (this.orderNumber == null || this.orderNumber <= 0) {
      this.histLoaded = true;
      return;
    }

    this._invoiceService.getPrinterSessions(Number(this.orderNumber), this.identity.selectedCompany).subscribe(
      response => {
        if (response && response.code === 0) {
          const list = response.content || [];
          this.prevSessions = list;
          this.prevSessionsCount = list.length;

          if (list.length > 0) {
            let total = 0;
            for (let i = 0; i < list.length; i++) {
              total += Number(list[i].u_box_qty) || 0;
            }
            this.prevTotalBoxes = total;
            const last = list[0];
            this.prevLastAt = last.u_created_at ? new Date(last.u_created_at).toLocaleString() : '';
            this.prevLastUser = last.u_username ? last.u_username : 'N/D';
            this.prevLastPrinter = last.u_printer_name ? last.u_printer_name : 'N/D';

            if (typeof this.lastHistoryForOrder !== 'undefined') {
              this.lastHistoryForOrder = this.orderNumber;
            }
          }
        } else {
          console.warn('Historial de impresión no disponible:', response ? response.content : 'Respuesta vacía');
        }
        this.histLoaded = true;
      },
      error => {
        console.error('Ocurrió un error consultando historial de impresión.', error);
        this.histLoaded = true;
      }
    );
  }

  public confirmReprint() {
    $('#confirm_reprint').modal('hide');
    $('#modal_transfer_process').modal({ backdrop: 'static', keyboard: false, show: true });
    this._printAndLog();
  }

  public cancelReprint() {
    $('#confirm_reprint').modal('hide');
  }

  private _printAndLog() {
    const payload = {
      u_order_num: Number(this.orderNumber),
      u_box_qty: Number(this.qtyBox),
      u_printer_name: this.selectedPrinter,
      u_username: this.currentUser
    };

    const RePrintDTO = {
      orderNumber: this.orderNumber,
      boxNumber: this.qtyBox,
      printerName: this.selectedPrinter,
      assigBoxInvoice: this.autoBox
    };

    //Imprimir
    this._printService.reprintOrder(RePrintDTO).subscribe(
      response => {
        if (response.code == 0) {
          this._invoiceService.insertPrinterSession(this.identity.selectedCompany, payload).subscribe(
            response => {
              $('#modal_transfer_process').modal('hide');
              this.exitMessage = 'Reimprimiendo las etiquetas exitosamente.';
            },
            error => {
              console.error('Error registrando la sesión de impresión:', error);
              $('#modal_transfer_process').modal('hide');
              this.exitMessage = 'Impresión exitosa (no se pudo registrar el log).';
            }
          );
        } else {
          $('#modal_transfer_process').modal('hide');
          this.errorMessage = response.content || 'Error en la impresión.';
        }
      },
      error => {
        $('#modal_transfer_process').modal('hide');
        this.errorMessage = 'Lo sentimos. Se produjo un error interno.';
        console.error('Ocurrió un error re-imprimiendo las etiquetas de empaque.', error);
      }
    );
  }

  private listSalesPersonActive() {
    this._generic.listSalesPersonActive().subscribe(
      response => {
        this.salesPersonList = response;
      }, error => {
        console.error(error);
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  private listOpenJobs() {
    this._packingService.listOpenJobRecords(this.identity.username).subscribe(
      response => {
        if (response.content.length > 0) {
          this.customersListDisabled = true;
          const firstRecord = response.content[0];
          this.selectedOrder = firstRecord[2];
          this.selectedCustomer = firstRecord[3];
          this.idPackingList = firstRecord[1];
          this.idPackingOrder = firstRecord[6];
          for (let i = 0; i < response.content.length; i++) {
            const record = response.content[i];
            if (this.boxes.length < record[12]) {
              //Si hay que agregar la caja
              const box = new PackingBox();
              box.boxDisplayName = 'Caja #' + record[12];
              box.boxNumber = record[12];
              box.addItem(record[7], record[9]);
              this.boxes.push(box);
            }
          }
          this.loadCustomerOrders();
        }
        this.showAllItems();
      }, error => { console.error('Ocurrio un error procesando ítems para packing.', error); }
    );
  }

  private redirectIfSessionInvalid(error) {
    if (error && error.status && error.status == 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

  private loadCustomers() {
    this._packingService.listCustomers().subscribe(
      response => {
        this.customersList = response.content;
      },
      error => {
        console.error("ocurrio un error listando los cliente. ", error);
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public loadCustomerOrders() {
    this.errorMessage = '';
    this.exitMessage = '';
    this._packingService.listCustomerOrders(this.selectedCustomer).subscribe(
      response => {
        this.ordersList = response.content;
      },
      error => { console.error('ocurrio un error al consultar las ordenes del cliente. ', error); }
    );
    this.orderItemsList = new Array<any>();
  }

  public validateItemQuantity() {
    this.errorMessage = '';
    this.errorMessageModal = '';

    if (this.itemQuantity == null || this.itemQuantity <= 0 || this.qtyBox == null || this.qtyBox < 0) {
      this.errorMessageModal = 'Debe ingresar todos los campos obligatorios.'
      this.getScrollTop();
      return;
    }
    if (this.picked < this.itemQuantity) {
      this.errorMessageModal = 'La cantidad ingresada es superior a la cantidad solicitada (' + this.picked + ').';
      this.getScrollTop();
      return;
    } else {
      this.addBox();
      this.addItemToBox();
      $('#cantidad').modal('hide');
    }
  }

  public addBox() {
    if (!this.addNewBoxEnabled) {
      return;
    }
    const newBox: PackingBox = new PackingBox();
    if (this.boxes.length == 0 || this.qtyBox == 0) {
      let box = 0;
      for (let i = 0; i < this.boxes.length; i++) {
        box = this.boxes[i].boxNumber;
      }
      newBox.boxDisplayName = 'Caja #' + (box + 1);
      newBox.boxNumber = box + 1;
      newBox.addItem(this.itemCode, this.itemQuantity);
      this.boxes.push(newBox);
      return;
    }
    newBox.boxDisplayName = 'Caja #' + this.qtyBox;
    newBox.boxNumber = +this.qtyBox;
    newBox.addItem(this.itemCode, this.itemQuantity);
    this.boxes.push(newBox);
  }

  private getUsedBoxesList() {
    this.usedBoxesList = new Array<PackingBox>();
    this._packingService.getBoxPackingList(this.identity.username).subscribe(
      response => {
        for (let i = 0; i < response.content.length; i++) {
          const box = new PackingBox();
          box.boxNumber = response.content[i];
          box.boxDisplayName = 'Caja #' + response.content[i];
          this.usedBoxesList.push(box);
        }
      }, error => { console.error(error); }
    );
  }

  public confirmAddToBox(idx) {
    this.errorMessage = '';
    this.errorMessageModal = '';
    if (idx >= 0) {
      this.addNewBoxEnabled = true;
    } else {
      this.addNewBoxEnabled = false;
    }
  }

  public addItemToBox() {
    const packingRecord = new PackingRecord();
    packingRecord.idPackingList = this.idPackingList;
    packingRecord.binCode = this.binCode;
    packingRecord.itemCode = this.itemCode;
    packingRecord.itemName = this.itemName;
    packingRecord.quantity = this.itemQuantity;

    let countBox = 0;
    for (let i = 0; i < this.boxes.length; i++) {
      countBox = this.boxes[i].boxNumber;
    }
    packingRecord.boxNumber = countBox;
    packingRecord.customerId = this.selectedCustomer;
    packingRecord.orderNumber = this.selectedOrder;
    packingRecord.employee = this.identity.username;
    packingRecord.idPackingOrder = this.idPackingOrder;

    this._packingService.createPackingRecord(packingRecord).subscribe(
      response => {
        if (response.code === 0) {
          this.idPackingList = response.content.idPackingList;
          $('#cantidad').modal('hide');
          this.showAllItems();
        } else {
          this.processDeliveryStatus = 'error';
          this.deliveryErrorMessage = response.content;
          if (response.code == -2) {
            $('#clean_confirmation').modal({
              backdrop: 'static',
              keyboard: false,
              show: true
            });
          }
        }
      }, error => { console.error('Ocurrio un error creando el packing record. ', error); }
    );
  }

  private reset() {
    this.binCode = '';
    this.itemCode = '';
    this.itemName = '';
    this.itemQuantity = null;
    this.isVisibleItemCode = false;
    this.exitMessage = '';
    this.errorMessage = '';
    this.errorMessageModal = '';
    this.orderNumber = null;
    this.qtyBox = null;
    this.clearSessionHistory()
  }

  private isPackingComplete() {
    this._packingService.arePackingOrdersComplete().subscribe(
      response => {
        this.packingOrdersComplete = response.content;
      }, error => { console.error(error); }
    );
  }

  public setIdPackingOrder() {
    for (let i = 0; i < this.ordersList.length; i++) {
      if (this.ordersList[i][1] == this.selectedOrder) {
        this.idPackingOrder = this.ordersList[i][0];
        break;
      }
    }
    this.showAllItems();
  }

  public showAllItems() {
    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });
    this.getUsedBoxesList();
    this.orderItemsList = new Array<any>();
    this._packingService.listOrderItems(this.idPackingOrder, this.selectedOrder).subscribe(
      response => {
        if (response.code === 0) {
          this.start();
          this.exitMessage = response.content;
          this.loadCustomers();
          $('#modal_transfer_process').modal('hide');
        } else if (response.code === 1) {
          this.orderItemsList = response.content;
          $('#modal_transfer_process').modal('hide');
        } else {
          this.errorMessage = response.content;
          this.loadCustomers();
          $('#modal_transfer_process').modal('hide');
        }
      }, error => {
        $('#modal_transfer_process').modal('hide');
        console.error(error);
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public createDelivery() {
    $('#close_confirmation').modal('hide');
    this.processDeliveryStatus = 'inprogress';
    this.processClosePackingOrderStatus = 'none';
    this.processPrintLabelsStatus = 'none';
    this.processInvoiceStatus = 'none';
    this.processOrderLinkStatus = 'none';
    $('#process_status').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });
    this.deliveryErrorMessage = '';
    localStorage.setItem('selectedOrder', JSON.stringify(this.selectedOrder));

    this._packingService.createDelivery(this.idPackingOrder).subscribe(
      response => {
        if (response.code == 0) {
          this.processDeliveryStatus = 'done';
          //cerrando packing
          this.closePackingOrder(this.idPackingOrder, this.identity.username);
          this.idPackingOrder = null;
          this.customersListDisabled = true;
          this.docEntryDelivery = response.content;
          this.closePackingOrder(this.idPackingOrder, this.identity.username);
        } else {
          this.processDeliveryStatus = 'error';
          this.deliveryErrorMessage = response.content;
          if (response.code == -2) {
            $('#process_status').modal('hide');
            $('#clean_confirmation').modal({
              backdrop: 'static',
              keyboard: false,
              show: true
            });
          }
        }
      },
      error => {
        this.processDeliveryStatus = 'error';
        this.deliveryErrorMessage = 'Ocurrió un error al crear el documento de entrega en SAP. ';
        console.error(error);
      }
    );
  }

  public cleanPacking() {
    $('#clean_confirmation').modal('hide');
    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });
    this._packingService.cleanPackingOrder(this.idPackingOrder).subscribe(
      response => {
        $('#modal_transfer_process').modal('hide');
        this._router.navigate(['/']);
      }, error => {
        console.error(error);
        $('#modal_transfer_process').modal('hide');
        this._router.navigate(['/']);
      }
    );
  }

  public loadPrinters() {
    $('#close_confirmation').modal('hide');
    this._printService.listEnabledPrinters().subscribe(
      response => {
        if (response.code == 0) {
          this.printersList = response.content;
          $('#modal_transfer_process').modal('hide');
          $('#printer_selection').modal('show');
        }
      }, error => {
        console.error(error);
        $('#modal_transfer_process').modal('hide');
      }
    );
  }

  private closePackingOrder(idPackingOrder, username) {
    this.processClosePackingOrderStatus = 'inprogress';
    this._packingService.closePackingOrder(idPackingOrder, username).subscribe(
      response => {
        this.processClosePackingOrderStatus = 'done';
        this.reset();
        this.start();
        this.ngOnInit();
      }, error => {
        this.processClosePackingOrderStatus = 'error';
        console.error("Ocurrio un error cerrando el packing.", error);
      }
    );
  }

  public getUrlReport(documento: string, origen: string) {
    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });
    let printReportDTO = {
      "id": JSON.parse(localStorage.getItem('selectedOrder')), "copias": 0, "documento": documento, "companyName": this.identity.selectedCompany, "origen": origen, "imprimir": false
    }
    this._reportService.generateReport(printReportDTO).subscribe(
      response => {
        if (response.code == 0) {
          let landingUrl = this.urlShared + this.identity.selectedCompany + "/" + documento + "/" + JSON.parse(localStorage.getItem('selectedOrder')) + ".pdf";
          window.open(landingUrl);
        }
        $('#modal_transfer_process').modal('hide');
      },
      error => {
        console.error('Ocurrio un error al guardar la lista de empaque.', error);
        $('#modal_transfer_process').modal('hide');
      }
    );
  }

  public openReport(documento: string, origen: string) {
    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });
    if (this.orderNumber != null) {
      let printReportDTO = {
        "id": this.orderNumber, "copias": 0, "documento": documento, "companyName": this.identity.selectedCompany, "origen": origen, "imprimir": false, "filtro": "Orden"
      }
      this._reportService.generateReport(printReportDTO).subscribe(
        response => {
          if (response.code == 0) {
            let landingUrl = this.urlShared + this.identity.selectedCompany + "/" + documento + "/" + this.orderNumber + ".pdf";
            window.open(landingUrl);
          }
          $('#modal_transfer_process').modal('hide');
        },
        error => {
          console.error('Ocurrio un error al guardar la lista de empaque.', error);
          $('#modal_transfer_process').modal('hide');
        }
      );
    }
  }

  public checkOut() {
    this._router.navigate(['/check-out']);
  }

  public modal() {
    this.processDeliveryStatus = 'done';
    this.processClosePackingOrderStatus = 'done';
    this.processInvoiceStatus = 'done';
    this.processOrderLinkStatus = 'done';
    $('#process_status').modal('show');
  }

  public createInvoice() {
    this.deliveryErrorMessage = "";
    this.processInvoiceStatus = 'inprogress';
    this.processOrderLinkStatus = 'none';

    const invoiceExpressDTO = {
      'docNumDelivery': this.docEntryDelivery,
      'slpCode': null
    }

    this._invoiceService.createInvoice(invoiceExpressDTO).subscribe(
      response => {
        if (response.code == 0) {
          this.processInvoiceStatus = 'done';
          this.docEntryInvoice = response.content;
          this.processOrderLinkStatus = 'error';
        } else {
          this.processInvoiceStatus = 'error';
          this.deliveryErrorMessage = response.content + ". Inténtelo creandola desde SAP.";
        }
      },
      error => {
        this.processInvoiceStatus = 'error';
        this.deliveryErrorMessage = "Error creando factura por favor inténtelo mas tarde.";
        console.error("Ocurrio un error al crear la factura.", error);
      }
    );
  }

  public createOrderCubic() {
    this.processOrderLinkStatus = 'inprogress';
    this._cubicService.addOrder(this.docEntryInvoice).subscribe(
      response => {
        this.processOrderLinkStatus = 'done';
        this.idCubic = response.data.respuestas.id;
      }, error => {
        this.processOrderLinkStatus = 'error';
        console.error(error);
      }
    );
  }

  public createPurchaseInvoice(docNum) {
    this._motorepuestoService.postCreatePurchaseInvoice(docNum).subscribe(
      response => {
        console.log(response);
      }, error => { console.error(error); }
    );
  }

  public inProgress() {
    return this.processClosePackingOrderStatus === 'inprogress'
      || this.processDeliveryStatus === 'inprogress'
      || this.processInvoiceStatus === 'inprogress'
      || this.processPrintLabelsStatus === 'inprogress'
      || this.processOrderLinkStatus === 'inprogress';
  }

  public selectItem(orderList: any) {
    this.errorMessage = '';
    this.errorMessageModal = '';
    this.itemCode = orderList[3];
    this.binCode = orderList[0];
    this.picked = orderList[2];
    this.dscripction = orderList[7];

    if (this.picked > 0) {
      this.itemQuantity = null;
      this.qtyBox = null;
      $('#cantidad').modal('show');
      $('#input_packedQuantity').focus();
    }

    this.isVisibleItemCode = true;
    this.customersListDisabled = true;
  }

  public cleanItemTable() {
    this.itemCode = null;
    this.itemName = null;
    this.binCode = null;
    this.itemQuantity = null;
    this.isVisibleItemCode = false;
    this.qtyBox = null;
    this.customersListDisabled = false;
    this.exitMessage = '';
    this.errorMessage = '';
    this.errorMessageModal = '';
    this.nextOrden();
  }

  public selectItemMagicTable(specialPacking: any) {
    this.selectedCustomer = specialPacking[0];
    this.selectedOrder = specialPacking[2];
    this.itemCode = specialPacking[3];
    this.itemName = specialPacking[9];
    this.binCode = specialPacking[5];
    this.idPackingOrder = specialPacking[8];

    this.loadCustomerOrders();

    $('#magicTable').modal('hide');
    $('#cantidad').modal('show');

    this.isVisibleItemCode = true;
  }

  public nextOrden() {
    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });
    this._packingService.cancelPackingOrder(this.idPackingOrder).subscribe(
      response => {
        this.customersListDisabled = false;
        this.ordersList = new Array<any>();
        this.orderItemsList = new Array<any>();
        this.boxes = new Array<PackingBox>();
        this.selectedBox = new PackingBox();
        this.selectedBoxItems = this.selectedBox.items;
        this.selectedCustomer = '';
        this.selectedOrder = 0;
        this.specialPacking = new Array<any>();
        this.errorMessage = '';
        $('#modal_transfer_process').modal('hide');
      }, error => {
        console.error(error);
        $('#modal_transfer_process').modal('hide');
      }
    );
  }

  public expressPack() {
    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });
    this._packingService.listOrderItems(this.idPackingOrder, this.selectedOrder).subscribe(
      response => {
        if (response.content.length > 0) {
          for (let i = 0; i < response.content.length; i++) {
            const packingRecord = new PackingRecord();
            packingRecord.idPackingList = this.idPackingList;
            packingRecord.binCode = response.content[i][0];
            packingRecord.itemCode = response.content[i][3];
            packingRecord.itemName = this.itemName;
            packingRecord.quantity = response.content[i][2];
            packingRecord.boxNumber = 0;/*this.qtyBox;*/
            packingRecord.customerId = this.selectedCustomer;
            packingRecord.orderNumber = this.selectedOrder;
            packingRecord.employee = this.identity.username;
            packingRecord.idPackingOrder = this.idPackingOrder;

            this._packingService.createPackingRecord(packingRecord).subscribe(
              response => {
                if (response.code < 0) {
                  $('#modal_transfer_process').modal('hide');
                  this.errorMessage = "Lo sentimos. Se produjo un error interno."
                  return;
                }
              },
              error => {
                $('#modal_transfer_process').modal('hide');
                this.errorMessage = "Lo sentimos. Se produjo un error interno."
                console.error("Ocurrio un error creando el expressPack.", error);
              }
            );
          }
        } else {
          $('#modal_transfer_process').modal('hide');
          this.errorMessage = 'No hay items pendientes por empacar.';
        }
      }, error => {
        $('#modal_transfer_process').modal('hide');
        console.error("Ocurrio un error listando los ítems para expressPack.", error);
      }
    );
    //TODO: Temporizador temportal de modal en packing
    if (this.orderItemsList.length <= 10) {
      setTimeout(() => {
        $('#modal_transfer_process').modal('hide');
        $('#close_confirmation').modal('show');
      }, 5000);//5seg
    } else {
      setTimeout(() => {
        $('#modal_transfer_process').modal('hide');
        $('#close_confirmation').modal('show');
      }, 10000);//10seg
    }
  }

  public getReprintOrder() {
    this.reset();
    this.printersList = new Array<Printer>();
    $("#reimprimir").modal('show');
    $("#orderNumber").focus();

    this._printService.listEnabledPrinters().subscribe(
      response => {
        if (response.code == 0) {
          this.printersList = response.content;
        }
      }, error => { console.error(error); }
    );

    if (this.identity.selectedCompany.includes('VARROC')) {
      this.disabledAutoBox = true;
    } else {
      this.disabledAutoBox = false;
    }
  }

  public reprintOrder() {
    $("#reimprimir").modal('hide');
    $('#modal_transfer_process').modal({ backdrop: 'static', keyboard: false, show: true });

    if (this.orderNumber == null || this.orderNumber <= 0 ||
      this.qtyBox == null || this.qtyBox <= 0 ||
      this.selectedPrinter == null || this.selectedPrinter.length <= 0) {
      $('#modal_transfer_process').modal('hide');
      this.errorMessage = 'Debe ingresar todos los datos obligatorios.';
      return;
    }
    if (this.qtyBox.toString().length >= 3) {
      $('#modal_transfer_process').modal('hide');
      this.errorMessage = 'Error, demasiadas etiquetas para imprimir.';
      return;
    }

    var companyName = (this.identity && this.identity.selectedCompany) ? this.identity.selectedCompany : 'IGB';

    this._invoiceService.getPrinterSessions(Number(this.orderNumber), companyName)
      .subscribe(
        (checkResp: any) => {
          var prev = (checkResp && checkResp.content) ? checkResp.content : [];

          if (prev.length > 0) {
            var totalBoxes = 0;
            for (var i = 0; i < prev.length; i++) {
              var n = Number(prev[i].u_box_qty);
              if (!isNaN(n)) { totalBoxes += n; }
            }
            var last = prev[0];

            this.prevSessions = prev;
            this.prevSessionsCount = prev.length;
            this.prevTotalBoxes = totalBoxes;
            this.prevLastAt = (last && last.u_created_at) ? new Date(last.u_created_at).toLocaleString() : 'N/D';
            this.prevLastUser = (last && last.u_username) ? last.u_username : 'N/D';
            this.prevLastPrinter = (last && last.u_printer_name) ? last.u_printer_name : 'N/D';

            $('#modal_transfer_process').modal('hide');
            $('#confirm_reprint').modal('show');
            return;
          }

          this._printAndLog();
        },
        (e: any) => {
          console.error('Error consultando sesiones previas:', e);
          $('#modal_transfer_process').modal('hide');
          this.errorMessage = 'No fue posible validar sesiones previas de impresión.';
        }
      );
  }

  public resetSesionId() {
    this.errorMessage = '';
    this.exitMessage = '';
    this.warnMessageOrdersByInvoice = '';
    $('#process_status').modal('hide');
    this.deliveryErrorMessage = "";
    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });
    this._healthchekService.resetSessionId().subscribe(
      response => {
        $('#modal_transfer_process').modal('hide');
        $('#modal_error').modal('hide');
      },
      error => {
        this.errorMessage = "";
        $('#modal_transfer_process').modal('hide');
        console.error("Ocurrio un error al reiniciar los sesion Id", error);
        this.errorMessage = "Ocurrio un error al reiniciar los sesion Id";
      }
    );
  }

  public listOrdersPendingByInvoice() {
    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });

    this.selectedSalesPerson = '';
    this.listSalesPersonActive();

    this.warnMessageOrdersByInvoice = '';
    this.errorMessage = '';
    this.exitMessage = '';
    this.ordersByInvoice = new Array<any>();

    this._packingService.findOrdersPendingByInvoice().subscribe(
      response => {
        if (response.code == 0) {
          $('#modal_delivery_pending').modal('show');
          this.ordersByInvoice = response.content;
          if (this.ordersByInvoice.length <= 0) {
            this.warnMessageOrdersByInvoice = 'No se encontraron ordenes para facturar.';
          }
          $('#modal_transfer_process').modal('hide');
        } else {
          this.warnMessageOrdersByInvoice = 'Ocurrio un error listando las ordenes.';
          $('#modal_transfer_process').modal('hide');
        }
      }, error => {
        console.error("Ocurrio un error listando las ordenes pendientes por factuar.", error);
        $('#modal_transfer_process').modal('hide');
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public createInvoiceByDelivery(i) {
    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });

    const invoiceExpressDTO = {
      'docNumDelivery': this.ordersByInvoice[i][0],
      'slpCode': this.selectedSalesPerson
    }

    this._invoiceService.createInvoice(invoiceExpressDTO).subscribe(
      response => {
        if (response.code == 0) {
          this.exitMessage = "Factura #[" + response.content + "] creada éxitosamente.";

          //TODO: Solo se crea factura de compra cuando el cliente es Motorepuesto.com
          if (this.ordersByInvoice[i][6] == 'C900998242') {
            this.createPurchaseInvoice(response.content);
          }

          $('#modal_transfer_process').modal('hide');
        } else {
          this.errorMessage = response.content;
          $('#modal_transfer_process').modal('hide');
        }
      }, error => {
        console.error("Ocurrio un error creando la factura.", error);
        $('#modal_transfer_process').modal('hide');
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public getScrollTop() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }

  private clearSessionHistory() {
    this.histLoaded = false;
    this.prevSessions = [];
    this.prevSessionsCount = 0;
    this.prevTotalBoxes = 0;
    this.prevLastAt = '';
    this.prevLastUser = '';
    this.prevLastPrinter = '';
    this.lastHistoryForOrder = null;
  }
}
