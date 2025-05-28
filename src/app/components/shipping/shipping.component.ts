import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { GLOBAL } from '../../services/global';

import { UserService } from '../../services/user.service';
import { ShippingService } from '../../services/shipping.service';
import { ReportService } from '../../services/report.service';

import { ShippingInvoice } from '../../models/shipping-invoice';

import 'rxjs/Rx'
import { Cities } from 'app/models/cities';

declare var $: any;

@Component({
  templateUrl: './shipping.component.html',
  styleUrls: ['./shipping.component.css'],
  providers: [UserService, ShippingService, ReportService]
})
export class ShippingComponent implements OnInit {
  public identity;
  public urlShared: string = GLOBAL.urlShared;
  public warningMessage: string = '';
  public errorMessage: string = '';
  public shippingErrorMessage: string = '';
  public selectedTransp: string = '';
  public selectInvoice: string = '';
  public filter: string = '';
  public idContainer: string = '';
  public docNumPayroll: string = '';
  public transportPayroll: string = '';
  public selectBox: number = 0;
  public qtyPack: number;
  public fullShipping: boolean = false;
  public validQtyPack: boolean = true;
  public validPesoPack: boolean = true;
  public validValorDeclPack: boolean = true;
  public validAddressReceive: boolean = true;
  public validCityReceive: boolean = true;
  public validSelectedTypePack: boolean = true;
  public validDepartamentReceive: boolean = true;
  public invoicesShipping: Array<ShippingInvoice>;
  public selectedInvoices: Map<String, ShippingInvoice>;
  public transports: Array<any>;
  public transPayroll: Array<any>;
  public detailContainer: Array<any>;
  public listContainers: Array<string>;
  public selectInvoicesPack: Array<ShippingInvoice>;
  public selectedTypePack: string = '';
  public pesoPack: number;
  public valorDeclPack: number;
  public addressReceive: string = '';
  public cityReceive: string = '';
  public departamentReceive: string = '';
  public idReceive: string = '';
  public nameReceive: string = '';
  public urlGuia: string = '';
  public urlRotulo: string = '';
  public selectedTypeProduct: string = '';
  public validSelectedTypeProduct: boolean = true;
  public listDestinations: Array<Cities>;
  public listDestinationsByDep: Array<Cities>;
  public selectedCityDest: string = '';
  public selectedCityOrig: string = '';
  public validSelectedCityDest: boolean = true;
  public validSelectedCity: boolean = true;
  public checkSede: boolean = false;
  public valStandDeclMTZ: number;
  public unidEmpStandMTZ: number;
  public guia: string;
  public selectedCompany: string;

  constructor(private _userService: UserService, private _router: Router, private _shippingService: ShippingService, private _reportService: ReportService) {
    this.invoicesShipping = new Array<ShippingInvoice>();
    this.transports = new Array<any>();
    this.transPayroll = new Array<any>();
    this.listContainers = new Array<string>();
    this.selectInvoicesPack = new Array<ShippingInvoice>();
  }

  ngOnInit() {
    this.identity = this._userService.getItentity();
    this.selectedCompany = this.identity.selectedCompany;

    if (this.identity === null) {
      this._router.navigate(['/']);
    }
    this.listInvoices();
    this.listTransport();
    this.listCitiesDestinationsOla();
  }

  private redirectIfSessionInvalid(error) {
    if (error && error.status && error.status == 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

  public listInvoices() {
    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });

    this.errorMessage = '';
    this.warningMessage = '';
    this.invoicesShipping = new Array<ShippingInvoice>();
    this.selectedInvoices = new Map<String, any>();

    //TODO: serie de facturación electronica sobrepasa la cantidad de caracteres
    let invoice = this.filter.trim();
    if (this.filter.includes('-')) {
      if (this.identity.selectedCompany.includes('VARROC')) {
        invoice = this.filter.trim().substring(0, 5);
      } else {
        invoice = this.filter.trim().substring(0, 6);
      }
    }

    const invoiceDTO = { 'transport': this.selectedTransp.length <= 0 ? "*" : this.selectedTransp, 'docNum': invoice }

    this._shippingService.listInvoiceShipping(invoiceDTO).subscribe(
      response => {
        if (response.code == 0) {
          this.invoicesShipping = response.content;
          if (this.invoicesShipping.length <= 0) {
            this.warningMessage = 'No se encontraron facturas para despachar.';
          }
          $('#modal_transfer_process').modal('hide');
          $('#filter').focus();
        } else {
          $('#modal_transfer_process').modal('hide');
          $('#filter').focus();
          this.warningMessage = response.content;
        }
      },
      error => {
        $('#modal_transfer_process').modal('hide');
        console.error('Ocurrio un error al listar las facturas para shipping.', error);
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public selectShippingInvoice(invoice: ShippingInvoice) {
    this.warningMessage = '';
    if (this.selectedInvoices.has(invoice.docNum)) {
      this.selectedInvoices.delete(invoice.docNum);
      this.selectInvoicesPack.splice(this.selectedInvoices.size, 1);
    } else {
      if (this.selectInvoicesPack.length <= 0) {
        //Agreguelo a la creación de guia
        this.selectedInvoices.set(invoice.docNum, invoice);
        this.selectInvoicesPack.push(invoice);
      } else {
        //valide si son misma transportadora para agregar a la creación de guia
        for (let i = 0; i < this.selectInvoicesPack.length; i++) {
          if (this.selectInvoicesPack[i].cardCode === invoice.cardCode && this.selectInvoicesPack[i].transport === invoice.transport) {
            this.selectedInvoices.set(invoice.docNum, invoice);
            this.selectInvoicesPack.push(invoice);
            return;
          }
        }
      }
    }
  }

  public listTransport() {
    this.transports = new Array<any>();
    this._shippingService.listTransport().subscribe(
      response => {
        if (response.code == 0) {
          this.transports = response.content;
        }
      },
      error => {
        console.error('Ocurrio un error listando las transportadoras.', error);
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public addShipping() {
    const shippingDTO = { 'invoice_number': this.selectInvoice, 'box_sum_shipping': this.qtyPack, 'send_to_cedi': this.checkSede }

    this._shippingService.addShipping(shippingDTO).subscribe(
      response => {
        if (response.code < 0) {
          this.warningMessage = response.content;
        }
        this.listInvoices();
        this.clean();
      },
      error => {
        console.error("Ocurrio un error al crear el shipping.", error);
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public openInvoice(invoice: string, box: number) {
    this.selectInvoice = invoice;
    this.selectBox = box;
    $('#modal_select_invoice').modal('show');
    $('#idContainer').focus();
  }

  public addContainer() {
    this.errorMessage = '';
    //TODO: serie de facturación electronica sobrepasa la cantidad de caracteres
    let invoice;
    let caracteres;

    if (this.identity.selectedCompany.includes('VARROC')) {
      invoice = this.idContainer.trim().substring(0, 5);
      caracteres = 9;
    } else {
      invoice = this.idContainer.trim().substring(0, 6);
      caracteres = 10;
    }

    if (this.selectInvoice === invoice) {
      for (let i = 0; i < this.listContainers.length; i++) {
        if (this.listContainers[i] === this.idContainer.trim()) {
          this.errorMessage = 'Código de caja ya escaneado.';
          return;
        }
      }

      if (this.idContainer.trim().length < caracteres || this.idContainer.trim().length >= caracteres + 1) {
        this.errorMessage = 'Código de caja errado.';
        return;
      }

      this.listContainers.push(this.idContainer.trim());
      this.idContainer = '';

      if (this.listContainers.length === this.selectBox) {
        this.fullShipping = true;
      }
    } else {
      this.errorMessage = 'Código de caja no corresponde al # de factura seleccionada.';
    }
  }

  public deleteContainer(idContainer: string) {
    this.errorMessage = '';
    for (let i = 0; i < this.listContainers.length; i++) {
      if (this.listContainers[i] === idContainer) {
        this.listContainers.splice(i, 1);
        break;
      }
    }

    if (this.listContainers.length === this.selectBox) {
      this.fullShipping = true;
    } else {
      this.fullShipping = false;
    }
    $('#idContainer').focus();
  }

  public listDetailContainer(container: string) {
    this.errorMessage = '';
    this.idContainer = container;
    let pullContainer = container.split("-");
    this._shippingService.listDetailContainer(pullContainer[0], +pullContainer[1]).subscribe(
      response => {
        if (response.code == 0) {
          this.detailContainer = response.content;
          $('#modal_detail_container').modal('show');
        } else {
          this.errorMessage = 'No encontro registro de check-out.'
          this.idContainer = '';
        }
      },
      error => {
        console.error("Ocurrio un error listando el detalle del contenedor.", error);
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public generatePayroll() {
    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });

    if (this.docNumPayroll.length > 0 || this.transportPayroll.length > 0) {
      let printReportDTO = {
        "id": this.docNumPayroll, "copias": 0, "documento": "shipping", "companyName": this.identity.selectedCompany, "origen": 'W', "imprimir": false, "filtro": this.transportPayroll
      }
      this._reportService.generateReport(printReportDTO).subscribe(
        response => {
          if (response.code == 0) {
            let landingUrl = this.urlShared + this.identity.selectedCompany + "/" + printReportDTO.documento + "/payroll/" + printReportDTO.id + ".pdf";
            window.open(landingUrl);
          }
          $('#modal_transfer_process').modal('hide');
        },
        error => {
          console.error('Ocurrio un error al generar la planilla de transporte.', error);
          this.redirectIfSessionInvalid(error);
          $('#modal_transfer_process').modal('hide');
        }
      );
    }
    this.clean();
  }

  public openModalPayroll() {
    this.transPayroll = new Array<any>();
    this._shippingService.listTransPayroll().subscribe(
      response => {
        if (response.code == 0) {
          this.transPayroll = response.content;
        }
      },
      error => {
        console.error("Ocurrio un error listando las transportadoras planilladas.", error);
        this.redirectIfSessionInvalid(error);
      }
    );
    $('#modal_select_planilla').modal('show');
    $('#docNumPayroll').focus();
  }

  public clean() {
    this.listContainers = new Array<string>();
    this.transportPayroll = '';
    this.docNumPayroll = '';
    this.selectBox = 0;
    this.selectInvoice = '';
    this.selectedTransp = '';
    this.idContainer = '';
    this.warningMessage = '';
    this.errorMessage = '';
    this.fullShipping = false;
    this.qtyPack = 0;
    this.selectedTypePack = '';
    this.pesoPack = 0;
    this.valorDeclPack = 0;
    this.addressReceive = '';
    this.selectedInvoices = new Map<String, ShippingInvoice>();
    this.selectInvoicesPack = new Array<ShippingInvoice>();
    this.listDestinationsByDep = new Array<Cities>();
    this.selectedCityDest = '';
    this.selectedCityOrig = '';
    this.checkSede = false;
    this.selectedTypeProduct = '';
  }

  public setIdContainer() {
    this.idContainer = '';
  }

  public getModalGuia() {
    for (let i = 0; i < this.selectInvoicesPack.length; i++) {
      this.addressReceive = this.selectInvoicesPack[i].street;
      this.cityReceive = this.selectInvoicesPack[i].city.replace(' ', '');
      this.departamentReceive = this.selectInvoicesPack[i].depart;
      this.idReceive = this.selectInvoicesPack[i].cardCode;
      this.nameReceive = this.selectInvoicesPack[i].cardName;
      this.selectedTransp = this.selectInvoicesPack[i].transport;

      if (this.selectInvoicesPack.length == 1) {
        this.selectInvoice = this.selectInvoicesPack[i].docNum;
        this.pesoPack = this.selectInvoicesPack[i].unidEmpStand;
        this.valorDeclPack = this.selectInvoicesPack[i].valStandDecl;
      } else {
        this.pesoPack = this.selectInvoicesPack[i].unidEmpStand * this.selectInvoicesPack.length;
        this.valorDeclPack = this.selectInvoicesPack[i].valStandDecl * this.selectInvoicesPack.length;
      }
      break;
    }
    //this.getCitiesDestinationsOla(this.cityReceive);
    $('#modal_crear_guia').modal('show');
  }

  public generateGuia() {
    this.warningMessage = '';
    $('#confirmation_generate_guia').modal('hide');

    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });

    let invoices;

    if (this.selectInvoicesPack.length > 1) {
      for (let i = 0; i < this.selectInvoicesPack.length; i++) {
        this.selectInvoice += this.selectInvoicesPack[i].docNum + ',';
        this.selectedTransp = this.selectInvoicesPack[i].transport;
      }
      invoices = this.selectInvoice.substring(0, this.selectInvoice.length - 1);
    } else {
      invoices = this.selectInvoice;
    }

    let poblacionDestino;
    if (this.selectInvoicesPack[0].depart == 'ANTIOQUIA' || this.selectInvoicesPack[0].depart == 'ATLANTICO') {
      poblacionDestino = this.selectInvoicesPack[0].codCity.substring(1, this.selectInvoicesPack[0].codCity.length) + "000";
    } else {
      poblacionDestino = this.selectInvoicesPack[0].codCity + "000";
    }

    switch (this.selectInvoicesPack[0].transport) {
      case 'RAPIDO OCHOA':
        const apiRapidoochoaDTO = {
          "cdPoblacionOrigen": this.selectedCityOrig,
          "cdPoblacionDestino": poblacionDestino,
          "cdTipoDniCliente": "NI",
          "nmPesoDeclarado": this.pesoPack,
          "nmUnidPorEmbalaje": this.qtyPack,
          "vmValorDeclarado": this.valorDeclPack,
          "dsNombreRemitente": "IGB",
          "dniCliente": "811011909",
          "dniDestinatario": this.selectInvoicesPack[0].cardCode.replace('C', ''),
          "dsNombreDestinatario": this.selectInvoicesPack[0].cardName,
          "dsDireccionDestinatario": this.addressReceive,
          "dsTelefonoDestinatario": "4442025",
          "dsDocReferencia": invoices,
          "dsDiceContener": this.selectedTypeProduct,
          "cdTipoDniDestinatario": "Cedula",
          "vmValorOtros": "0",
          "nmFormaDePago": "CRÉDITO"
        }

        console.log("**************************************");
        console.log(apiRapidoochoaDTO);
        console.log("**************************************");

        /*this._shippingService.createGuiaRapidoochoa(apiRapidoochoaDTO, invoices).subscribe(
          response => {
            if (response.code == 0) {
              //Registramos shipping en tablas temporales
              this.addShipping();

              $('#modal_transfer_process').modal('hide');

              let landingUrl = response.content;
              window.open(landingUrl, "_blank");
              this.clean();
            } else {
              this.warningMessage = response.content;
              $('#modal_transfer_process').modal('hide');
            }
          },
          error => {
            console.error(error);
            this.redirectIfSessionInvalid(error);
          }
        );*/
        break;
      case 'OLA':
        const apiOlaDTO = {
          "tipoflete": "credito",
          "origen": localStorage.getItem('igb.selectedCompany') == 'IGB' ? "MEDELLIN" : "CARTAGENA",
          "destino": this.selectedCityDest,
          "unidades": this.qtyPack,
          "kilos": this.pesoPack,
          "volumen": localStorage.getItem('igb.selectedCompany') == 'IGB' ? 13 : 10,
          "vlrmcia": this.valorDeclPack,
          "obs": "Tipo Empaque: " + this.selectedTypePack,
          "nitr": localStorage.getItem('igb.selectedCompany') == 'IGB' ? "811011909" : "900255414",
          "nombrer": localStorage.getItem('igb.selectedCompany') == 'IGB' ? "IGB MOTORCYCLE PARTS S.A.S" : "MOTOZONE S.A.S",
          "telr": "4442025",
          "dirr": localStorage.getItem('igb.selectedCompany') == 'IGB' ? "CALLE 98 SUR # 42-225 BOB 114" : "VARIANTE TURBACO,SECTOR AGUAS PRIETAS,ZONA FRANCA PARQUE CENTRAL,BOD 73",
          "correor": localStorage.getItem('igb.selectedCompany') == 'IGB' ? "analistatransporte@igbcolombia.com" : "logistica@motozonecolombia.com",
          "nombredg": this.selectInvoicesPack[0].cardName,
          "nitd": this.selectInvoicesPack[0].cardCode.replace('C', ''),
          "teld": "4442025",
          "dird": this.addressReceive,
          "correod": localStorage.getItem('igb.selectedCompany') == 'IGB' ? "analistatransporte@igbcolombia.com" : "logistica@motozonecolombia.com",
          "adicionales": "",
          "cartaporte": "FV " + invoices,
          "tipoenvio": "1"
        }

        this._shippingService.createGuiaOla(apiOlaDTO, invoices).subscribe(
          response => {
            if (response.code == 0) {
              //Registramos shipping en tablas temporales
              this.addShipping();

              this.urlGuia = response.content[0];
              this.urlRotulo = response.content[1];

              $('#modal_transfer_process').modal('hide');
              $('#print_document').modal('show');
            } else {
              this.warningMessage = response.content;
              $('#modal_transfer_process').modal('hide');
            }
          },
          error => {
            console.error(error);
            this.redirectIfSessionInvalid(error);
          }
        );
        break;
      case 'COORDINADORA':
        const apiCoordinadoraDTO = {
          "nameDestination": this.selectInvoicesPack[0].cardName,
          "addressDestination": this.addressReceive,
          "cityDestination": this.selectInvoicesPack[0].codCity + "000",
          "phoneDestination": "4442025",
          "invoice": invoices,
          "observation": "Tipo Empaque: " + this.selectedTypePack,
          "contents": "PRODUCTOS DE IGB, DELICADOS",
          "mailDestination": "analistatransporte@igbcolombia.com",
          "nomEmpaque": this.selectedTypePack,
          "valorDeclarado": this.valorDeclPack,
          "alto": this.selectedTypePack == "CAJA PEQUEÑA" ? "50" : "52",
          "ancho": this.selectedTypePack == "CAJA PEQUEÑA" ? "50" : "66",
          "largo": this.selectedTypePack == "CAJA PEQUEÑA" ? "16" : "57",
          "peso": this.selectedTypePack == "CAJA PEQUEÑA" ? "16" : "57",
          "unidades": this.qtyPack
        }

        this._shippingService.createGuiaCoordinadora(apiCoordinadoraDTO, invoices).subscribe(
          response => {
            if (response.code == 0) {
              //Registramos shipping en tablas temporales
              this.addShipping();

              this.urlGuia = response.content[0];
              this.urlRotulo = response.content[1];

              $('#modal_transfer_process').modal('hide');
              $('#print_document').modal('show');
            } else {
              this.warningMessage = response.content;
              $('#modal_transfer_process').modal('hide');
            }
          },
          error => {
            console.error(error);
            this.redirectIfSessionInvalid(error);
          }
        );
        break;
      case 'TRANSPRENSA':
        const apiTransprensaDTO = {
          "observacion": "Tipo Empaque: " + this.selectedTypePack,
          "factura": invoices,
          "peso": this.pesoPack,
          "volumen": 16,
          "vlrDecl": this.valorDeclPack,
          "codProducto": "",
          "cant": this.qtyPack,
          "descripcion": this.selectedTypePack,
          //Remite
          "documentor": "811011909",
          "nombrer": "IGB MOTORCYCLE PARTS S.A.S",
          "direccionr": "CALLE 98 SUR # 42-225 BOB 114",
          "telefonor": "4442025",
          "codCiudadr": this.selectedCityOrig,
          //Destino
          "tipoDocumentod": "1",
          "documentod": this.selectInvoicesPack[0].cardCode.replace('C', ''),
          "nombred": this.selectInvoicesPack[0].cardName,
          "direcciond": this.addressReceive,
          "telefonod": "4442025",
          "codCiudadd": this.selectInvoicesPack[0].codCity + "000"
        }

        this._shippingService.createGuiaTransprensa(apiTransprensaDTO, invoices).subscribe(
          response => {
            if (response.code == 0) {
              //Registramos shipping en tablas temporales
              this.addShipping();

              //this.urlGuia = response.content[0];
              this.selectedTransp = 'TRANSPRENSA';
              this.urlRotulo = response.content[1];

              $('#modal_transfer_process').modal('hide');
              $('#print_document').modal('show');
            } else {
              this.warningMessage = response.content;
              $('#modal_transfer_process').modal('hide');
            }
          },
          error => {
            console.error(error);
            this.redirectIfSessionInvalid(error);
          }
        );
        break;
      case 'GO PACK365':
        const apiGoPackDTO = {
          "observacion": "Tipo Empaque: " + this.selectedTypePack,
          "factura": invoices,
          "peso": this.pesoPack,
          "volumen": 16,
          "vlrDecl": this.valorDeclPack,
          "codProducto": "",
          "cant": this.qtyPack,
          "descripcion": this.selectedTypePack,
          //Remite
          "documentor": "811011909",
          "nombrer": "IGB MOTORCYCLE PARTS S.A.S",
          "direccionr": "CALLE 98 SUR # 42-225 BOB 114",
          "telefonor": "4442025",
          "codCiudadr": "05380000", //La Estrella
          //Destino
          "tipoDocumentod": "1",
          "documentod": this.selectInvoicesPack[0].cardCode.replace('C', ''),
          "nombred": this.selectInvoicesPack[0].cardName,
          "direcciond": this.addressReceive,
          "telefonod": "4442025",
          "codCiudadd": this.selectInvoicesPack[0].codCity + "000"
        }

        this._shippingService.createGuiaGoPack(apiGoPackDTO, invoices).subscribe(
          response => {
            if (response.code == 0) {
              //Registramos shipping en tablas temporales
              this.addShipping();
              this.urlGuia = response.content[0];
              this.urlRotulo = response.content[1];
              $('#modal_transfer_process').modal('hide');
              $('#print_document').modal('show');
            } else {
              this.warningMessage = response.content;
              $('#modal_transfer_process').modal('hide');
            }
          }, error => {
            console.error(error);
            this.redirectIfSessionInvalid(error);
          }
        );
        break;
      case 'SAFERBO':
        const apiSaferboDTO = {
          "observacion": "Tipo Empaque: " + this.selectedTypePack,
          "factura": invoices,
          "peso": this.pesoPack,
          "volumen": 16,
          "vlrDecl": this.valorDeclPack,
          "codProducto": "",
          "cant": this.qtyPack,
          "descripcion": this.selectedTypePack,
          //Destino
          "tipoDocumentod": "1",
          "documentod": this.selectInvoicesPack[0].cardCode.replace('C', ''),
          "nombred": this.selectInvoicesPack[0].cardName,
          "direcciond": this.addressReceive,
          "telefonod": this.selectInvoicesPack[0].phone,
          "codCiudadd": this.cityReceive + '-' + this.departamentReceive + '-' + this.selectInvoicesPack[0].codCity + "000"
        }

        this._shippingService.createGuiaSaferbo(apiSaferboDTO, invoices).subscribe(
          response => {
            if (response.code == 0) {
              //Registramos shipping en tablas temporales
              this.addShipping();
              this.urlGuia = response.content[0];
              this.urlRotulo = response.content[1];
              $('#modal_transfer_process').modal('hide');
              $('#print_document').modal('show');
            } else {
              this.warningMessage = response.content;
              $('#modal_transfer_process').modal('hide');
            }
          }, error => {
            console.error(error);
            this.redirectIfSessionInvalid(error);
          }
        );
        break;
      case "ALDIA":
        const apiAldiaDTO = {
          "observacion": "PRODUCTO DELICADO",
          "factura": invoices,
          "peso": this.pesoPack,
          "volumen": 22,
          "vlrDecl": this.valorDeclPack,
          "codProducto": "",
          "cant": this.qtyPack,
          "descripcion": this.selectedTypeProduct,
          //Remite
          "documentor": localStorage.getItem('igb.selectedCompany') == 'IGB' ? "811011909" : "900255414",
          "nombrer": localStorage.getItem('igb.selectedCompany') == 'IGB' ? "IGB MOTORCYCLE PARTS S.A.S" : "MOTOZONE S.A.S",
          //Destino
          "tipoDocumentod": "1",
          "documentod": this.selectInvoicesPack[0].cardCode.replace('C', ''),
          "nombred": this.selectInvoicesPack[0].cardName,
          "direcciond": this.addressReceive,
          "telefonod": this.selectInvoicesPack[0].phone,
          "codCiudadd": this.selectInvoicesPack[0].codCity,
          "tipoEmpaque": this.selectedTypePack
        }

        this._shippingService.createGuiaAldia(apiAldiaDTO, invoices).subscribe(
          response => {
            if (response.code == 0) {
              //Registramos shipping en tablas temporales
              this.addShipping();

              this.urlGuia = response.content[0];
              this.urlRotulo = response.content[1];

              $('#modal_transfer_process').modal('hide');
              $('#print_document').modal('show');
            } else {
              this.warningMessage = response.content;
              $('#modal_transfer_process').modal('hide');
            }
          }, error => {
            console.error(error);
            this.redirectIfSessionInvalid(error);
          }
        );
        break;
        case "EXXE":
          const apiExxeDTO = {
            "observacion": "PRODUCTO DELICADO",
            "factura": invoices,
            "peso": this.pesoPack,
            "volumen": 22,
            "vlrDecl": this.valorDeclPack,
            "codProducto": "",
            "cant": this.qtyPack,
            "descripcion": this.selectedTypeProduct,
            //Remite
            "documentor": localStorage.getItem('igb.selectedCompany') == 'IGB' ? "18483" : "",
            "nombrer": localStorage.getItem('igb.selectedCompany') == 'IGB' ? "IGB MOTORCYCLE PARTS S.A.S" : "MOTOZONE S.A.S",
            "codCiudadr": "05380", //La Estrella
            //Destino
            "tipoDocumentod": "1",
            "documentod": this.selectInvoicesPack[0].cardCode.replace('C', ''),
            "nombred": this.selectInvoicesPack[0].cardName,
            "direcciond": this.addressReceive,
            "telefonod": this.selectInvoicesPack[0].phone,
            "codCiudadd": this.selectInvoicesPack[0].codCity,
            "tipoEmpaque": this.selectedTypePack
          }

          this._shippingService.createGuiaExxe(apiExxeDTO, invoices).subscribe(
            response => {
              if (response.code == 0) {
                //Registramos shipping en tablas temporales
                this.addShipping();

                this.urlGuia = response.content[0];
                this.urlRotulo = response.content[1];

                $('#modal_transfer_process').modal('hide');
                $('#print_document').modal('show');
              } else {
                this.warningMessage = response.content;
                $('#modal_transfer_process').modal('hide');
              }
            }, error => {
              console.error(error);
              this.redirectIfSessionInvalid(error);
            }
          );
          break;
      default:
        this.clean();
        this.warningMessage = "Lo sentimos. Actualmente no esta integrada la transportadora.";
        $('#modal_transfer_process').modal('hide');
        break;
    }
  }

  public printStickerGuia() {
    $("#printStickerGuia").modal('hide');
    $('#modal_transfer_process').modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });

    this._shippingService.printStickerGuiaOla(this.guia).subscribe(
      response => {
        window.open(response.content);
        $('#modal_transfer_process').modal('hide');
        this.guia = '';
        this.selectedTransp = '';
      },
      error => {
        console.error(error);
        $('#modal_transfer_process').modal('hide');
      }
    );
  }

  public validateData() {
    if (this.selectedTypePack == null || this.selectedTypePack.length <= 0) {
      this.validSelectedTypePack = false;
      return;
    } else if (this.qtyPack == null || this.qtyPack <= 0) {
      this.validQtyPack = false;
      return;
    } else if (this.pesoPack == null || this.pesoPack <= 0) {
      this.validPesoPack = false;
      return;
    } else if (this.valorDeclPack == null || this.valorDeclPack <= 0) {
      this.validValorDeclPack = false;
      return;
    } else if (this.selectedTypeProduct == null || this.selectedTypeProduct.length <= 0) {
      this.validSelectedTypeProduct = false;
      return;
    } else if (this.checkSede) {
      this.addressReceive = "CALLE 98 SUR # 48-225 BOD 114";
      this.cityReceive = "LA ESTRELLA";
      this.departamentReceive = "ANTIOQUIA";
      this.selectedCityDest = "LA ESTRELLA";
    } else {
      if (this.addressReceive == null || this.addressReceive.length <= 0) {
        this.validAddressReceive = false;
        return;
      } else if (this.cityReceive == null || this.cityReceive.length <= 0) {
        this.validCityReceive = false;
        return;
      } else if (this.selectedTransp === "OLA") {
        if (this.selectedCityDest == null || this.selectedCityDest.length <= 0) {
          this.validSelectedCityDest = false;
          return;
        }
      }
    }
    $('#modal_crear_guia').modal('hide');
    $('#confirmation_generate_guia').modal('show');
  }

  public calculateVrlDeclarad() {
    this.shippingErrorMessage = '';
    if (this.qtyPack === 0) {
      this.shippingErrorMessage = 'Embalaje debe ser mayor a 0.';
      return;
    }

    if (this.identity.selectedCompany == 'IGB') {
      for (let i = 0; i < this.selectInvoicesPack.length; i++) {
        const ord = this.selectInvoicesPack[i];
        this.pesoPack = (ord.unidEmpStand * this.qtyPack);
        this.valorDeclPack = (ord.valStandDecl * this.qtyPack);
        break;
      }
    } else {
      this.valorDeclPack = (this.valStandDeclMTZ * this.qtyPack);
      this.pesoPack = (this.unidEmpStandMTZ * this.qtyPack);
    }
  }

  public getUrlGuia() {
    let landingUrl = this.urlGuia;
    window.open(landingUrl, "_blank");
    this.clean();
  }

  public getUrlRotulo() {
    let landingUrl = this.urlRotulo;
    window.open(landingUrl, "_blank");
    this.clean();
  }

  public getScrollTop() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }

  public listCitiesDestinationsOla() {
    this._shippingService.listCitiesDestinationsOla().subscribe(
      response => {
        this.listDestinations = response.content.data.sort();
      }, error => { console.error(error); }
    );
  }

  public getCitiesDestinationsOla(cityDest: string) {
    this.listDestinationsByDep = new Array<Cities>();

    for (let i = 0; i < this.listDestinations.length; i++) {
      const city = this.listDestinations[i];
      if (city.nombre.toLowerCase().includes(cityDest.toLowerCase())) {
        this.listDestinationsByDep.push(city);
        return;
      }
    }
  }

  public getVrlDeclarad(selectedTypePack: string) {
    if (this.selectedCompany == 'VARROC') {
      this.qtyPack = 0;
      this.pesoPack = 0;
      switch (selectedTypePack) {
        case "CAJA":
          this.valorDeclPack = 200000;
          this.pesoPack = 10;
          break;
        case "UNIDAD":
          this.valorDeclPack = 200000;
          this.pesoPack = 10;
          break;
        case "LIO":
          this.valorDeclPack = 200000;
          this.pesoPack = 20;
          break;
        case "VALDE":
          this.valorDeclPack = 600000;
          this.pesoPack = 20;
          break;
        case "TAMBOR":
          this.valorDeclPack = 600000;
          this.pesoPack = 208;
          break;
        case "CONTENEDOR":
          this.valorDeclPack = 600000;
          this.pesoPack = 1000;
          break;
      }
      this.valStandDeclMTZ = this.valorDeclPack;
      this.unidEmpStandMTZ = this.pesoPack;
    } else {
      return;
    }
  }
}
