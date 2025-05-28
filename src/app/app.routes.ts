import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'condominiums',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/condominiums/condominiums-list/condominiums-list.component').then(m => m.CondominiumsListComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/condominiums/condominium-detail/condominium-detail.component').then(m => m.CondominiumDetailComponent)
      }
    ]
  },
  {
    path: 'measurement-types',
    canActivate: [authGuard],
    loadComponent: () => import('./features/measurement-types/measurement-types.component').then(m => m.MeasurementTypesComponent)
  },
  {
    path: 'units',
    canActivate: [authGuard],
    loadComponent: () => import('./features/units/units.component').then(m => m.UnitsComponent)
  },
  {
    path: 'readings',
    canActivate: [authGuard],
    loadComponent: () => import('./features/readings/readings.component').then(m => m.ReadingsComponent)
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
  },
  {
    path: 'users',
    canActivate: [authGuard],
    loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.UnitsComponent)
  }
];
