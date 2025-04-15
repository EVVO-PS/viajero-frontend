import { Injectable, signal, effect, inject, PLATFORM_ID } from "@angular/core"
import { isPlatformBrowser } from "@angular/common"

@Injectable({
  providedIn: "root",
})
export class ThemeService {
  private readonly THEME_KEY = "preferred-theme"
  private isDarkMode = signal(false) // Inicializar como false hasta verificar
  private platformId = inject(PLATFORM_ID)

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Solo ejecutar en el navegador
      this.isDarkMode.set(this.getInitialThemeState())

      // Usar effect para aplicar el tema cuando cambie
      effect(() => {
        this.applyTheme(this.isDarkMode())
      })
    }
  }

  private getInitialThemeState(): boolean {
    // Verificar si hay una preferencia guardada
    const savedTheme = localStorage.getItem(this.THEME_KEY)
    if (savedTheme) {
      return savedTheme === "dark"
    }

    // Si no hay preferencia guardada, usar preferencia del sistema
    return window.matchMedia("(prefers-color-scheme: dark)").matches
  }

  toggleTheme(): void {
    const newThemeState = !this.isDarkMode()
    this.isDarkMode.set(newThemeState)
    localStorage.setItem(this.THEME_KEY, newThemeState ? "dark" : "light")
  }

  isDarkTheme(): boolean {
    return this.isDarkMode()
  }

  private applyTheme(isDark: boolean): void {
    if (isDark) {
      document.documentElement.setAttribute("data-bs-theme", "dark")
    } else {
      document.documentElement.setAttribute("data-bs-theme", "light")
    }
  }
}
