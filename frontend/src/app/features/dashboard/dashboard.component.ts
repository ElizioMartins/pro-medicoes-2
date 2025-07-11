import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { AuthService } from '@core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonComponent
  ],
  template: `
    <div class="dashboard-container">
      <h1 class="dashboard-title">Dashboard</h1>
      
      <div class="dashboard-stats">
        <app-card class="stat-card" [elevated]="true">
          <div class="stat-content">
            <h3 class="stat-value">{{ condominiumsCount }}</h3>
            <p class="stat-label">Condomínios</p>
          </div>
        </app-card>
        
        <app-card class="stat-card" [elevated]="true">
          <div class="stat-content">
            <h3 class="stat-value">{{ unitsCount }}</h3>
            <p class="stat-label">Unidades</p>
          </div>
        </app-card>
        
        <app-card class="stat-card" [elevated]="true">
          <div class="stat-content">
            <h3 class="stat-value">{{ readingsCount }}</h3>
            <p class="stat-label">Leituras</p>
          </div>
        </app-card>
        
        <app-card class="stat-card" [elevated]="true">
          <div class="stat-content">
            <h3 class="stat-value">{{ usersCount }}</h3>
            <p class="stat-label">Usuários</p>
          </div>
        </app-card>
      </div>
      
      <div class="dashboard-actions">
        <app-card title="Ações Rápidas" [elevated]="true">
          <div class="quick-actions">
            <app-button (click)="navigateTo('/readings/new')">Nova Leitura</app-button>
            <app-button (click)="navigateTo('/reports')" variant="secondary">Gerar Relatório</app-button>
            <app-button (click)="navigateTo('/condominiums')" variant="outline">Ver Condomínios</app-button>
          </div>
        </app-card>
      </div>
      
      <div class="dashboard-recent">
        <app-card title="Leituras Recentes" [elevated]="true">
          <div *ngIf="recentReadings.length > 0; else noReadings">
            <table class="readings-table">
              <thead>
                <tr>
                  <th>Unidade</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let reading of recentReadings">
                  <td>{{ reading.unit }}</td>
                  <td>{{ reading.type }}</td>
                  <td>{{ reading.value }}</td>
                  <td>{{ reading.date | date:'dd/MM/yyyy' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ng-template #noReadings>
            <p class="no-data">Nenhuma leitura recente encontrada.</p>
          </ng-template>
        </app-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 1.5rem;
    }
    
    .dashboard-title {
      margin-bottom: 1.5rem;
      font-size: 1.875rem;
      font-weight: 600;
      color: #111827;
    }
    
    .dashboard-stats {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .stat-card {
      height: 100%;
    }
    
    .stat-content {
      text-align: center;
      padding: 1rem;
    }
    
    .stat-value {
      font-size: 2.25rem;
      font-weight: 700;
      color: #2563eb;
      margin: 0;
    }
    
    .stat-label {
      font-size: 1rem;
      color: #6b7280;
      margin: 0.5rem 0 0;
    }
    
    .dashboard-actions {
      margin-bottom: 2rem;
    }
    
    .quick-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .readings-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .readings-table th, .readings-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .readings-table th {
      font-weight: 600;
      color: #374151;
    }
    
    .no-data {
      text-align: center;
      color: #6b7280;
      padding: 2rem 0;
    }
  `]
})
export class DashboardComponent {
  // Dados simulados para demonstração
  condominiumsCount = 12;
  unitsCount = 248;
  readingsCount = 1543;
  usersCount = 35;
  
  recentReadings = [
    { unit: 'Apto 101', type: 'Água', value: '12.5 m³', date: new Date(2025, 4, 25) },
    { unit: 'Apto 203', type: 'Energia', value: '145 kWh', date: new Date(2025, 4, 24) },
    { unit: 'Apto 305', type: 'Gás', value: '22.3 m³', date: new Date(2025, 4, 23) },
    { unit: 'Apto 402', type: 'Água', value: '18.7 m³', date: new Date(2025, 4, 22) },
    { unit: 'Apto 501', type: 'Energia', value: '210 kWh', date: new Date(2025, 4, 21) }
  ];
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}
  
  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
