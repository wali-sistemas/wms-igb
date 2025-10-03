import { Component, OnInit } from '@angular/core';
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

export class GeoLocationComponent implements OnInit {
  public identity: any;
  private googleMap: any;
  private directionsService: any;
  private directionsRenderer: any;
  public markers: DailyMarkers[] = [];
  public markersWithQuantityZero: DailyMarkers[] = [];
  public markersWithQuantityGreaterThanZero: DailyMarkers[] = [];
  public advisors: Advisor[] = [];
  public filteredAdvisors: Advisor[] = [];
  public locations: GeoLocation[] = [];
  public salesData: GeoLocationSalesData = new GeoLocationSalesData();
  public filteredRegions: string[];
  public locationsToDraw: GeoLocation[] = [];
  public selectedCompany: string;
  public selectedAdvisor: string = '';
  public selectedRegion: string = '';
  public selectedZone: string = '';
  public year: string;
  public month: string;
  public day: string;
  public region: string = '';
  public changeLocationErrorMessage: string;
  public firstRegister: string;
  public lastSynchronizationAdvisor: string;
  public time: string;
  public distance: number;
  public ordersUploads: number;
  public savedOrders: number;
  public adviserCard: number = 0;
  public dateValue: Date;
  public enabledbutton: boolean = true;
  public tabActive: boolean = true;
  public tabInactive: boolean = false;
  public email: string;
  public activeList = this.markersWithQuantityZero;

  constructor(private _router: Router, private _userService: UserService, private _businessPartnerService: BusinessPartnerService) { }

  ngOnInit() {
    this.identity = this._userService.getItentity();
    if (this.identity === null) {
      this._router.navigate(['/']);
    }
    this.selectedCompany = this.identity.selectedCompany;
    this.initializeMap();
    this.email = this.identity.email.includes('telemer') ? this.identity.email : '*';
    this.getListOfAdvisors(this.email);
    this.getDailyMarks(this.selectedCompany);
  }

  private redirectIfSessionInvalid(error) {
    if (error && error.status && error.status == 401) {
      localStorage.removeItem('igb.identity');
      localStorage.removeItem('igb.selectedCompany');
      this._router.navigate(['/']);
    }
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

  private initializeMap() {
    const mapOptions = {
      center: { lat: 6.125338, lng: -75.630844 },
      zoom: 5,
    };
    this.googleMap = new google.maps.Map(
      document.getElementById('google-map'),
      mapOptions
    );
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: true });
    this.directionsRenderer.setMap(this.googleMap);
  }

  public getDateFormat(): void {
    const selectedDate = new Date(this.dateValue);
    this.year = selectedDate.getFullYear().toString();
    this.month = (selectedDate.getMonth() + 1).toString();
    this.day = (selectedDate.getDate() + 1).toString();
  }

  public getLocation() {
    $('#modal_transfer_process').modal({ backdrop: 'static', keyboard: false, show: true });
    this._businessPartnerService.getGeoLocation(this.selectedCompany, this.selectedAdvisor, this.year, this.month, this.day).subscribe(
      response => {
        if (response.code === 0) {
          if (response.content && response.content.length > 0) {
            this.locations = response.content;
            this.fixFormatTime(this.locations);
            this.locations.sort((a, b) => { return parseInt(a.docTime) - parseInt(b.docTime); });
            this.locationsToDraw = this.locations.slice(0, 26);
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
            this.changeLocationErrorMessage = '';
          } else {
            this.changeLocationErrorMessage = 'No se encontraron registros';
          }
        } else {
          this.changeLocationErrorMessage = 'Error al obtener la ubicación';
        }
      },
      error => {
        console.error('Error al obtener la ubicación:', error);
        this.changeLocationErrorMessage = 'Error al obtener la ubicación';
        this.redirectIfSessionInvalid(error);
      }
    );
    $('#modal_transfer_process').modal('hide');
  }

  getDailyMarks(selectedCompany: string) {
    this._businessPartnerService.listDailyMarks(selectedCompany).subscribe(
      response => {
        response.forEach(item => {
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
        console.error('Error al obtener la ubicación:', error);
        this.changeLocationErrorMessage = 'Error al obtener la lista de asesores';
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public getListOfAdvisors(email: string) {
    this._businessPartnerService.listAdvisors(email).subscribe(
      response => {
        this.advisors = response.map((item, index) => {
          return new Advisor(item[0], item[1], item[2], item[3], item[4]);
        });
        this.filteredRegions = Array.from(new Set(this.advisors.map(advisor => advisor.region)));
        if (this.region) {
          this.filteredAdvisors = this.advisors.filter(advisor => advisor.region === this.region);
        } else {
          this.filteredAdvisors = [];
        }
      },
      error => {
        console.error('Error al obtener la lista de asesores:', error);
        this.redirectIfSessionInvalid(error);
      }
    );
  }

  public addMarkersForOrders(locations: GeoLocation[]) {
    const ordersLocations = locations.filter(location => location.docType === 'P');
    ordersLocations.forEach(location => {
      const lat = Number(location.latitude) + 0.0002;
      const lng = Number(location.longitude) + 0.0002;
      const position = new google.maps.LatLng(lat, lng);
      const marker = new google.maps.Marker({
        position: position,
        map: this.googleMap,
        icon: {
          url: 'assets/images/sale.png',
          scaledSize: new google.maps.Size(35, 35)
        }
      });
    });
  }

  private fixFormatTime(locations: GeoLocation[]): void {
    for (const location of locations) {
      if (location.docTime.length < 4) {
        location.docTime = '0' + location.docTime;
      }
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
    const markers = locations.map(location => new google.maps.LatLng(Number(location.latitude), Number(location.longitude)));
    const start = markers[0];
    const end = markers[markers.length - 1];
    const waypoints = markers.slice(1, markers.length - 1).map(marcador => ({ location: marcador }));

    const request = {
      origin: start,
      destination: end,
      waypoints: waypoints,
      optimizeWaypoints: true,
      travelMode: 'DRIVING'
    };
    this.directionsService.route(request, (result, status) => {
      if (status === 'OK') {
        this.directionsRenderer.setDirections(result);
        const startMarker = new google.maps.Marker({
          position: start,
          map: this.googleMap,
          icon: {
            url: 'assets/images/inicio.png',
            scaledSize: new google.maps.Size(50, 50)
          }
        });
        const endMarker = new google.maps.Marker({
          position: end,
          map: this.googleMap,
          icon: {
            url: 'assets/images/fin.png',
            scaledSize: new google.maps.Size(50, 50)
          }
        });
        markers.forEach((marcador, index) => {
          if (index !== 0 && index !== markers.length - 1) {
            const marker = new google.maps.Marker({
              position: marcador,
              map: this.googleMap,
              icon: {
                url: 'assets/images/marker.png',
                scaledSize: new google.maps.Size(30, 30)
              },
              label: {
                text: (index + 1).toString(),
                color: 'white',
                fontWeight: 'bold',
                offset: new google.maps.Size(-5, 10)
              }
            });
          }
        });
      } else {
        this.changeLocationErrorMessage = 'Error al trazar la ruta, intentelo de nuevo.';
      }
    });
  }

  public countUploadedOrders(locations: GeoLocation[]): void {
    let ordersAssembled = 0;
    for (const location of locations) {
      if (location.docType === 'P') {
        ordersAssembled++;
      }
    }
    this.ordersUploads = ordersAssembled;
  }

  public countSavedOrders(locations: GeoLocation[]): void {
    let savedOrders = 0;
    for (const location of locations) {
      if (location.docType === 'G') {
        savedOrders++;
      }
    }
    this.savedOrders = savedOrders;
  }

  public getFirstRecord(locations: GeoLocation[]): void {
    let firstLogin: string = null;
    for (const location of locations) {
      const timeDocument = this.parseTimestamp2(location.docTime);
      if (!firstLogin || timeDocument < firstLogin) {
        firstLogin = timeDocument;
      }
    }
    this.firstRegister = firstLogin;
  }

  public getLastSync(locations: GeoLocation[]): void {
    let lastSync: string = null;
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

  public getLastHour(locations: GeoLocation[]): void {
    let lastHour: string = null;
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
      const distance = R * c; // Distancia en kilómetros
      return distance;
    }
    for (let i = 0; i < locations.length - 1; i++) {
      const location1 = locations[i];
      const location2 = locations[i + 1];
      const lat1 = parseFloat(location1.latitude);
      const lon1 = parseFloat(location1.longitude);
      const lat2 = parseFloat(location2.latitude);
      const lon2 = parseFloat(location2.longitude);

      totalDistance += haversineDistance(lat1, lon1, lat2, lon2);
    }
    this.distance = totalDistance;
    return totalDistance;
  }

  private parseTimestamp2(timestamp: string): string {
    const hour = timestamp.substring(0, 2);
    const minute = timestamp.substring(2, 4);
    return `${hour}:${minute}`;
  }

  public getOrderData() {
    this._businessPartnerService.getGeoLocationSalesData(this.selectedCompany, this.year, this.month, this.day, this.selectedAdvisor).subscribe(
      response => {
        if (response.code === 0) {
          const data = response.content[0];
          this.salesData.advisor = data.advisor;
          this.salesData.totalInvoiced = data.totalInvoiced;
          this.salesData.totalOrders = data.totalOrders;
        } else {
          this.changeLocationErrorMessage = "Error al obtener datos de la venta diaria";
        }
      }, error => {
        console.error('Error al obtener la ubicación:', error);
        this.changeLocationErrorMessage = 'Error al obtener datos de la venta diaria';
        this.redirectIfSessionInvalid(error);
      }
    )
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
    this.initializeMap();
  }
}
