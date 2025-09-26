import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { RouterLink } from '@angular/router';

interface ReportType {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: string;
  status: 'available' | 'development' | 'planning';
}

interface RecentReport {
  id: string;
  type: string;
  condominium: string;
  period: string;
  generatedAt: Date;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonComponent,
    RouterLink
  ],
  template: `
    <div class="reports-container">
      <div class="reports-header">
        <div class="header-info">
          <h1 class="reports-title">Relatórios</h1>
          <p class="reports-subtitle">
            Gerencie e visualize relatórios de consumo e faturamento
          </p>
        </div>
      </div>
      
      <div class="reports-content">
        <!-- Tipos de Relatório -->
        <app-card title="📊 Tipos de Relatório Disponíveis" [elevated]="true" class="types-card">
          <div class="report-types-grid">
            <div *ngFor="let type of reportTypes" 
                 class="report-type-item" 
                 [class.available]="type.status === 'available'"
                 [class.development]="type.status === 'development'"
                 [class.planning]="type.status === 'planning'">
              
              <div class="report-type-header">
                <span class="report-icon">{{ type.icon }}</span>
                <div class="report-info">
                  <h3 class="report-type-title">{{ type.name }}</h3>
                  <span class="status-badge" [attr.data-status]="type.status">
                    {{ getStatusLabel(type.status) }}
                  </span>
                </div>
              </div>
              
              <p class="report-type-description">{{ type.description }}</p>
              
              <div class="report-actions">
                <app-button 
                  *ngIf="type.status === 'available'" 
                  [routerLink]="['/reports', type.id]"
                  variant="primary">
                  Gerar Relatório
                </app-button>
                
                <app-button 
                  *ngIf="type.status === 'development'" 
                  [routerLink]="['/reports', type.id]"
                  variant="outline">
                  Ver Preview
                </app-button>
                
                <span *ngIf="type.status === 'planning'" class="coming-soon">
                  Em breve
                </span>
              </div>
            </div>
          </div>
        </app-card>
        
        <!-- Relatórios Recentes -->
        <app-card title="📋 Relatórios Recentes" class="recent-card">
          <div class="recent-reports" *ngIf="recentReports.length > 0; else noReports">
            <table class="reports-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Condomínio</th>
                  <th>Período</th>
                  <th>Gerado em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let report of recentReports">
                  <td class="report-type">{{ report.type }}</td>
                  <td>{{ report.condominium }}</td>
                  <td>{{ report.period }}</td>
                  <td class="generated-date">{{ report.generatedAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                  <td class="actions-cell">
                    <app-button size="small" variant="outline" (click)="downloadReport(report.id)">
                      Download
                    </app-button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <ng-template #noReports>
            <div class="no-reports">
              <div class="no-reports-icon">📄</div>
              <p>Nenhum relatório gerado ainda.</p>
              <p class="no-reports-hint">Gere seu primeiro relatório usando as opções acima.</p>
            </div>
          </ng-template>
        </app-card>
      </div>
    </div>
  `,
  styles: [`
    .reports-container {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .reports-header {
      margin-bottom: 2rem;
    }
    
    .header-info {
      text-align: center;
    }
    
    .reports-title {
      font-size: 2.25rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 0.5rem 0;
    }
    
    .reports-subtitle {
      color: #6b7280;
      font-size: 1.125rem;
      margin: 0;
    }
    
    .reports-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    
    .report-types-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    
    .report-type-item {
      padding: 1.5rem;
      border-radius: 0.75rem;
      border: 2px solid #e5e7eb;
      transition: all 0.2s ease;
      position: relative;
    }
    
    .report-type-item.available {
      border-color: #10b981;
      background-color: #f0fdf4;
    }
    
    .report-type-item.development {
      border-color: #f59e0b;
      background-color: #fffbeb;
    }
    
    .report-type-item.planning {
      border-color: #6b7280;
      background-color: #f9fafb;
      opacity: 0.7;
    }
    
    .report-type-item:hover:not(.planning) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .report-type-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    
    .report-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }
    
    .report-info {
      flex: 1;
    }
    
    .report-type-title {
      margin: 0 0 0.5rem 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
    }
    
    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
    }
    
    .status-badge[data-status="available"] {
      background-color: #10b981;
      color: white;
    }
    
    .status-badge[data-status="development"] {
      background-color: #f59e0b;
      color: white;
    }
    
    .status-badge[data-status="planning"] {
      background-color: #6b7280;
      color: white;
    }
    
    .report-type-description {
      margin: 0 0 1.5rem 0;
      color: #6b7280;
      line-height: 1.5;
    }
    
    .report-actions {
      display: flex;
      justify-content: flex-end;
    }
    
    .coming-soon {
      color: #6b7280;
      font-style: italic;
      font-size: 0.875rem;
    }
    
    .reports-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .reports-table th, 
    .reports-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .reports-table th {
      font-weight: 600;
      color: #374151;
      background-color: #f8fafc;
    }
    
    .reports-table tbody tr:hover {
      background-color: #f8fafc;
    }
    
    .report-type {
      font-weight: 500;
    }
    
    .generated-date {
      color: #6b7280;
      font-size: 0.875rem;
    }
    
    .actions-cell {
      text-align: right;
    }
    
    .no-reports {
      text-align: center;
      padding: 3rem 1rem;
      color: #6b7280;
    }
    
    .no-reports-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }
    
    .no-reports p {
      margin: 0.5rem 0;
    }
    
    .no-reports-hint {
      font-size: 0.875rem;
    }

    @media (max-width: 768px) {
      .reports-container {
        padding: 1rem;
      }
      
      .reports-title {
        font-size: 1.875rem;
      }
      
      .report-types-grid {
        grid-template-columns: 1fr;
      }
      
      .reports-table {
        font-size: 0.875rem;
      }
      
      .reports-table th, 
      .reports-table td {
        padding: 0.5rem;
      }
    }
  `]
})
export class ReportsComponent {
  reportTypes: ReportType[] = [
    {
      id: 'monthly-consumption',
      name: 'Consumo Mensal',
      description: 'Relatório detalhado de consumo por unidade no período de um mês com análises e recomendações.',
      route: '/reports/monthly-consumption',
      icon: '📊',
      status: 'available'
    },
    {
      id: 'quarterly-comparative',
      name: 'Comparativo Trimestral',
      description: 'Comparação de consumo entre unidades e períodos trimestrais com gráficos comparativos.',
      route: '/reports/quarterly-comparative',
      icon: '📈',
      status: 'development'
    },
    {
      id: 'economy-analysis',
      name: 'Análise de Economia',
      description: 'Análise de oportunidades de economia e identificação de desperdícios com recomendações personalizadas.',
      route: '/reports/economy-analysis',
      icon: '🌱',
      status: 'development'
    },
    {
      id: 'billing',
      name: 'Faturamento Detalhado',
      description: 'Relatório completo de faturamento por unidade com rateio de custos fixos e variáveis.',
      route: '/reports/billing',
      icon: '💰',
      status: 'development'
    }
  ];

  recentReports: RecentReport[] = [
    {
      id: '1',
      type: 'Consumo Mensal',
      condominium: 'Residencial Parque das Flores',
      period: 'Janeiro/2025',
      generatedAt: new Date(2025, 0, 26, 14, 30)
    },
    {
      id: '2',
      type: 'Consumo Mensal',
      condominium: 'Edifício Solar',
      period: 'Janeiro/2025',
      generatedAt: new Date(2025, 0, 25, 10, 15)
    }
  ];

  getStatusLabel(status: string): string {
    switch (status) {
      case 'available':
        return 'Disponível';
      case 'development':
        return 'Em Desenvolvimento';
      case 'planning':
        return 'Planejado';
      default:
        return status;
    }
  }

  downloadReport(reportId: string): void {
    console.log(`Downloading report ${reportId}`);
    // Simula download
    const link = document.createElement('a');
    link.download = `relatorio-${reportId}.pdf`;
    link.href = '#';
    link.click();
  }
}
