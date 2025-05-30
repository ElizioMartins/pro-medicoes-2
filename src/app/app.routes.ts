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
      children: [
        {
          path: '',
          loadComponent: () => import('./features/readings/readings.component').then(m => m.ReadingsComponent),
          pathMatch: 'full' // Important for default child route
        },
        {
          path: 'new', // For creating a new reading
          loadComponent: () => import('./features/readings/reading-form/reading-form.component').then(m => m.ReadingFormComponent)
        },
        {
          path: ':id/form', // For editing an existing reading
          loadComponent: () => import('./features/readings/reading-form/reading-form.component').then(m => m.ReadingFormComponent)
        }
      ]
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
    path: 'profile',
    canActivate: [authGuard], // Assuming protected
    loadComponent: () => import('./features/user-profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'settings',
    canActivate: [authGuard], // Assuming protected
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
   // loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
