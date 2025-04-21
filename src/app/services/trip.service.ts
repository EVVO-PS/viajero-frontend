import { Injectable } from "@angular/core"
import  { HttpClient, HttpErrorResponse } from "@angular/common/http"
import { Observable, throwError } from "rxjs"
import { catchError, map } from "rxjs/operators"
import { Trip } from "../models/trip.model"
import { Destination } from "../models/destination.model"
import { AuthService } from "../auth/models/services/auth.service"
import { environment } from "../environments/environment"

@Injectable({
  providedIn: "root",
})
export class TripService {
  private readonly baseUrl = environment.apiUrl
  private readonly tripsUrl = `${this.baseUrl}/api/trips`
  private readonly destinationsUrl = `${this.baseUrl}/api/destinations`

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
  ) {}

  private getAuthHeaders() {
    const token = this.authService.getToken()
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  }

  private handleError(error: HttpErrorResponse) {
    console.error("API Error:", error)

    let errorMessage = "Ocurrió un error en el servidor"
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`
    } else if (error.status === 401) {
      errorMessage = "Sesión expirada o no autorizada. Por favor, inicie sesión nuevamente."
      this.authService.logout()
    } else {
      errorMessage = `Código: ${error.status}, Mensaje: ${error.error?.detail || error.message}`
    }

    return throwError(() => new Error(errorMessage))
  }

  private formatDateForServer(trip: Trip): any {
    if (!trip) return trip

    const formattedTrip = { ...trip }

    // Formatear fecha_inicio
    if (formattedTrip.fecha_inicio) {
      if (formattedTrip.fecha_inicio instanceof Date) {
        const date = formattedTrip.fecha_inicio
        formattedTrip.fecha_inicio = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T00:00:00`
      } else if (typeof formattedTrip.fecha_inicio === "string" && !formattedTrip.fecha_inicio.includes("T")) {
        formattedTrip.fecha_inicio = `${formattedTrip.fecha_inicio}T00:00:00`
      }
    }

    if (formattedTrip.fecha_fin) {
      if (formattedTrip.fecha_fin instanceof Date) {
        const date = formattedTrip.fecha_fin
        formattedTrip.fecha_fin = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T00:00:00`
      } else if (typeof formattedTrip.fecha_fin === "string" && !formattedTrip.fecha_fin.includes("T")) {
        formattedTrip.fecha_fin = `${formattedTrip.fecha_fin}T00:00:00`
      }
    }

    return formattedTrip
  }


  private formatDestinationDatesForServer(destination: Partial<Destination>): any {
    if (!destination) return destination

    const formattedDestination = { ...destination }

    // Formatear fecha_inicio
    if (formattedDestination.fecha_inicio) {
      if (formattedDestination.fecha_inicio instanceof Date) {
        const date = formattedDestination.fecha_inicio
        formattedDestination.fecha_inicio = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
      } else if (
        typeof formattedDestination.fecha_inicio === "string" &&
        !formattedDestination.fecha_inicio.match(/^\d{4}-\d{2}-\d{2}$/)
      ) {
        const date = new Date(formattedDestination.fecha_inicio)
        formattedDestination.fecha_inicio = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
      }
    }

    // Formatear fecha_fin
    if (formattedDestination.fecha_fin) {
      if (formattedDestination.fecha_fin instanceof Date) {
        const date = formattedDestination.fecha_fin
        formattedDestination.fecha_fin = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
      } else if (
        typeof formattedDestination.fecha_fin === "string" &&
        !formattedDestination.fecha_fin.match(/^\d{4}-\d{2}-\d{2}$/)
      ) {
        const date = new Date(formattedDestination.fecha_fin)
        formattedDestination.fecha_fin = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
      }
    }

    return formattedDestination
  }

  // Update the getAllTrips method
  getAllTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.tripsUrl}/`, this.getAuthHeaders()).pipe(
      map((trips) => {
        // Procesar las fechas de los viajes
        return trips.map((trip) => {
          // Convertir fechas de string a Date
          if (trip.fecha_inicio && typeof trip.fecha_inicio === "string") {
            try {
              trip.fecha_inicio = new Date(trip.fecha_inicio)
            } catch (error) {
              console.error("Error al convertir fecha_inicio:", error)
            }
          }
          if (trip.fecha_fin && typeof trip.fecha_fin === "string") {
            try {
              trip.fecha_fin = new Date(trip.fecha_fin)
            } catch (error) {
              console.error("Error al convertir fecha_fin:", error)
            }
          }
          return trip
        })
      }),
      catchError(this.handleError.bind(this)),
    )
  }

  getTrip(id: number): Observable<Trip> {
    return this.http.get<Trip>(`${this.tripsUrl}/${id}`, this.getAuthHeaders()).pipe(
      map((trip) => {
        // Convertir fechas de string a Date
        if (trip.fecha_inicio && typeof trip.fecha_inicio === "string") {
          try {
            trip.fecha_inicio = new Date(trip.fecha_inicio)
          } catch (error) {
            console.error("Error al convertir fecha_inicio:", error)
          }
        }
        if (trip.fecha_fin && typeof trip.fecha_fin === "string") {
          try {
            trip.fecha_fin = new Date(trip.fecha_fin)
          } catch (error) {
            console.error("Error al convertir fecha_fin:", error)
          }
        }

        // Procesar las fechas de los destinos
        if (trip.destinations) {
          trip.destinations = trip.destinations.map((dest) => {
            if (dest.fecha_inicio && typeof dest.fecha_inicio === "string") {
              try {
                dest.fecha_inicio = new Date(dest.fecha_inicio)
              } catch (error) {
                console.error("Error al convertir fecha_inicio del destino:", error)
              }
            }
            if (dest.fecha_fin && typeof dest.fecha_fin === "string") {
              try {
                dest.fecha_fin = new Date(dest.fecha_fin)
              } catch (error) {
                console.error("Error al convertir fecha_fin del destino:", error)
              }
            }
            return dest
          })
        }

        return trip
      }),
      catchError(this.handleError.bind(this)),
    )
  }

  /**
   * Crea un nuevo viaje asociado al usuario autenticado
   */
  createTrip(trip: Trip): Observable<Trip> {
    const formattedTrip = this.formatDateForServer(trip)
    console.log("Creando viaje:", formattedTrip)

    return this.http.post<Trip>(`${this.tripsUrl}/`, formattedTrip, this.getAuthHeaders()).pipe(
      map((response) => {
        // Convertir fechas de string a Date
        if (response.fecha_inicio && typeof response.fecha_inicio === "string") {
          try {
            response.fecha_inicio = new Date(response.fecha_inicio)
          } catch (error) {
            console.error("Error al convertir fecha_inicio:", error)
          }
        }
        if (response.fecha_fin && typeof response.fecha_fin === "string") {
          try {
            response.fecha_fin = new Date(response.fecha_fin)
          } catch (error) {
            console.error("Error al convertir fecha_fin:", error)
          }
        }
        return response
      }),
      catchError(this.handleError.bind(this)),
    )
  }

  /**
   * Actualiza un viaje existente (solo si pertenece al usuario autenticado)
   */
  updateTrip(trip: Trip): Observable<Trip> {
    if (!trip.id) {
      return throwError(() => new Error("ID del viaje es obligatorio para actualizar"))
    }

    const formattedTrip = this.formatDateForServer(trip)
    console.log("Actualizando viaje:", formattedTrip)

    return this.http.put<Trip>(`${this.tripsUrl}/${trip.id}`, formattedTrip, this.getAuthHeaders()).pipe(
      map((response) => {
        // Convertir fechas de string a Date
        if (response.fecha_inicio && typeof response.fecha_inicio === "string") {
          try {
            response.fecha_inicio = new Date(response.fecha_inicio)
          } catch (error) {
            console.error("Error al convertir fecha_inicio:", error)
          }
        }
        if (response.fecha_fin && typeof response.fecha_fin === "string") {
          try {
            response.fecha_fin = new Date(response.fecha_fin)
          } catch (error) {
            console.error("Error al convertir fecha_fin:", error)
          }
        }
        return response
      }),
      catchError(this.handleError.bind(this)),
    )
  }

  /**
   * Elimina un viaje (solo si pertenece al usuario autenticado)
   */
  deleteTrip(tripId: number): Observable<Trip> {
    return this.http
      .delete<Trip>(`${this.tripsUrl}/${tripId}`, this.getAuthHeaders())
      .pipe(catchError(this.handleError.bind(this)))
  }

  /**
   * Obtiene los destinos de un viaje (solo si el viaje pertenece al usuario autenticado)
   */
  getDestinations(tripId: number): Observable<Destination[]> {
    return this.http.get<Destination[]>(`${this.tripsUrl}/${tripId}/destinations/`, this.getAuthHeaders()).pipe(
      map((destinations) => {
        // Procesar las fechas de los destinos
        return destinations.map((dest) => {
          if (dest.fecha_inicio && typeof dest.fecha_inicio === "string") {
            try {
              dest.fecha_inicio = new Date(dest.fecha_inicio)
            } catch (error) {
              console.error("Error al convertir fecha_inicio del destino:", error)
            }
          }
          if (dest.fecha_fin && typeof dest.fecha_fin === "string") {
            try {
              dest.fecha_fin = new Date(dest.fecha_fin)
            } catch (error) {
              console.error("Error al convertir fecha_fin del destino:", error)
            }
          }
          return dest
        })
      }),
      catchError(this.handleError.bind(this)),
    )
  }

  /**
   * Añade un destino a un viaje (solo si el viaje pertenece al usuario autenticado)
   */
  addDestination(destination: Destination): Observable<Destination> {
    if (!destination.trip_id || destination.trip_id === 0) {
      console.error("Error: trip_id inválido en la creación del destino.")
      return throwError(() => new Error("trip_id es obligatorio"))
    }

    const formattedDestination = this.formatDestinationDatesForServer(destination)
    console.log("Enviando destino:", formattedDestination)

    return this.http
      .post<Destination>(
        `${this.tripsUrl}/${destination.trip_id}/destinations/`,
        formattedDestination,
        this.getAuthHeaders(),
      )
      .pipe(
        map((response) => {
          // Preservar las fechas originales
          return {
            ...response,
            fecha_inicio: destination.fecha_inicio,
            fecha_fin: destination.fecha_fin,
          }
        }),
        catchError(this.handleError.bind(this)),
      )
  }

  /**
   * Actualiza un destino existente (solo si pertenece a un viaje del usuario autenticado)
   */
  updateDestination(destination_id: number, destination: Partial<Destination>): Observable<Destination> {
    const formattedDestination = this.formatDestinationDatesForServer(destination)
    console.log("Actualizando destino:", formattedDestination)

    return this.http
      .put<Destination>(`${this.destinationsUrl}/${destination_id}`, formattedDestination, this.getAuthHeaders())
      .pipe(
        map((response) => {
          // Preservar las fechas originales
          return {
            ...response,
            fecha_inicio: destination.fecha_inicio,
            fecha_fin: destination.fecha_fin,
          }
        }),
        catchError(this.handleError.bind(this)),
      )
  }

  /**
   * Elimina un destino (solo si pertenece a un viaje del usuario autenticado)
   */
  deleteDestination(destinationId: number): Observable<Destination> {
    return this.http
      .delete<Destination>(`${this.destinationsUrl}/${destinationId}`, this.getAuthHeaders())
      .pipe(catchError(this.handleError.bind(this)))
  }
}
