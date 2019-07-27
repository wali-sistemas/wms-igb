import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { ChartsModule } from 'ng2-charts';

import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { NavBarComponent } from './components/navbar/navbar.component';
import { PurchaseOrdersComponent } from './components/purchase-orders/purchase-orders.component';
import { PurchaseOrderComponent } from './components/purchase-orders/purchase-order.component';
import { SalesOrdersComponent } from './components/sales-orders/sales-orders.component';
import { SalesOrderComponent } from './components/sales-orders/sales-order.component';
import { PickingComponent } from './components/picking/picking.component';
import { PackingComponent } from './components/packing/packing.component';
import { InventoryRandomComponent } from './components/inventory/random/inventory-Random.component';
import { InventoryComponent } from './components/inventory/inventory.component';
import { ResupplyComponent } from './components/resupply/resupply.component';
import { ReportComponent } from './components/report/report.component';
import { StockTransferLocationComponent } from './components/stock-transfer/location-transfer/stock-transfer-location.component';
import { StockTransferWarehouseComponent } from './components/stock-transfer/warehouse-transfer/stock-transfer-warehouse.component';
import { TransferComponent } from './components/stock-transfer/transfer.component';
import { StockItemComponent } from './components/stock-item/stock-item.component';
import { ClientIgbComponent } from './components/event-feria/client-igb/client-igb.component';
import { ClientMtzComponent } from './components/event-feria/client-mtz/client-mtz.component';
import { CheckOutComponent } from './components/packing/check-out/check-out.component';

import { routing, appRoutingProviders } from './app.routing';
import { from } from 'rxjs/observable/from';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,
    NavBarComponent,
    PurchaseOrdersComponent,
    PurchaseOrderComponent,
    SalesOrdersComponent,
    SalesOrderComponent,
    PickingComponent,
    PackingComponent,
    InventoryComponent,
    InventoryRandomComponent,
    ResupplyComponent,
    ReportComponent,
    StockTransferLocationComponent,
    StockTransferWarehouseComponent,
    TransferComponent,
    StockItemComponent,
    ClientIgbComponent,
    ClientMtzComponent,
    CheckOutComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    routing,
    ChartsModule
  ],
  providers: [appRoutingProviders],
  bootstrap: [AppComponent]
})
export class AppModule { }