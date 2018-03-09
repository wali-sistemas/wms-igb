import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

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
import { InventoryComponent } from './components/inventory/inventory.component';

import { routing, appRoutingProviders } from './app.routing';

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
    InventoryComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    routing
  ],
  providers: [appRoutingProviders],
  bootstrap: [AppComponent]
})
export class AppModule { }
