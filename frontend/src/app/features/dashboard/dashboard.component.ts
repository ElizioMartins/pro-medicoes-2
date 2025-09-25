import { CommonModule } from '@angular/common';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { SimpleChartComponent, ChartData } from '@shared/components/ui/simple-chart/simple-chart.component';
import { AuthService } from '@core/services/auth.service';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardService, DashboardData, RecentReading, DashboardAlerts } from '@core/services/dashboard.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonComponent,
    SimpleChartComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  // Dados reais do dashboard
  dashboardData: DashboardData | null = null;
  isLoading = true;
  errorMessage = '';
  
  // Stats básicas (acessadas diretamente no template)
  get condominiumsCount(): number {
    return this.dashboardData?.stats.condominiumsCount || 0;
  }
  
  get unitsCount(): number {
    return this.dashboardData?.stats.unitsCount || 0;
  }
  
  get readingsCount(): number {
    return this.dashboardData?.stats.readingsCount || 0;
  }
  
  get usersCount(): number {
    return this.dashboardData?.stats.usersCount || 0;
  }
  
  get recentReadings(): RecentReading[] {
    return this.dashboardData?.recentReadings || [];
  }
  
  get completionRate(): number {
    return this.dashboardData?.completionRate || 0;
  }
  
  get readingsByTypeChart(): ChartData[] {
    if (!this.dashboardData?.readingsByType) return [];
    
    return this.dashboardData.readingsByType.map(item => ({
      label: item.type,
      value: item.count,
      percentage: item.percentage
    }));
  }

  get monthlyReadingsChart(): ChartData[] {
    if (!this.dashboardData?.monthlyStats) return [];
    
    return this.dashboardData.monthlyStats.map(item => ({
      label: item.month,
      value: item.count,
      percentage: item.percentage
    }));
  }
  
  get averageReadingValue(): number {
    return this.dashboardData?.averageReadingValue || 0;
  }

  get alerts(): DashboardAlerts | null {
    return this.dashboardData?.alerts || null;
  }

  get hasAlerts(): boolean {
    const alerts = this.alerts;
    if (!alerts) return false;
    return alerts.overdueReadings > 0 || alerts.inaccessibleMeters > 0 || 
           alerts.lowBatteryMeters > 0 || alerts.anomalousReadings > 0;
  }

  getCurrentMonthName(): string {
    const currentDate = new Date();
    return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  getMonthlyGoal(): number {
    // Meta baseada no número total de medidores
    return this.dashboardData?.stats.metersCount || 0;
  }

  getCurrentMonthReadings(): number {
    // Retorna o número de leituras do mês atual
    if (!this.dashboardData?.monthlyStats || this.dashboardData.monthlyStats.length === 0) {
      return 0;
    }
    // Pega o último mês do array (o mais recente)
    return this.dashboardData.monthlyStats[this.dashboardData.monthlyStats.length - 1]?.count || 0;
  }
  
  private router = inject(Router);
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.dashboardService.getFullDashboardData()
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (data) => {
          this.dashboardData = data;
          console.log('Dashboard data loaded:', data);
        },
        error: (error) => {
          console.error('Erro ao carregar dados do dashboard:', error);
          this.errorMessage = 'Erro ao carregar dados do dashboard. Tente novamente.';
        }
      });
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }
}
