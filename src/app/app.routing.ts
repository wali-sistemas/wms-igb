import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { PurchaseOrdersComponent } from './components/purchase-orders/purchase-orders.component';
import { PurchaseOrderComponent } from './components/purchase-orders/purchase-order.component';
import { SalesOrdersComponent } from './components/sales-orders/sales-orders.component';
import { PickingComponent } from './components/picking/picking.component';
import { PackingComponent } from './components/packing/packing.component';
import { InventoryRandomComponent } from './components/inventory/random/inventory-Random.component';
import { InventoryComponent } from './components/inventory/inventory.component';
import { ResupplyComponent } from './components/resupply/resupply.component';
import { ReportComponent } from './components/report/report.component';
import { ReportManagerComponent } from './components/report/manager/report.manager.component';
import { StockTransferLocationComponent } from './components/stock-transfer/location-transfer/stock-transfer-location.component';
import { StockTransferWarehouseComponent } from './components/stock-transfer/warehouse-transfer/stock-transfer-warehouse.component';
import { TransferComponent } from './components/stock-transfer/transfer.component';
import { StockItemComponent } from './components/inventory/stock/stock-item.component';
import { ClientIgbComponent } from './components/event-feria/client-igb/client-igb.component';
import { ClientMtzComponent } from './components/event-feria/client-mtz/client-mtz.component';
import { CheckOutComponent } from './components/packing/check-out/check-out.component';
import { ShippingComponent } from './components/shipping/shipping.component';
import { WithholdingTaxesComponent } from './components/withholding-taxes/withholding-taxes.component';
import { from } from 'rxjs/observable/from';

const appRoutes: Routes = [
    { path: '', component: LoginComponent },
    { path: 'home', component: HomeComponent },
    { path: 'purchase-orders', component: PurchaseOrdersComponent },
    { path: 'purchase-order/:docNum', component: PurchaseOrderComponent },
    { path: 'sales-orders', component: SalesOrdersComponent },
    { path: 'picking', component: PickingComponent },
    { path: 'packing', component: PackingComponent },
    { path: 'inventory', component: InventoryComponent },
    { path: 'inventory-random', component: InventoryRandomComponent },
    { path: 'transfer-location', component: StockTransferLocationComponent },
    { path: 'transfer-warehouse', component: StockTransferWarehouseComponent },
    { path: 'transfer', component: TransferComponent },
    { path: 'stock-item', component: StockItemComponent },
    { path: 'resupply', component: ResupplyComponent },
    { path: 'report', component: ReportComponent },
    { path: 'report/manager', component: ReportManagerComponent },
    { path: 'feria/igb', component: ClientIgbComponent },
    { path: 'feria/motozone', component: ClientMtzComponent },
    { path: 'check-out', component: CheckOutComponent },
    { path: 'shipping', component: ShippingComponent },
    { path: 'withholding', component: WithholdingTaxesComponent }
];

export const appRoutingProviders: any[] = [];
export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);