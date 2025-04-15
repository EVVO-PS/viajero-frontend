import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Trip } from '../../models/trip.model';
import { Destination } from '../../models/destination.model';
import { TripService } from '../../services/trip.service';
import { CountryService } from '../../services/country.service';
import { Country } from '../../models/country.model';
import { AuthService } from '../../auth/models/services/auth.service';
import { User } from '../../auth/models/user.model';
import { ThemeService } from '../../services/theme.services';

import { NgFor, DatePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-trip-dashboard',
  templateUrl: './trip-dashboard.component.html',
  styleUrls: ['./trip-dashboard.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, NgFor, DatePipe]
})
export class TripDashboardComponent implements OnInit, AfterViewInit {
  currentUser: User | null = null

  trip: Trip = { 
    name: '', 
    fecha_inicio: undefined, 
    fecha_fin: undefined, 
    destinations: [] 
  };
  
  // Nuevo destino
  newDestination: Destination = { 
    trip_id: 0, 
    name: '', 
    country: '', 
    fecha_inicio: undefined, 
    fecha_fin: undefined,
    days: 0
  };
  
  // Lista de viajes creados
  createdTrips: Trip[] = [];
  
  // Estado de la aplicación
  isEditingTrip: boolean = false;
  selectedTripId: number | null = null;
  destinationSectionEnabled: boolean = false;
  
  // Control de cambios sin guardar
  originalTrip: string = '';
  hasUnsavedChanges: boolean = false;
  
  // Edición de destinos
  editingDestination: Destination | null = null;
  editDestinationForm: { 
    name: string, 
    country: string, 
    fecha_inicio: Date | string | undefined, 
    fecha_fin: Date | string | undefined,
    days: number 
  } = { 
    name: '', 
    country: '', 
    fecha_inicio: undefined, 
    fecha_fin: undefined,
    days: 0 
  };
  
  // Búsqueda de países
  countries: Country[] = [];
  filteredCountries: Country[] = [];
  showCountrySuggestions: boolean = false;
  isLoadingCountries: boolean = false;
  destinationsOutOfRange: Destination[] = [];
  showOutOfRangeModal: boolean = false;
  
  constructor(
    private readonly tripService: TripService,
    private readonly countryService: CountryService,
    private readonly authService: AuthService,
    private readonly router: Router,
    public readonly themeService: ThemeService,

  ) {}

  ngOnInit(): void {
    this.loadAllTrips();
    
    // Cargar los países al inicializar el componente
    this.countryService.loadCountries().subscribe(countries => {
      this.countries = countries;
    });

    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user
    })
  }

  ngAfterViewInit(): void {
    this.applyTextColor()
    
  }

  toggleTheme(): void {
    this.themeService.toggleTheme()
    this.applyTextColor()

  }

  applyTextColor(): void {
    const isDark = this.themeService.isDarkTheme()
    const descriptions = document.querySelectorAll('.descripcion')
    const footer = document.querySelector('.app-footer')
  
    descriptions.forEach(el => {
      if (isDark) {
        el.classList.add('dark-text')
      } else {
        el.classList.remove('dark-text')
      }
    })
  
    if (footer) {
      if (isDark) {
        footer.classList.add('dark-footer')
      } else {
        footer.classList.remove('dark-footer')
      }
    }
  }
  
  

  // Método auxiliar para formatear fechas para los atributos min/max de los inputs de fecha (corregido)
formatDateForInput(date: Date | string | undefined): string {
  if (!date) return '';
  
  try {
    if (typeof date === 'string') {
      // Si ya es una string en formato YYYY-MM-DD, la devolvemos directamente
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      
      // Si es una string en otro formato, la convertimos a Date
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return '';
      }
      
      // Formatear la fecha como YYYY-MM-DD
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } else {
      // Si es un objeto Date, lo convertimos a string en formato YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (error) {
    console.error('Error al formatear fecha para input:', error, date);
    return '';
  }
}

// Método para cargar todos los viajes
loadAllTrips(): void {
  this.tripService.getAllTrips().subscribe({
    next: (trips) => {
      this.createdTrips = trips.map(trip => {
        // Convertir fechas de string a Date
        if (trip.fecha_inicio && typeof trip.fecha_inicio === 'string') {
          trip.fecha_inicio = new Date(trip.fecha_inicio);
        }
        if (trip.fecha_fin && typeof trip.fecha_fin === 'string') {
          trip.fecha_fin = new Date(trip.fecha_fin);
        }
        return trip;
      });
    },
    error: (error) => {
      console.error('Error al cargar los viajes:', error);
    }
  });
}

  // Método para calcular días entre dos fechas (corregido)
calculateDays(startDate: Date | string | undefined, endDate: Date | string | undefined): number {
  if (!startDate || !endDate) return 0;
  
  // Convertir a objetos Date si son strings
  const start = typeof startDate === 'string' ? new Date(startDate) : new Date(startDate);
  const end = typeof endDate === 'string' ? new Date(endDate) : new Date(endDate);
  
  // Establecer las horas, minutos, segundos y milisegundos a 0 para comparar solo las fechas
  const startDay = new Date(start);
  startDay.setHours(0, 0, 0, 0);
  
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);
  
  // Calcular la diferencia en días
  const diffTime = Math.abs(endDay.getTime() - startDay.getTime());
  // Añadir 1 para incluir el día de inicio y el día de fin
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  return diffDays;
}

  // Método para calcular los días totales del viaje
  calculateTripDays(): void {
    if (this.trip.fecha_inicio && this.trip.fecha_fin) {
      const startDate = new Date(this.trip.fecha_inicio);
      const endDate = new Date(this.trip.fecha_fin);
      
      if (endDate >= startDate) {
        // Usar el mismo método de cálculo que para los destinos
        this.trip.total_days = this.calculateDays(startDate, endDate);
      } else {
        // Si la fecha de fin es anterior a la de inicio, resetear total_days
        this.trip.total_days = 0;
      }
    } else {
      // Si falta alguna fecha, resetear total_days
      this.trip.total_days = 0;
    }
  }
  // Método para verificar si hay cambios sin guardar
  checkForUnsavedChanges(): boolean {
    if (!this.isEditingTrip) return false;
    
    const currentTripString = JSON.stringify({
      name: this.trip.name,
      fecha_inicio: this.trip.fecha_inicio,
      fecha_fin: this.trip.fecha_fin
    });
    
    return currentTripString !== this.originalTrip;
  }

  // Método para guardar el estado original del viaje
  saveOriginalTripState() {
    this.originalTrip = JSON.stringify({
      name: this.trip.name,
      fecha_inicio: this.trip.fecha_inicio,
      fecha_fin: this.trip.fecha_fin
    });
    this.hasUnsavedChanges = false;
  }

  // Método para marcar que hay cambios sin guardar
  markAsChanged() {
    this.hasUnsavedChanges = true;
  }

  // Método para validar si una fecha es futura
  isFutureDate(date: Date | string | null): boolean {
    if (!date) return false;
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    
    // Establecer las horas, minutos, segundos y milisegundos a 0 para comparar solo las fechas
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(dateObj);
    dateToCheck.setHours(0, 0, 0, 0);
    
    return dateToCheck >= today;
  }

  // Método para validar que las fechas de destino estén dentro del rango del viaje
validateDestinationDates(startDate: Date | string | undefined, endDate: Date | string | undefined): boolean {
  if (!startDate || !endDate || !this.trip.fecha_inicio || !this.trip.fecha_fin) {
      return false;
  }

  // Convertir todas las fechas a objetos Date y normalizar
  const destStartDate = this.normalizeDate(startDate);
  const destEndDate = this.normalizeDate(endDate);
  const tripStartDate = this.normalizeDate(this.trip.fecha_inicio);
  const tripEndDate = this.normalizeDate(this.trip.fecha_fin);

  // Verificar que las fechas sean válidas
  if (!destStartDate || !destEndDate || !tripStartDate || !tripEndDate) {
      console.error('Fechas inválidas en validateDestinationDates', {
          destStartDate, destEndDate, tripStartDate, tripEndDate
      });
      return false;
  }

  // Comparar las fechas como timestamps
  const destStartTime = destStartDate.getTime();
  const destEndTime = destEndDate.getTime();
  const tripStartTime = tripStartDate.getTime();
  const tripEndTime = tripEndDate.getTime();

  // Verificar que las fechas del destino estén dentro del rango del viaje
  // Permitimos que la fecha de inicio del destino sea igual a la fecha de inicio del viaje
  // y que la fecha de fin del destino sea igual a la fecha de fin del viaje
  const isValid = destStartTime >= tripStartTime && destEndTime <= tripEndTime;

  // Imprimir para depuración
  console.log('Validando fechas:', {
      destStart: destStartDate.toISOString().split('T')[0],
      destEnd: destEndDate.toISOString().split('T')[0],
      tripStart: tripStartDate.toISOString().split('T')[0],
      tripEnd: tripEndDate.toISOString().split('T')[0],
      destStartTime,
      tripStartTime,
      destEndTime,
      tripEndTime,
      isValid
  });

  return isValid;
}

  
  // Método auxiliar para normalizar fechas (eliminar la parte de tiempo)
normalizeDate(date: Date | string | undefined): Date | null {
  if (!date) return null;
  
  try {
      let dateObj: Date;
      
      if (typeof date === 'string') {
          // Si es una fecha en formato ISO (YYYY-MM-DD), crear un objeto Date
          if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
              // Crear la fecha a las 00:00:00 para evitar problemas de zona horaria
              const [year, month, day] = date.split('-').map(Number);
              dateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
          } else {
              // Si es otro formato, usar el constructor Date
              dateObj = new Date(date);
              // Normalizar a 00:00:00
              dateObj.setHours(0, 0, 0, 0);
          }
      } else {
          // Si ya es un objeto Date, crear uno nuevo con solo la fecha
          dateObj = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
      }
      
      // Verificar si la fecha es válida
      if (isNaN(dateObj.getTime())) {
          console.error('Fecha inválida:', date);
          return null;
      }
      
      return dateObj;
  } catch (error) {
      console.error('Error al normalizar fecha:', error, date);
      return null;
  }
}
  // Método para crear un nuevo viaje
createTrip() {
  // Validar que todos los campos requeridos estén completos
  if (!this.trip.name.trim()) {
    alert('Por favor, ingresa un nombre para el viaje');
    return;
  }
  
  if (!this.trip.fecha_inicio || !this.trip.fecha_fin) {
    alert('Por favor, selecciona las fechas de inicio y fin del viaje');
    return;
  }
  
  // Normalizar las fechas para evitar problemas de zona horaria
  const startDate = this.normalizeDate(this.trip.fecha_inicio);
  const endDate = this.normalizeDate(this.trip.fecha_fin);
  
  if (!startDate || !endDate) {
    alert('Las fechas seleccionadas no son válidas');
    return;
  }
  
  if (endDate.getTime() < startDate.getTime()) {
    alert('La fecha de fin debe ser posterior a la fecha de inicio');
    return;
  }
  
  // Validar que las fechas sean futuras
  if (!this.isFutureDate(startDate)) {
    alert('La fecha de inicio del viaje debe ser futura. Por favor, selecciona una fecha a partir de hoy.');
    return;
  }
  
  // Calcular los días totales
  this.calculateTripDays();
  
  // MODIFICACIÓN: Asegurarnos de que las fechas se envían correctamente
  // Convertir las fechas a formato ISO pero preservando la fecha exacta
  const isoStartDate = this.formatDateForBackend(startDate);
  const isoEndDate = this.formatDateForBackend(endDate);
  
  console.log('Fechas originales:', {
    inicio: this.formatDate(this.trip.fecha_inicio),
    fin: this.formatDate(this.trip.fecha_fin)
  });
  
  console.log('Fechas normalizadas:', {
    inicio: this.formatDate(startDate),
    fin: this.formatDate(endDate)
  });
  
  console.log('Fechas ISO para backend:', {
    inicio: isoStartDate,
    fin: isoEndDate
  });
  
  // Crear una copia del viaje para enviar al servidor
  const tripToSend = {
    ...this.trip,
    fecha_inicio: isoStartDate,
    fecha_fin: isoEndDate
  };
  
  // Crear un nuevo viaje
  this.tripService.createTrip(tripToSend).subscribe({
    next: (response) => {
      // Verificar que las fechas se hayan guardado correctamente
      console.log('Viaje creado:', response);
      console.log('Fechas guardadas:', {
        inicio: this.formatDate(response.fecha_inicio),
        fin: this.formatDate(response.fecha_fin)
      });
      
      // Actualizar el viaje actual con la respuesta del servidor (incluye el ID)
      this.trip = response;
      
      // Actualizar el estado para indicar que estamos editando un viaje
      this.isEditingTrip = true;
      this.selectedTripId = response.id!;
      
      // Habilitar la sección de destinos
      this.destinationSectionEnabled = true;
      
      // Guardar el estado original del viaje
      this.saveOriginalTripState();
      
      // Actualizar la lista de viajes
      this.loadAllTrips();
      
      alert('Viaje creado con éxito! Ahora puedes añadir destinos.');
    },
    error: (error) => {
      console.error('Error al crear el viaje:', error);
      alert('Error al crear el viaje. Por favor, inténtalo de nuevo.');
    }
  });
}

// Nuevo método para formatear fechas específicamente para el backend
formatDateForBackend(date: Date | string | undefined): string {
  if (!date) return '';
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Si es una fecha en formato ISO (YYYY-MM-DD), crear un objeto Date
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = date.split('-').map(Number);
        // Usar UTC para evitar problemas de zona horaria
        dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      } else {
        // Si es otro formato, usar el constructor Date
        dateObj = new Date(date);
      }
    } else {
      // Si ya es un objeto Date, crear uno nuevo con UTC
      dateObj = new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        12, 0, 0
      ));
    }
    
    // Verificar si la fecha es válida
    if (isNaN(dateObj.getTime())) {
      console.error('Fecha inválida para backend:', date);
      return '';
    }
    
    // Formatear la fecha como YYYY-MM-DD
    // Usamos toISOString() que da formato UTC y luego tomamos solo la parte de la fecha
    return dateObj.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error al formatear fecha para backend:', error, date);
    return '';
  }
}

  // Método para guardar el viaje actual
saveCurrentTrip() {
  if (!this.trip.id) return;
  
  // Validar fechas
  if (!this.trip.fecha_inicio || !this.trip.fecha_fin) {
    alert('Por favor, selecciona las fechas de inicio y fin del viaje');
    return;
  }
  
  // Normalizar las fechas para evitar problemas de zona horaria
  const startDate = this.normalizeDate(this.trip.fecha_inicio);
  const endDate = this.normalizeDate(this.trip.fecha_fin);
  
  if (!startDate || !endDate) {
    alert('Las fechas seleccionadas no son válidas');
    return;
  }
  
  if (endDate.getTime() < startDate.getTime()) {
    alert('La fecha de fin debe ser posterior a la fecha de inicio');
    return;
  }
  
  // Calcular los días totales
  this.calculateTripDays();
  
  // Convertir las fechas a formato ISO pero preservando la fecha exacta
  const isoStartDate = this.formatDateForBackend(startDate);
  const isoEndDate = this.formatDateForBackend(endDate);
  
  // Crear una copia del viaje para enviar al servidor
  const tripToSend = {
    ...this.trip,
    fecha_inicio: isoStartDate,
    fecha_fin: isoEndDate
  };
  
  console.log('Guardando viaje con fechas:', {
    inicio: isoStartDate,
    fin: isoEndDate
  });
  
  this.tripService.updateTrip(tripToSend).subscribe({
    next: (response) => {
      console.log('Viaje guardado:', response);
      console.log('Fechas guardadas:', {
        inicio: this.formatDate(response.fecha_inicio),
        fin: this.formatDate(response.fecha_fin)
      });
      
      // Actualizar el viaje con la respuesta del servidor
      this.trip = response;
      
      // Mantener el estado de edición
      this.isEditingTrip = true;
      this.selectedTripId = response.id!;
      this.destinationSectionEnabled = true;
      
      // Guardar el estado original del viaje después de guardar
      this.saveOriginalTripState();
      
      // Recargar la lista de viajes
      this.loadAllTrips();
      
      alert('Viaje guardado con éxito!');
    },
    error: (error) => {
      console.error('Error al guardar el viaje:', error);
      alert('Error al guardar el viaje. Por favor, inténtalo de nuevo.');
    }
  });
}
  // Método para salir de la edición
  exitEditing() {
    // Verificar si hay cambios sin guardar
    if (this.hasUnsavedChanges || this.checkForUnsavedChanges()) {
      const confirmDialog = confirm('Hay cambios sin guardar. ¿Deseas guardarlos antes de salir?');
      
      if (confirmDialog) {
        // Guardar cambios y luego salir
        this.tripService.updateTrip(this.trip).subscribe({
          next: () => {
            this.resetEditing();
            this.loadAllTrips();
          },
          error: (error) => {
            console.error('Error al guardar el viaje:', error);
            alert('Error al guardar el viaje. ¿Deseas salir sin guardar?');
            
            if (confirm('¿Deseas salir sin guardar los cambios?')) {
              this.resetEditing();
            }
          }
        });
      } else {
        // Salir sin guardar
        this.resetEditing();
      }
    } else {
      // No hay cambios, simplemente salir
      this.resetEditing();
    }
  }
  
  // Método para reiniciar el estado de edición
  resetEditing() {
    this.trip = { 
      name: '', 
      fecha_inicio: undefined, 
      fecha_fin: undefined, 
      destinations: [] 
    };
    this.isEditingTrip = false;
    this.selectedTripId = null;
    this.destinationSectionEnabled = false;
    this.hasUnsavedChanges = false;
    this.originalTrip = '';
    this.editingDestination = null;
  }

  // Método para seleccionar un viaje existente
  selectTrip(trip: Trip) {
    // Verificar si hay cambios sin guardar en el viaje actual
    if (this.isEditingTrip && (this.hasUnsavedChanges || this.checkForUnsavedChanges())) {
      const confirmDialog = confirm('Hay cambios sin guardar. ¿Deseas guardarlos antes de cambiar de viaje?');
      
      if (confirmDialog) {
        // Guardar cambios y luego cambiar
        this.tripService.updateTrip(this.trip).subscribe({
          next: () => {
            this.loadSelectedTrip(trip);
          },
          error: (error) => {
            console.error('Error al guardar el viaje:', error);
            
            if (confirm('Error al guardar. ¿Deseas cambiar de viaje sin guardar los cambios?')) {
              this.loadSelectedTrip(trip);
            }
          }
        });
      } else {
        // Cambiar sin guardar
        this.loadSelectedTrip(trip);
      }
    } else {
      // No hay cambios, simplemente cambiar
      this.loadSelectedTrip(trip);
    }
  }
  
  // Método para cargar un viaje seleccionado
  loadSelectedTrip(trip: Trip) {
    this.tripService.getTrip(trip.id!).subscribe({
      next: (loadedTrip) => {
        this.trip = loadedTrip;
        this.isEditingTrip = true;
        this.selectedTripId = loadedTrip.id!;
        this.destinationSectionEnabled = true;
        
        // Guardar el estado original del viaje
        this.saveOriginalTripState();
      },
      error: (error) => {
        console.error('Error al cargar el viaje:', error);
        alert('Error al cargar el viaje. Por favor, inténtalo de nuevo.');
      }
    });
  }

  // Método para añadir un destino
 // Método para añadir un destino (corregido)
// Método para añadir un destino
addDestination() {
  if (!this.trip.id) {
    alert('Primero debes crear un viaje');
    return;
  }
  
  if (this.newDestination.name && this.newDestination.country && 
      this.newDestination.fecha_inicio && this.newDestination.fecha_fin) {
    
    // Validar que la fecha de fin sea posterior a la de inicio
    const startDate = this.normalizeDate(this.newDestination.fecha_inicio);
    const endDate = this.normalizeDate(this.newDestination.fecha_fin);
    
    if (!startDate || !endDate) {
      alert('Las fechas seleccionadas no son válidas');
      return;
    }
    
    if (endDate.getTime() < startDate.getTime()) {
      alert('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }
    
    // Imprimir para depuración
    console.log('Fechas del viaje:', {
      inicio: this.formatDate(this.trip.fecha_inicio),
      fin: this.formatDate(this.trip.fecha_fin)
    });
    
    console.log('Fechas del destino:', {
      inicio: this.formatDate(startDate),
      fin: this.formatDate(endDate)
    });
    
    // Validar que las fechas estén dentro del rango del viaje
    if (!this.validateDestinationDates(startDate, endDate)) {
      alert('Las fechas del destino deben estar dentro del rango del viaje (desde ' + 
            this.formatDate(this.trip.fecha_inicio) + ' hasta ' + 
            this.formatDate(this.trip.fecha_fin) + ')');
      return;
    }
    
    // Verificar superposición con otros destinos
    if (this.checkDateOverlap(startDate, endDate)) {
      alert('Las fechas seleccionadas se superponen con otro destino. Por favor, elige fechas diferentes.');
      return;
    }
    
    // Calcular los días correctamente
    const days = this.calculateDays(startDate, endDate);
    
    // Guardar las fechas originales para usarlas después
    const originalStartDate = typeof this.newDestination.fecha_inicio === 'string' 
      ? this.newDestination.fecha_inicio 
      : this.formatDateForInput(this.newDestination.fecha_inicio);
    
    const originalEndDate = typeof this.newDestination.fecha_fin === 'string' 
      ? this.newDestination.fecha_fin 
      : this.formatDateForInput(this.newDestination.fecha_fin);
    
    // Crear una copia del objeto destino con las fechas correctas
    const destinationToSend = {
      ...this.newDestination,
      trip_id: this.trip.id,
      days: days,
      fecha_inicio: originalStartDate,
      fecha_fin: originalEndDate
    };
    
    console.log('Enviando destino:', destinationToSend);
    
    // Guardar el destino en el backend
    this.tripService.addDestination(destinationToSend).subscribe({
      next: (response) => {
        console.log('Destino añadido:', response);
        
        // Crear un nuevo objeto con las fechas originales
        const destinationWithCorrectDates: Destination = {
          ...response,
          fecha_inicio: originalStartDate,
          fecha_fin: originalEndDate,
          days: days
        };
        
        // Añadir el destino a la lista local
        this.trip.destinations.push(destinationWithCorrectDates);
        
        // Reiniciar el formulario de destino
        this.newDestination = { 
          trip_id: this.trip.id!, 
          name: '', 
          country: '', 
          fecha_inicio: undefined, 
          fecha_fin: undefined,
          days: 0
        };
      },
      error: (error) => {
        console.error('Error al añadir el destino:', error);
        alert(`Error al añadir el destino: ${error.message || 'Error desconocido'}`);
      }
    });
  } else {
    alert('Por favor, completa todos los campos del destino');
  }
}


  // Método para eliminar un destino
  removeDestination(dest: Destination) {
    // Confirmar antes de eliminar
    if (!confirm('¿Está seguro de que desea eliminar este destino?')) {
      return;
    }
    
    // Si el destino tiene ID, lo eliminamos del backend
    if (dest.id) {
      this.tripService.deleteDestination(dest.id).subscribe({
        next: (deletedDestination) => {
          console.log('Destino eliminado:', deletedDestination);
          // Eliminar el destino de la lista local
          this.trip.destinations = this.trip.destinations.filter(d => d.id !== dest.id);
        },
        error: (error) => {
          console.error('Error al eliminar el destino:', error);
          alert('Error al eliminar el destino. Por favor, inténtalo de nuevo.');
        }
      });
    } else {
      // Si el destino no tiene ID, solo lo eliminamos localmente
      this.trip.destinations = this.trip.destinations.filter(d => d !== dest);
    }
  }

  // Método para iniciar la edición de un destino
  startEditingDestination(dest: Destination) {
    this.editingDestination = dest;
    this.editDestinationForm = {
      name: dest.name,
      country: dest.country,
      fecha_inicio: dest.fecha_inicio,
      fecha_fin: dest.fecha_fin,
      days: dest.days || 0
    };
  }

  // Método para cancelar la edición
  cancelEditingDestination() {
    this.editingDestination = null;
  }

  // Método para guardar los cambios en un destino (corregido)
saveDestinationChanges() {
  if (!this.editingDestination || !this.editingDestination.id) return;
  
  // Validar que los campos no estén vacíos
  if (!this.editDestinationForm.name || !this.editDestinationForm.country || 
      !this.editDestinationForm.fecha_inicio || !this.editDestinationForm.fecha_fin) {
    alert('Por favor, completa todos los campos correctamente');
    return;
  }
  
  // Validar que la fecha de fin sea posterior a la de inicio
  const startDate = this.normalizeDate(this.editDestinationForm.fecha_inicio);
  const endDate = this.normalizeDate(this.editDestinationForm.fecha_fin);
  
  if (!startDate || !endDate) {
    alert('Las fechas seleccionadas no son válidas');
    return;
  }
  
  if (endDate.getTime() < startDate.getTime()) {
    alert('La fecha de fin debe ser posterior a la fecha de inicio');
    return;
  }
  
  // Validar que las fechas estén dentro del rango del viaje
  if (!this.validateDestinationDates(startDate, endDate)) {
    alert('Las fechas del destino deben estar dentro del rango del viaje (desde ' + 
          this.formatDate(this.trip.fecha_inicio) + ' hasta ' + 
          this.formatDate(this.trip.fecha_fin) + ')');
    return;
  }
  
  // Verificar superposición con otros destinos (excluyendo el destino actual)
  if (this.checkDateOverlap(startDate, endDate, this.editingDestination.id)) {
    alert('Las fechas seleccionadas se superponen con otro destino. Por favor, elige fechas diferentes.');
    return;
  }
  
  // Calcular los días correctamente
  const days = this.calculateDays(startDate, endDate);
  
  // Guardar las fechas originales para usarlas después
  const originalStartDate = typeof this.editDestinationForm.fecha_inicio === 'string' 
    ? this.editDestinationForm.fecha_inicio 
    : this.formatDateForInput(this.editDestinationForm.fecha_inicio);
  
  const originalEndDate = typeof this.editDestinationForm.fecha_fin === 'string' 
    ? this.editDestinationForm.fecha_fin 
    : this.formatDateForInput(this.editDestinationForm.fecha_fin);
  
  // Crear el objeto de destino actualizado con todos los campos necesarios
  const updatedDestination: Partial<Destination> = {
    name: this.editDestinationForm.name,
    country: this.editDestinationForm.country,
    fecha_inicio: originalStartDate,
    fecha_fin: originalEndDate,
    days: days,
    trip_id: this.editingDestination.trip_id
  };
  
  console.log('Actualizando destino:', updatedDestination);
  
  this.tripService.updateDestination(this.editingDestination.id, updatedDestination).subscribe({
    next: (response) => {
      console.log('Destino actualizado:', response);
      
      // Crear un nuevo objeto con las fechas originales
      const destinationWithCorrectDates: Destination = {
        ...response,
        fecha_inicio: originalStartDate,
        fecha_fin: originalEndDate,
        days: days
      };
      
      // Actualizar el destino en la lista local
      const index = this.trip.destinations.findIndex(d => d.id === this.editingDestination!.id);
      if (index !== -1) {
        this.trip.destinations[index] = destinationWithCorrectDates;
      }
      
      // Salir del modo de edición
      this.editingDestination = null;
      
      // Marcar que hay cambios sin guardar en el viaje
      this.markAsChanged();
    },
    error: (error) => {
      console.error('Error al actualizar el destino:', error);
      alert('Error al actualizar el destino. Por favor, inténtalo de nuevo.');
    }
  });
}

  // Método para eliminar un viaje
  deleteTrip(trip: Trip, event: Event) {
    // Detener la propagación del evento para evitar que se seleccione el viaje
    event.stopPropagation();
    
    // Confirmar antes de eliminar
    if (!confirm(`¿Está seguro de que desea eliminar el viaje "${trip.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    
    // Si el viaje que se está eliminando es el que está en edición, salir del modo de edición
    if (this.selectedTripId === trip.id) {
      this.resetEditing();
    }
    
    this.tripService.deleteTrip(trip.id!).subscribe({
      next: (deletedTrip) => {
        console.log('Viaje eliminado:', deletedTrip);
        
        // Eliminar el viaje de la lista local
        this.createdTrips = this.createdTrips.filter(t => t.id !== trip.id);
        
        alert(`El viaje "${deletedTrip.name}" ha sido eliminado con éxito.`);
      },
      error: (error) => {
        console.error('Error al eliminar el viaje:', error);
        alert('Error al eliminar el viaje. Por favor, inténtalo de nuevo.');
      }
    });
  }

  // Método para calcular los días restantes
  remainingDays(): number {
    const usedDays = this.trip.destinations.reduce((sum, d) => {
      // Si el destino tiene days, usamos ese valor
      if (d.days) return sum + d.days;
      
      // Si no, calculamos los días a partir de las fechas
      if (d.fecha_inicio && d.fecha_fin) {
        return sum + this.calculateDays(d.fecha_inicio, d.fecha_fin);
      }
      
      return sum;
    }, 0);
    
    return (this.trip.total_days || 0) - usedDays;
  }

  // Método para formatear fechas
  // Método para formatear fechas (corregido)
formatDate(date: Date | string | undefined): string {
  if (!date) return 'Sin fecha';
  
  try {
    // Si es una string, intentar convertirla a Date
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Si es una fecha en formato ISO (YYYY-MM-DD), crear un objeto Date
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Crear la fecha a las 12:00 para evitar problemas de zona horaria
        const [year, month, day] = date.split('-').map(Number);
        dateObj = new Date(year, month - 1, day, 12, 0, 0);
      } else {
        // Si es otro formato, usar el constructor Date
        dateObj = new Date(date);
      }
    } else {
      // Si ya es un objeto Date, usarlo directamente
      dateObj = new Date(date);
    }
    
    // Verificar si la fecha es válida
    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }
    
    // Formatear la fecha usando el método toLocaleDateString
    return dateObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error al formatear fecha:', error, date);
    return 'Error de fecha';
  }
}

  // Método para buscar países
  searchCountries(event: any): void {
    const searchTerm = event.target.value;
    
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredCountries = [];
      this.showCountrySuggestions = false;
      return;
    }
    
    this.isLoadingCountries = true;
    this.countryService.searchCountries(searchTerm).subscribe({
      next: (countries) => {
        this.filteredCountries = countries;
        this.showCountrySuggestions = countries.length > 0;
        this.isLoadingCountries = false;
      },
      error: (error) => {
        console.error('Error searching countries:', error);
        this.isLoadingCountries = false;
      }
    });
  }

  // Método para seleccionar un país
  selectCountry(country: Country): void {
    this.newDestination.country = country.name.common;
    this.showCountrySuggestions = false;
  }

  // Método para ocultar las sugerencias cuando se pierde el foco
  hideCountrySuggestions(): void {
    // Usar setTimeout para permitir que el clic en una sugerencia se procese primero
    setTimeout(() => {
      this.showCountrySuggestions = false;
    }, 200);
  }
  
  // Método para detectar cambios en los inputs
  onInputChange() {
    this.markAsChanged();
  }

checkDateOverlap(startDate: Date | string, endDate: Date | string, destinationId?: number): boolean {
  if (!startDate || !endDate) return false;
  
  // Normalizar las fechas para comparación
  const start = this.normalizeDate(startDate);
  const end = this.normalizeDate(endDate);
  
  if (!start || !end) return false;
  
  // Convertir a timestamps para comparación
  const startTime = start.getTime();
  const endTime = end.getTime();
  
  // Imprimir para depuración
  console.log('Verificando superposición para:', {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
    startTime,
    endTime
  });
  
  // Verificar superposición con cada destino existente
  for (const dest of this.trip.destinations) {
    // Omitir el destino actual si estamos editando
    if (destinationId && dest.id === destinationId) continue;
    
    // Normalizar las fechas del destino existente
    const destStart = this.normalizeDate(dest.fecha_inicio);
    const destEnd = this.normalizeDate(dest.fecha_fin);
    
    if (!destStart || !destEnd) continue;
    
    const destStartTime = destStart.getTime();
    const destEndTime = destEnd.getTime();
    
    // Imprimir para depuración
    console.log('Comparando con destino:', {
      name: dest.name,
      startDate: destStart.toISOString().split('T')[0],
      endDate: destEnd.toISOString().split('T')[0],
      destStartTime,
      destEndTime
    });
    
    const overlap = (
      // Inicio del nuevo dentro del rango del existente (excluyendo el día final)
      (startTime >= destStartTime && startTime < destEndTime) || 
      // Fin del nuevo dentro del rango del existente (excluyendo el día inicial)
      (endTime > destStartTime && endTime <= destEndTime) ||
      // Nuevo abarca completamente al existente
      (startTime < destStartTime && endTime > destEndTime)
    );
    
    // Caso especial: permitir que un destino comience el mismo día en que finaliza otro
    const isConsecutive = (startTime === destEndTime) || (endTime === destStartTime);
    
    if (overlap && !isConsecutive) {
      console.log('Superposición detectada con destino:', dest.name);
      return true;
    }
    
    // Verificar si las fechas de inicio son exactamente iguales
    if (startTime === destStartTime) {
      console.log('Fechas de inicio iguales detectadas con destino:', dest.name);
      return true;
    }
    
    // Verificar si las fechas de fin son exactamente iguales
    if (endTime === destEndTime) {
      console.log('Fechas de fin iguales detectadas con destino:', dest.name);
      return true;
    }
  }
  
  return false;
}

logout(): void {
  if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
    this.authService.logout()
    this.router.navigate(["/auth"])
  }
}

}