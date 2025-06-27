import { Routes } from '@angular/router';

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
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'condominiums',
    children: [
      {
        path: '',
        loadComponent: () => import('./features/condominiums/condominiums-list/condominiums-list.component').then(m => m.CondominiumsListComponent)
      },
      {
        path: 'new',
        loadComponent: () => import('./features/condominiums/condominium-form/condominium-form.component').then(m => m.CondominiumFormComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/condominiums/condominium-detail/condominium-detail.component').then(m => m.CondominiumDetailComponent)
      },      {
        path: ':id/edit',
        loadComponent: () => import('./features/condominiums/condominium-form/condominium-form.component').then(m => m.CondominiumFormComponent)
      },
      {
        path: ':condominiumId/units/new',
        loadComponent: () => import('./features/condominiums/unit-form/unit-form.component').then(m => m.UnitFormComponent)
      },
      {
        path: ':condominiumId/units/:id/edit',
        loadComponent: () => import('./features/condominiums/unit-form/unit-form.component').then(m => m.UnitFormComponent)
      }
    ]
  },
  {
    path: 'measurement-types',
    loadComponent: () => import('./features/measurement-types/measurement-types.component').then(m => m.MeasurementTypesComponent)
  },
  {
    path: 'units',
    children: [     
      {
        path: ':unitId/meters',
        loadComponent: () => import('./features/condominiums/unit-form/unit-meters/unit-meters.component').then(m => m.UnitMetersComponent)
      },
      {
        path: ':unitId/meters/new',
        loadComponent: () => import('./features/condominiums/unit-form/unit-meters/meter-form.component').then(m => m.MeterFormComponent)
      },
      {
        path: ':unitId/meters/:id/edit',
        loadComponent: () => import('./features/condominiums/unit-form/unit-meters/meter-form.component').then(m => m.MeterFormComponent)
      }
    ]
  },
  {
    path: 'readings',
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
    loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
  },
  {    path: 'users',
    children: [
      {
        path: '',
        loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'new',
        loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent)
      },
      {
        path: ':id/delete',
        loadComponent: () => import('./features/users/user-delete/user-delete.component').then(m => m.UserDeleteComponent)
      }
    ]
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
   // loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
