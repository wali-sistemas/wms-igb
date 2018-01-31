import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { PurchaseOrdersComponent } from './components/purchase-orders/purchase-orders.component';
import { PurchaseOrderComponent } from './components/purchase-orders/purchase-order.component';
import { SalesOrdersComponent } from './components/sales-orders/sales-orders.component';
import { PickingComponent } from './components/picking/picking.component';
import { InventoryComponent } from './components/inventory/inventory.component';

const appRoutes: Routes = [
    { path: '', component: LoginComponent },
    { path: 'home', component: HomeComponent },
    { path: 'purchase-orders', component: PurchaseOrdersComponent },
    { path: 'purchase-order/:docNum', component: PurchaseOrderComponent },
    { path: 'sales-orders', component: SalesOrdersComponent },
    { path: 'picking', component: PickingComponent },
    { path: 'inventory', component: InventoryComponent }
];

export const appRoutingProviders: any[] = [];
export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);
