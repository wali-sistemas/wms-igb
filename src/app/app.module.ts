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
import { OrderSapComponent } from './components/sales-orders/orders-sap/order-sap.component';
import { OrdersSapComponent } from './components/sales-orders/orders-sap/orders-sap.component';
import { OrdersModulaComponent } from './components/sales-orders/orders-modula/orders-modula.component';
import { OrdersMagnumComponent } from './components/sales-orders/orders-magnum/orders-magnum.component';
import { PickingComponent } from './components/picking/picking.component';
import { PackingComponent } from './components/packing/packing.component';
import { InventoryRandomComponent } from './components/inventory/random/inventory-Random.component';
import { InventoryComponent } from './components/inventory/inventory.component';
import { ResupplyComponent } from './components/resupply/resupply.component';
import { ReportComponent } from './components/report/report.component';
import { ReportManagerComponent } from './components/report/manager/report.manager.component';
import { StockTransferLocationComponent } from './components/stock-transfer/location-transfer/stock-transfer-location.component';
import { StockTransferWarehouseComponent } from './components/stock-transfer/warehouse-transfer/stock-transfer-warehouse.component';
import { StockTransferModulaComponent } from './components/stock-transfer/modula-transfer/stock-transfer-modula.component';
import { TransferComponent } from './components/stock-transfer/transfer.component';
import { StockItemComponent } from './components/inventory/stock/stock-item.component';
import { ClientIgbComponent } from './components/event-feria/client-igb/client-igb.component';
import { ClientMtzComponent } from './components/event-feria/client-mtz/client-mtz.component';
import { CheckOutComponent } from './components/packing/check-out/check-out.component';
import { ShippingComponent } from './components/shipping/shipping.component';
import { WithholdingTaxesComponent } from './components/withholding-taxes/withholding-taxes.component';
import { TicketTIComponent } from './components/ticket-TI/ticket-TI.component';
import { SoulStockComponent } from './components/inventory/soul/soul-stock.component';
import { ModulaComponent } from './components/inventory/modula/modula.component';
import { ReportComexComponent } from './components/report/comex/report.comex.component';
import { CollectionComponent } from './components/collection/collection.component';
import { ApproveComponent } from './components/collection/approve/approve.component';
import { EmployeeComponent } from './components/employee/employee.component';
import { EmployeeCustodyComponent } from './components/employee/custody/employee-custody.component';
import { routing, appRoutingProviders } from './app.routing';
import { from } from 'rxjs/observable/from';
import { ClientRedplasComponent } from './components/event-feria/client-redplas/client-redplas.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,
    NavBarComponent,
    PurchaseOrdersComponent,
    PurchaseOrderComponent,
    SalesOrdersComponent,
    OrderSapComponent,
    OrdersSapComponent,
    OrdersModulaComponent,
    OrdersMagnumComponent,
    PickingComponent,
    PackingComponent,
    InventoryComponent,
    InventoryRandomComponent,
    ResupplyComponent,
    ReportComponent,
    ReportManagerComponent,
    StockTransferLocationComponent,
    StockTransferWarehouseComponent,
    StockTransferModulaComponent,
    TransferComponent,
    StockItemComponent,
    ClientIgbComponent,
    ClientMtzComponent,
    ClientRedplasComponent,
    CheckOutComponent,
    ShippingComponent,
    WithholdingTaxesComponent,
    TicketTIComponent,
    SoulStockComponent,
    ModulaComponent,
    ReportComexComponent,
    CollectionComponent,
    ApproveComponent,
    EmployeeComponent,
    EmployeeCustodyComponent
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
