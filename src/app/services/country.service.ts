import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Country } from '../models/country.model';

@Injectable({
  providedIn: 'root'
})
export class CountryService {
  private readonly apiUrl = 'https://restcountries.com/v3.1/all?fields=name,flags';
  private readonly countriesSubject = new BehaviorSubject<Country[]>([]);
  private countriesLoaded = false;

  constructor(private readonly http: HttpClient) {}

  // Obtener todos los países de la API
  loadCountries(): Observable<Country[]> {
    if (this.countriesLoaded) {
      return this.countriesSubject.asObservable();
    }

    return this.http.get<Country[]>(this.apiUrl).pipe(
      tap(countries => {
        this.countriesSubject.next(countries);
        this.countriesLoaded = true;
      }),
      catchError(error => {
        console.error('Error loading countries:', error);
        return of([]);
      })
    );
  }

  // Obtener países que coincidan con el término de búsqueda
  searchCountries(searchTerm: string): Observable<Country[]> {
    if (!this.countriesLoaded) {
      return this.loadCountries().pipe(
        map(countries => this.filterCountries(countries, searchTerm))
      );
    }

    return of(this.filterCountries(this.countriesSubject.value, searchTerm));
  }

  // Filtrar países por término de búsqueda
  private filterCountries(countries: Country[], searchTerm: string): Country[] {
    if (!searchTerm || searchTerm.trim() === '') {
      return [];
    }

    searchTerm = searchTerm.toLowerCase().trim();
    
    return countries.filter(country => 
      country.name.common.toLowerCase().startsWith(searchTerm) ||
      country.name.official.toLowerCase().startsWith(searchTerm)
    ).slice(0, 10); // Limitar a 10 resultados para no sobrecargar la UI
  }
}