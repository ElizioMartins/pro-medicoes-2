import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/landing/landing.module').then(m => m.LandingModule)
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'condominiums',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/condominiums/condominiums.module').then(m => m.CondominiumsModule)
  },
  {
    path: 'measurement-types',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/measurement-types/measurement-types.module').then(m => m.MeasurementTypesModule)
  },
  {
    path: 'units',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/units/units.module').then(m => m.UnitsModule)
  },
  {
    path: 'readings',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/readings/readings.module').then(m => m.ReadingsModule)
  },
  {
    path: 'reports',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/reports/reports.module').then(m => m.ReportsModule)
  },
  {
    path: 'users',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/users/users.module').then(m => m.UsersModule)
  },
  {
    path: '**',
    component: NotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
