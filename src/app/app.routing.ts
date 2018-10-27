import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { PurchaseOrdersComponent } from './components/purchase-orders/purchase-orders.component';
import { PurchaseOrderComponent } from './components/purchase-orders/purchase-order.component';
import { SalesOrdersComponent } from './components/sales-orders/sales-orders.component';
import { PickingComponent } from './components/picking/picking.component';
import { PackingComponent } from './components/packing/packing.component';
import { InventoryComponent } from './components/inventory/inventory.component';
import { ResupplyComponent } from './components/resupply/resupply.component';
import { ReportComponent } from './components/report/report.component';
import { StockTransferComponent } from './components/stock-transfer/stock-transfer.component';
import { StockConsultComponent } from './components/stock-consult/stock-consult.component';

const appRoutes: Routes = [
    { path: '', component: LoginComponent },
    { path: 'home', component: HomeComponent },
    { path: 'purchase-orders', component: PurchaseOrdersComponent },
    { path: 'purchase-order/:docNum', component: PurchaseOrderComponent },
    { path: 'sales-orders', component: SalesOrdersComponent },
    { path: 'picking', component: PickingComponent },
    { path: 'packing', component: PackingComponent },
    { path: 'inventory', component: InventoryComponent },
    { path: 'transfer', component: StockTransferComponent },
    { path: 'consult', component: StockConsultComponent },
    { path: 'resupply', component: ResupplyComponent },
    { path: 'report', component: ReportComponent }
];

export const appRoutingProviders: any[] = [];
export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);
