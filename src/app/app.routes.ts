import type { Routes } from "@angular/router";
import { AuthGuard } from "./auth/guards/auth.guard";

export const routes: Routes = [
  {
    path: "",
    redirectTo: "dashboard",
    pathMatch: "full",
  },
  {
    path: "auth",
    loadComponent: () =>
      import("./auth/components/auth.component").then((m) => m.AuthComponent),
  },
  {
    path: "dashboard",
    loadComponent: () =>
      import("../app/components/trip-dashboard/trip-dashboard.component").then(
        (m) => m.TripDashboardComponent
      ),
    canActivate: [AuthGuard], // Protege la ruta con AuthGuard
  },
  {
    path: "**",
    redirectTo: "dashboard",
  },
];