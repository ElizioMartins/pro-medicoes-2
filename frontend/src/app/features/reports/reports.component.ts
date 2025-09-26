import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { RouterLink } from '@angular/router';

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
        <h1 class="reports-title">Relatórios</h1>
        <app-button routerLink="/reports/new">Novo Relatório</app-button>
      </div>
      
      <div class="reports-grid">
        <app-card title="Gerar Relatórios" [elevated]="true" class="generate-card">
          <div class="report-types">
            <div *ngFor="let type of reportTypes" class="report-type-item">
              <h3 class="report-type-title">{{ type.name }}</h3>
              <p class="report-type-description">{{ type.description }}</p>
              <app-button [routerLink]="['/reports/new', type.id]">Gerar</app-button>
            </div>
          </div>
        </app-card>
        
       
  `,
  styles: [`
    .reports-container {
      padding: 1.5rem;
    }
    
    .reports-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    
    .reports-title {
      font-size: 1.875rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }
    
    .reports-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    
    .report-types {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }
    
    .report-type-item {
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      background-color: #f9fafb;
    }
    
    .report-type-title {
      margin-top: 0;
      margin-bottom: 0.5rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
    }
    
    .report-type-description {
      margin-bottom: 1rem;
      color: #6b7280;
      font-size: 0.875rem;
    }
    
    .scheduled-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .scheduled-header p {
      margin: 0;
      color: #6b7280;
    }
    
    .reports-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .reports-table th, .reports-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .reports-table th {
      font-weight: 600;
      color: #374151;
    }
    
    .actions-cell {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }
    
    .no-reports {
      text-align: center;
      padding: 2rem 0;
      color: #6b7280;
    }
  `]
})
export class ReportsComponent {
  // Dados simulados para demonstração
  reportTypes = [
    {
      id: '1',
      name: 'Consumo Mensal',
      description: 'Relatório detalhado de consumo por unidade no período de um mês.'
    },
    {
      id: '2',
      name: 'Comparativo Trimestral',
      description: 'Comparação de consumo entre unidades nos últimos três meses.'
    },
    {
      id: '3',
      name: 'Análise de Economia',
      description: 'Análise de economia e desperdício com recomendações de melhorias.'
    },
    {
      id: '4',
      name: 'Faturamento',
      description: 'Relatório de faturamento por unidade e tipo de consumo.'
    }
  ];
  
  recentReports = [
    {
      id: '1',
      type: 'Consumo Mensal',
      condominium: 'Residencial Parque das Flores',
      period: 'Maio/2025',
      generatedAt: new Date(2025, 4, 26, 14, 30)
    },
    {
      id: '2',
      type: 'Comparativo Trimestral',
      condominium: 'Edifício Solar',
      period: 'Mar-Mai/2025',
      generatedAt: new Date(2025, 4, 25, 10, 15)
    },
    {
      id: '3',
      type: 'Análise de Economia',
      condominium: 'Condomínio Vista Mar',
      period: 'Abril/2025',
      generatedAt: new Date(2025, 4, 20, 16, 45)
    }
  ];
  
  scheduledReports = [
    {
      id: '1',
      type: 'Consumo Mensal',
      condominium: 'Residencial Parque das Flores',
      frequency: 'Mensal',
      nextGeneration: new Date(2025, 5, 1),
      recipients: 'admin@parquedasflores.com.br'
    },
    {
      id: '2',
      type: 'Comparativo Trimestral',
      condominium: 'Edifício Solar',
      frequency: 'Trimestral',
      nextGeneration: new Date(2025, 7, 1),
      recipients: 'sindico@edificiosolar.com.br, admin@edificiosolar.com.br'
    }
  ];
  
  downloadReport(reportId: string): void {
    // Em uma implementação real, aqui faríamos o download do relatório
    console.log(`Downloading report ${reportId}`);
    alert(`Download do relatório ${reportId} iniciado.`);
  }
  
  deleteSchedule(scheduleId: string): void {
    // Em uma implementação real, aqui excluiríamos o agendamento
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      console.log(`Deleting schedule ${scheduleId}`);
      this.scheduledReports = this.scheduledReports.filter(s => s.id !== scheduleId);
    }
  }
}
