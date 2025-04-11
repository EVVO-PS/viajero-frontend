import { Component, OnInit } from "@angular/core"
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from "@angular/forms"
import { Router } from "@angular/router"
import { AuthService } from "../models/services/auth.service"
import { CommonModule } from "@angular/common"

@Component({
  selector: "app-auth",
  templateUrl: "./auth.component.html",
  styleUrls: ["./auth.component.scss"],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class AuthComponent implements OnInit {
  isLoginMode = true
  authForm!: FormGroup
  isSubmitting = false
  errorMessage = ""
  successMessage = ""

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.initForm()
  }

  private initForm(): void {
    // Formulario base para login
    this.authForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
    })

    // Si estamos en modo registro, añadimos el campo nombre
    if (!this.isLoginMode) {
      this.authForm.addControl("name", this.fb.control("", Validators.required))
    }
  }

  toggleAuthMode(): void {
    this.isLoginMode = !this.isLoginMode
    this.errorMessage = ""
    this.successMessage = ""

    if (this.isLoginMode) {
      this.authForm.removeControl("name")
    } else {
      this.authForm.addControl("name", this.fb.control("", Validators.required))
    }
  }

  onSubmit(): void {
    if (this.authForm.invalid) {
      return
    }

    this.isSubmitting = true
    this.errorMessage = ""
    this.successMessage = ""

    if (this.isLoginMode) {
      this.authService.login(this.authForm.value).subscribe({
        next: () => {
          this.isSubmitting = false
          this.router.navigate(["/trip-dashboard"])
        },
        error: (error) => {
          this.isSubmitting = false
          this.errorMessage = error.error?.message || "Error al iniciar sesión. Verifica tus credenciales."
        },
      })
    } else {
      // Modo registro
      this.authService.register(this.authForm.value).subscribe({
        next: (response) => {
          this.isSubmitting = false
          this.successMessage = "Registro exitoso. Iniciando sesión automáticamente..."

          // After successful registration, automatically log in
          const loginCredentials = {
            email: this.authForm.value.email,
            password: this.authForm.value.password,
          }

          this.authService.login(loginCredentials).subscribe({
            next: () => {
              this.router.navigate(["/trip-dashboard"])
            },
            error: (loginError) => {
              this.isSubmitting = false
              this.errorMessage = loginError.error?.message || "Error al iniciar sesión automáticamente."
            },
          })
        },
        error: (error) => {
          this.isSubmitting = false
          this.errorMessage = error.error?.message || "Error al registrarse. Inténtalo de nuevo."
        },
      })
    }
  }
}

