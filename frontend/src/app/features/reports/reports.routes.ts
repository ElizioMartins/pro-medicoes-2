import { Routes } from '@angular/router';

export const reportsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./reports.component').then(m => m.ReportsComponent),
  },
  {
    path: 'monthly-consumption',
    loadComponent: () => import('./report/monthly-consumption/monthly-consumption.component').then(m => m.MonthlyConsumptionComponent)
  },
  {
    path: 'unit-consumption-period',
    loadComponent: () => import('./report/unit-consumption-period/unit-consumption-period.component').then(m => m.UnitConsumptionPeriodComponent)
  },
  {
    path: 'quarterly-comparative',
    loadComponent: () => import('./report/quarterly-comparative/quarterly-comparative.component').then(m => m.QuarterlyComparativeComponent)
  },
  {
    path: 'economy-analysis',
    loadComponent: () => import('./report/economy-analysis/economy-analysis.component').then(m => m.EconomyAnalysisComponent)
  },
  {
    path: 'billing',
    loadComponent: () => import('./report/billing/billing.component').then(m => m.BillingComponent)
  }
];

export default reportsRoutes;