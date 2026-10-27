import { Component, OnInit, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { BusinessPartnerService } from '../../../services/business-partner.service';
import { Advisor } from '../../../models/customer/client-advisor';
import { GeoLocation } from '../../../models/geoLocation/geo-location';
import { GeoLocationSalesData } from '../../../models/geoLocation/geo-location-salesData';
import { DailyMarkers } from '../../../models/daily-markers-advisor';

declare var $: any;
declare var google: any;

@Component({
  templateUrl: './geo-location.component.html',
  styleUrls: ['./geo-location.component.css'],
  providers: [BusinessPartnerService, UserService]
})

export class GeoLocationComponent implements OnInit, AfterViewInit, OnDestroy {
  public identity: any;
  public expandedView = false;
  private googleMap: any;
  public isLoading = false;
  public mapReady = false;
  public routeLoading = false;
  public routeMessage = '';
  public searched = false;
  public activitySearch = '';
  public selectedLocationIndex = -1;
  public salesError = '';
  private routeClass: any;
  private polylines: any[] = [];
  private mapMarkers: any[] = [];
  private infoWindow: any;
  private revision = 0;
  private destroyed = false;
  private mapTimer: any;
  private requestSubscriptions: any[] = [];
  private dataSubscriptions: any[] = [];
  public markers: DailyMarkers[] = [];
  public markersWithQuantityZero: DailyMarkers[] = [];
  public markersWithQuantityGreaterThanZero: DailyMarkers[] = [];
  public advisors: Advisor[] = [];
  public filteredAdvisors: Advisor[] = [];
  public locations: GeoLocation[] = [];
  public salesData: GeoLocationSalesData = new GeoLocationSalesData();
  public filteredRegions: string[] = [];
  public locationsToDraw: GeoLocation[] = [];
  public selectedCompany: string = '';
  public selectedAdvisor: string = '';
  public selectedRegion: string = '';
  public selectedZone: string = '';
  public year: string = '';
  public month: string = '';
  public day: string = '';
  public region: string = '';
  public changeLocationErrorMessage: string = '';
  public firstRegister: string = '';
  public lastSynchronizationAdvisor: string = '';
  public time: string = '';
  public distance: number = 0;
  public ordersUploads: number = 0;
  public savedOrders: number = 0;
  public adviserCard: number = 0;
  public dateValue: Date = new Date();
  public enabledbutton: boolean = true;
  public tabActive: boolean = true;
  public tabInactive: boolean = false;
  public email: string = '';
  public activeList = this.markersWithQuantityZero;

  constructor(private _router: Router, private zone: NgZone, private _userService: UserService, private _businessPartnerService: BusinessPartnerService) { }

  ngOnInit() {
    this.identity = this._userService.getItentity();
    if (this.identity === null) {
      this._router.navigate(['/']);
      return;
    }
    this.identity = this._userService.getItentity();
    this.selectedCompany = this.identity.selectedCompany;
    this.email = this.identity.email.includes('telemer') ? this.identity.email : '*';
    this.getListOfAdvisors(this.email);
    this.getDailyMarks(this.selectedCompany);
  }

  ngAfterViewInit() {
    if (this.identity) { this.initializeMap(); }
  }

  ngOnDestroy() {
    this.destroyed = true;
    this.revision++;
    clearTimeout(this.mapTimer);
    this.dataSubscriptions.forEach(s => s.unsubscribe());
    this.requestSubscriptions.forEach(s => s.unsubscribe());
    this.resetOverlays();

    if (this.googleMap) {
      google.maps.event.clearInstanceListeners(this.googleMap);
    }
    $('#modalActive').modal('hide');
  }

  private redirectIfSessionInvalid(error: any) {
    if (error && error.status && error.status == 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
  }

  public toggleExpandedView() {
    this.expandedView = !this.expandedView;
    setTimeout(() => {
      if (!this.destroyed && this.googleMap) {
        const center = this.googleMap.getCenter();
        google.maps.event.trigger(this.googleMap, 'resize');
        if (center) { this.googleMap.setCenter(center); }
      }
    }, 0);
  }

  public openModal() {
    $('#modalActive').modal('show');
  }

  public setInactives() {
    this.activeList = this.markersWithQuantityZero;
    this.tabActive = true;
    this.tabInactive = false;
  }

  public setAssets() {
    this.activeList = this.markersWithQuantityGreaterThanZero;
    this.tabActive = false;
    this.tabInactive = true;
  }

  private initializeMap(attempt: number = 0) {
    if (this.destroyed) { return; }
    if (typeof google === 'undefined' || !google.maps || !google.maps.importLibrary) {
      if (attempt < 100) {
        this.mapTimer = setTimeout(() => this.initializeMap(attempt + 1), 100);
      } else {
        this.changeLocationErrorMessage = 'No se pudo cargar Google Maps. Revisa el script y recarga la página.';
      }
      return;
    }
    Promise.all([google.maps.importLibrary('maps'), google.maps.importLibrary('routes')])
      .then(libraries => {
        if (this.destroyed) { return; }
        this.zone.run(() => {
          this.routeClass = libraries[1].Route;
          if (!this.routeClass) { throw new Error('La biblioteca Routes no está disponible. Revisa la versión del script.'); }
          this.googleMap = new libraries[0].Map(document.getElementById('google-map'), {
            center: { lat: 6.125338, lng: -75.630844 }, zoom: 5,
            mapTypeControl: false, streetViewControl: true, fullscreenControl: true
          });
          this.infoWindow = new google.maps.InfoWindow();
          this.mapReady = true;
        });
      }).catch(error => this.zone.run(() => {
        this.changeLocationErrorMessage = 'No se pudo inicializar el mapa y Routes. Recarga la página e inténtalo nuevamente.';
      }));
  }

  private resetOverlays() {
    this.polylines.forEach(p => p.setMap(null));
    this.mapMarkers.forEach(m => { google.maps.event.clearInstanceListeners(m); m.setMap(null); });
    this.polylines = [];
    this.mapMarkers = [];
    if (this.infoWindow) { this.infoWindow.close(); }
  }

  private position(location: GeoLocation): any {
    if (location.latitude == null || location.longitude == null ||
      String(location.latitude).trim() === '' || String(location.longitude).trim() === '') { return null; }
    const lat = Number(location.latitude), lng = Number(location.longitude);
    return isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
      ? { lat: lat, lng: lng } : null;
  }

  public get advisorName(): string {
    const advisor = this.advisors.filter(a => String(a.id) === String(this.selectedAdvisor))[0];
    return advisor ? advisor.name : 'Asesor';
  }

  public get filteredActivity(): DailyMarkers[] {
    const query = this.activitySearch.toLowerCase().trim();
    return this.activeList.filter(m => String(m.name).toLowerCase().indexOf(query) !== -1);
  }

  public locationLabel(type: string): string {
    const normalized = String(type || '').toUpperCase();
    return normalized === 'V' ? 'Visita' : normalized === 'P' ? 'Pedido montado' : normalized === 'G' ? 'Pedido guardado' : normalized === 'S' ? 'Sincronización' : 'Marcación';
  }

  public locationTime(value: any): string {
    const time = ('0000' + String(value || '0')).slice(-4);
    return time.substring(0, 2) + ':' + time.substring(2, 4);
  }

  public focusLocation(location: GeoLocation, index: number) {
    const position = this.position(location);
    if (!position || !this.googleMap) { return; }
    this.selectedLocationIndex = index;
    this.googleMap.panTo(position);
    this.googleMap.setZoom(16);
    const content = document.createElement('div');
    content.style.cssText = 'padding:8px 4px;min-width:180px;font-family:Arial,sans-serif;color:#192538;';
    const order = document.createElement('div');
    order.textContent = 'REGISTRO ' + (index + 1);
    order.style.cssText = 'font-size:10px;letter-spacing:1px;color:#64748b;margin-bottom:7px';
    const title = document.createElement('strong');
    title.textContent = this.locationLabel(location.docType);
    title.style.cssText = 'display:block;font-size:15px;margin-bottom:7px';
    const detail = document.createElement('div');
    detail.textContent = this.locationTime(location.docTime) + ' · ' + this.advisorName;
    detail.style.cssText = 'font-size:12px;margin-bottom:7px';
    const scope = document.createElement('div');
    scope.textContent = this.locationsToDraw.indexOf(location) >= 0 ? 'Incluido en la ruta calculada' : 'Fuera de los primeros 26 puntos de ruta';
    scope.style.cssText = 'font-size:11px;color:#64748b';
    content.appendChild(order); content.appendChild(title); content.appendChild(detail); content.appendChild(scope);
    this.infoWindow.setContent(content);
    this.infoWindow.setPosition(position);
    this.infoWindow.open(this.googleMap);
  }

  public fitRoute() {
    if (!this.googleMap || !this.locations.length) { return; }
    const bounds = new google.maps.LatLngBounds();
    let count = 0;
    this.locations.forEach(location => { const p = this.position(location); if (p) { bounds.extend(p); count++; } });
    if (count) { this.googleMap.fitBounds(bounds, 40); }
  }

  public getDateFormat() {
    const selectedDate = new Date(this.dateValue);
    this.year = selectedDate.getUTCFullYear().toString();
    this.month = ('0' + (selectedDate.getUTCMonth() + 1)).slice(-2);
    this.day = ('0' + selectedDate.getUTCDate()).slice(-2);
  }

  public getLocation() {
    if (this.isLoading || this.routeLoading || !this.mapReady) { return; }
    if (!this.selectedAdvisor || !this.dateValue) {
      this.changeLocationErrorMessage = 'Selecciona un asesor y una fecha.';
      return;
    }
    this.getDateFormat();
    this.revision++;
    this.resetOverlays();
    this.locations = [];
    this.locationsToDraw = [];
    this.salesData = new GeoLocationSalesData();
    this.salesError = '';
    this.routeMessage = '';
    this.changeLocationErrorMessage = '';
    this.selectedLocationIndex = -1;
    this.searched = true;
    this.isLoading = true;
    this.requestSubscriptions.push(this._businessPartnerService.getGeoLocation(this.selectedCompany, this.selectedAdvisor, this.year, this.month, this.day).subscribe(
      response => {
        if (response.code === 0) {
          if (response.content && response.content.length > 0) {
            this.locations = response.content;
            this.fixFormatTime(this.locations);
            this.locations.sort((a, b) => {
              return parseInt(a.docTime) - parseInt(b.docTime);
            });
            this.locationsToDraw = this.locations.filter(location => this.position(location) !== null).slice(0, 26);
            this.drawRoute(this.locationsToDraw);
            this.calculateDistance(this.locations);
            this.countUploadedOrders(this.locations);
            this.countSavedOrders(this.locations);
            this.getFirstRecord(this.locations);
            this.getLastSync(this.locations);
            this.getLastHour(this.locations);
            this.addMarkersForOrders(this.locations);
            this.adviserCard = this.locations[0].idCard;
            this.enabledbutton = false;
            this.getOrderData();
          } else {
            this.changeLocationErrorMessage = 'No se encontraron registros';
          }
        } else {
          this.changeLocationErrorMessage = 'Error al obtener la ubicación';
        }
        this.isLoading = false;
      },
      error => {
        this.changeLocationErrorMessage = 'Error al obtener la ubicación';
        this.redirectIfSessionInvalid(error);
        this.isLoading = false;
      }
    ));
  }
  public getDailyMarks(selectedCompany: string) {
    this.dataSubscriptions.push(this._businessPartnerService.listDailyMarks(selectedCompany).subscribe(
      response => {
        response.forEach((item: string) => {
          const marker = new DailyMarkers(item[0], item[1], item[2], item[3]);
          const quantity = parseInt(marker.quantity);
          if (quantity === 0) {
            this.markersWithQuantityZero.push(marker);
          } else {
            this.markersWithQuantityGreaterThanZero.push(marker);
          }
        });
      },
      error => {
        this.changeLocationErrorMessage = 'Error al obtener la lista de asesores';
        this.redirectIfSessionInvalid(error);
      }
    ));
  }

  public getListOfAdvisors(email: string) {
    this.dataSubscriptions.push(this._businessPartnerService.listAdvisors(email).subscribe(
      response => {
        this.advisors = response.map((item: string) => new Advisor(item[0], item[1], item[2], item[3], item[4])).filter(
          (advisor: Advisor) => advisor.region && advisor.region.trim() !== '');
        this.filteredRegions = Array.from(
          new Set(this.advisors.map(advisor => advisor.region))
        );
        if (this.region) {
          this.filteredAdvisors = this.advisors.filter(advisor => advisor.region === this.region);
        } else {
          this.filteredAdvisors = [];
        }
      },
      error => { this.redirectIfSessionInvalid(error); }
    ));
  }

  public get visitCount(): number {
    return this.locations.filter(l => String(l.docType || '').toUpperCase() === 'V').length;
  }

  private markerIcon(type: string, order: number, start: boolean, end: boolean): any {
    const t = String(type || '').toUpperCase();
    const color = t === 'V' ? '#7c3aed' : t === 'P' ? '#059669' : t === 'G' ? '#d97706' : '#2563eb';
    // SVG vectorial: bolsa de compra, ubicación, guardar o sincronizar.
    const symbol = t === 'P' ? '<path d="M5 8h14l-1 12H6L5 8zm4 0V6a3 3 0 016 0v2"/>' :
      t === 'V' ? '<path d="M12 21s7-7 7-12a7 7 0 00-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>' :
        t === 'G' ? '<path d="M4 3h14l3 3v15H3V3h1zm3 0v7h10V3M7 21v-7h10v7"/>' :
          '<path d="M19 8a7 7 0 00-12-3L4 8m0-5v5h5M5 16a7 7 0 0012 3l3-3m0 5v-5h-5"/>';
    const badge = start ? 'I' : end ? 'F' : '';
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="76" height="64" viewBox="0 0 76 64">' +
      '<path d="M38 61l-8-11h16z" fill="' + color + '"/>' +
      '<rect x="3" y="8" width="70" height="43" rx="16" fill="' + color + '" stroke="white" stroke-width="3"/>' +
      '<g transform="translate(10 16)" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + symbol + '</g>' +
      '<text x="51" y="36" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="17" font-weight="700">' + order + '</text>' +
      (badge ? '<circle cx="65" cy="9" r="8" fill="#172554" stroke="white" stroke-width="2"/><text x="65" y="12" text-anchor="middle" fill="white" font-family="Arial" font-size="9" font-weight="700">' + badge + '</text>' : '') + '</svg>';
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(68, 57), anchor: new google.maps.Point(34, 54)
    };
  }

  public addMarkersForOrders(locations: GeoLocation[]) {
    // Un único marcador por registro: conserva su número en la línea de tiempo.
    const valid = locations.filter(l => this.position(l) !== null);
    locations.forEach((location, index) => {
      const p = this.position(location);
      if (!p) { return; }
      const marker = new google.maps.Marker({
        position: p, map: this.googleMap,
        title: (index + 1) + ' · ' + this.locationLabel(location.docType) + ' · ' + this.locationTime(location.docTime),
        zIndex: 100 + index,
        icon: this.markerIcon(location.docType, index + 1, location === valid[0], location === valid[valid.length - 1])
      });
      marker.addListener('click', () => this.zone.run(() => this.focusLocation(location, index)));
      this.mapMarkers.push(marker);
    });
  }

  private fixFormatTime(locations: GeoLocation[]) {
    for (const location of locations) {
      location.docTime = ('0000' + String(location.docTime || '0')).slice(-4);
    }
  }

  public onRegionChange() {
    if (this.selectedCompany === 'IGB') {
      if (this.selectedRegion) {
        this.filteredAdvisors = this.advisors.filter(advisor => advisor.region === this.selectedRegion);
      } else {
        this.filteredAdvisors = [];
      }
    } else if (this.selectedCompany === 'VARROC') {
      if (this.selectedZone) {
        this.filteredAdvisors = this.advisors.filter(advisor => advisor.region === this.selectedZone);
      } else {
        this.filteredAdvisors = [];
      }
    }
    this.selectedAdvisor = '';
  }

  public drawRoute(locations: GeoLocation[]) {
    const token = this.revision;
    const positions = locations.map(l => this.position(l)).filter(p => p !== null);
    if (!positions.length) {
      this.routeMessage = 'Los registros no contienen coordenadas válidas.';
      return;
    }
    this.fitRoute();
    if (positions.length < 2) { this.routeMessage = 'Solo hay un punto válido: no se puede calcular una ruta.'; return; }
    this.routeLoading = true;
    this.routeClass.computeRoutes({
      origin: positions[0], destination: positions[positions.length - 1],
      intermediates: positions.slice(1, -1).map(p => ({ location: p })),
      travelMode: 'DRIVING', optimizeWaypointOrder: false, fields: ['path']
    }).then((result: any) => this.zone.run(() => {
      if (this.destroyed || token !== this.revision) { return; }
      this.routeLoading = false;
      if (!result.routes || !result.routes.length) {
        this.routeMessage = 'No se encontró una ruta por vías entre estas marcaciones.';
        return;
      }
      this.polylines = result.routes[0].createPolylines();
      this.polylines.forEach(line => {
        line.setOptions({ strokeColor: '#2563eb', strokeOpacity: 0.9, strokeWeight: 5 });
        line.setMap(this.googleMap);
      });
      const bounds = new google.maps.LatLngBounds();
      result.routes[0].path.forEach((p: any) => bounds.extend(p));
      this.googleMap.fitBounds(bounds, 40);
    })).catch((error: any) => this.zone.run(() => {
      if (this.destroyed || token !== this.revision) { return; }
      this.routeLoading = false;
      this.routeMessage = 'No se pudo calcular la ruta. Revisa Routes API, facturación y restricciones de la clave. Las marcaciones siguen disponibles.';
    }));
  }

  public countUploadedOrders(locations: GeoLocation[]) {
    let ordersAssembled = 0;
    for (const location of locations) {
      if (location.docType === 'P') {
        ordersAssembled++;
      }
    }
    this.ordersUploads = ordersAssembled;
  }

  public countSavedOrders(locations: GeoLocation[]) {
    let savedOrders = 0;
    for (const location of locations) {
      if (location.docType === 'G') {
        savedOrders++;
      }
    }
    this.savedOrders = savedOrders;
  }

  public getFirstRecord(locations: GeoLocation[]) {
    let firstLogin: string = '';
    for (const location of locations) {
      const timeDocument = this.parseTimestamp2(location.docTime);
      if (!firstLogin || timeDocument < firstLogin) {
        firstLogin = timeDocument;
      }
    }
    this.firstRegister = firstLogin;
  }

  public getLastSync(locations: GeoLocation[]) {
    let lastSync: string = '';
    for (const location of locations) {
      if (location.docType === 'S') {
        const timeSynchronization = this.parseTimestamp2(location.docTime);
        if (!lastSync || timeSynchronization > lastSync) {
          lastSync = timeSynchronization;
        }
      }
    }
    this.lastSynchronizationAdvisor = lastSync;
  }

  public getLastHour(locations: GeoLocation[]) {
    let lastHour: string = '';
    for (const location of locations) {
      if (!lastHour || location.docTime > lastHour) {
        lastHour = location.docTime;
      }
    }
    this.time = this.parseTimestamp2(lastHour);
  }

  public calculateDistance(locations: GeoLocation[]): number {
    let totalDistance = 0;
    function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      return distance;
    }
    for (let i = 0; i < locations.length - 1; i++) {
      const location1 = locations[i];
      const location2 = locations[i + 1];
      if (!this.position(location1) || !this.position(location2)) { continue; }
      const lat1 = parseFloat(location1.latitude);
      const lon1 = parseFloat(location1.longitude);
      const lat2 = parseFloat(location2.latitude);
      const lon2 = parseFloat(location2.longitude);
      if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
        continue;
      }
      const segmentDistance = haversineDistance(lat1, lon1, lat2, lon2);
      totalDistance += segmentDistance;
    }
    this.distance = totalDistance;
    return totalDistance;
  }

  private parseTimestamp2(timestamp: string): string {
    if (!timestamp) {
      return '';
    }
    const hour = timestamp.substring(0, 2);
    const minute = timestamp.substring(2, 4);
    return `${hour}:${minute}`;
  }

  public getOrderData() {
    this.requestSubscriptions.push(this._businessPartnerService.getGeoLocationSalesData(this.selectedCompany, this.year, this.month, this.day, this.selectedAdvisor).subscribe(
      response => {
        if (response.code === 0) {
          const data = response.content && response.content[0];
          if (!data) { this.salesError = 'No hay datos de venta para esta consulta.'; return; }
          this.salesData.advisor = data.advisor;
          this.salesData.totalInvoiced = data.totalInvoiced;
          this.salesData.totalOrders = data.totalOrders;
        } else {
          this.salesError = 'No se pudieron cargar los datos de venta diaria.';
        }
      },
      error => {
        this.salesError = 'No se pudieron cargar los datos de venta diaria.';
        this.redirectIfSessionInvalid(error);
      }
    ));
  }

  public clear() {
    this.selectedRegion = '';
    this.selectedAdvisor = '';
    this.selectedZone = '';
    this.filteredAdvisors = [];
    this.locations = [];
    this.changeLocationErrorMessage = '';
    this.enabledbutton = true;
    this.salesData = new GeoLocationSalesData();
    this.revision++;
    this.requestSubscriptions.forEach(s => s.unsubscribe());
    this.requestSubscriptions = [];
    this.resetOverlays();
    this.isLoading = false;
    this.routeLoading = false;
    this.routeMessage = '';
    this.salesError = '';
    this.searched = false;
    this.locationsToDraw = [];
    this.selectedLocationIndex = -1;
    this.distance = 0;
    this.ordersUploads = 0;
    this.savedOrders = 0;
    this.firstRegister = '';
    this.lastSynchronizationAdvisor = '';
    this.time = '';
    if (this.googleMap) {
      this.googleMap.setCenter({ lat: 6.125338, lng: -75.630844 }); this.googleMap.setZoom(5);
    }
  }
}
