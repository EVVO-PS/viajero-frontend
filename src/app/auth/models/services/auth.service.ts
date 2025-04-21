import { Injectable, PLATFORM_ID, Inject } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { BehaviorSubject, type Observable, tap } from "rxjs"
import { User, AuthResponse, LoginCredentials, RegisterCredentials } from "../../models/user.model"
import { Router } from "@angular/router"
import { isPlatformBrowser } from "@angular/common"
import { environment } from "../../../environments/environment"

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null)
  public currentUser$ = this.currentUserSubject.asObservable()
  private readonly isBrowser: boolean

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId)
    this.loadUserFromStorage()
  }

  private loadUserFromStorage(): void {
    if (this.isBrowser) {
      const token = localStorage.getItem("auth_token")
      const user = localStorage.getItem("user")

      if (token && user) {
        this.currentUserSubject.next(JSON.parse(user))
      }
    }
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(tap((response) => this.handleAuthentication(response)))
  }

  register(credentials: RegisterCredentials): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/register`, credentials)
  }

  private handleAuthentication(response: AuthResponse): void {
    if (this.isBrowser) {
      localStorage.setItem("auth_token", response.access_token)
      localStorage.setItem("user", JSON.stringify(response.user))
      this.currentUserSubject.next(response.user)
    }
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user")
    }
    this.currentUserSubject.next(null)
    this.router.navigate(["/auth"])
  }

  isAuthenticated(): boolean {
    return this.isBrowser ? !!localStorage.getItem("auth_token") : false
  }

  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem("auth_token") : null
  }

  getCurrentUserId(): number | null {
    const user = this.currentUserSubject.value
    return user ? user.id ?? null : null
  }
}

  

