import { HttpInterceptorFn } from "@angular/common/http";
import { HttpRequest, HttpHandlerFn, HttpEvent } from "@angular/common/http";
import { Observable } from "rxjs";
import { inject } from "@angular/core";
import { AuthService } from "../models/services/auth.service";

export const AuthInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  // Usamos `inject` para obtener una instancia de AuthService
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    const authRequest = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(authRequest);
  }

  return next(request);
};