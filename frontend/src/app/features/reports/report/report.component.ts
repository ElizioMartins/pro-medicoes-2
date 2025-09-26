import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterOutlet, Router } from '@angular/router';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';

export interface ReportData {
  id: string;
  type: 'monthly-consumption' | 'quarterly-comparative' | 'economy-analysis' | 'billing';
  title: string;
  description: string;
  status: 'generating' | 'completed' | 'error';
  generatedAt?: Date;
  data?: Record<string, unknown>;
  condominium?: {
    id: string;
    name: string;
  };
  period?: string;
}

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    CardComponent,
    ButtonComponent
  ],
  template: `
    <div class="report-container">
      <div class="report-header">
        <div class="report-info">
          <h1 class="report-title">{{ reportTitle }}</h1>
          <p class="report-subtitle" *ngIf="reportSubtitle">{{ reportSubtitle }}</p>
        </div>
        
        <div class="report-actions">
          <app-button 
            variant="outline" 
            (click)="goBack()">
            Voltar
          </app-button>
          
          <app-button 
            *ngIf="canExport" 
            variant="primary"
            (click)="exportReport()">
            Exportar PDF
          </app-button>
        </div>
      </div>

      <div class="report-content">
        <!-- Status do relatório -->
        <app-card *ngIf="reportData?.status === 'generating'" class="status-card">
          <div class="generating-status">
            <div class="spinner"></div>
            <div>
              <h3>Gerando relatório...</h3>
              <p>Por favor, aguarde enquanto processamos os dados.</p>
            </div>
          </div>
        </app-card>

        <app-card *ngIf="reportData?.status === 'error'" class="status-card error">
          <div class="error-status">
            <div class="error-icon">⚠️</div>
            <div>
              <h3>Erro na geração do relatório</h3>
              <p>Ocorreu um erro ao processar os dados. Tente novamente.</p>
              <app-button 
                variant="primary" 
                (click)="retryGeneration()">
                Tentar Novamente
              </app-button>
            </div>
          </div>
        </app-card>

        <!-- Conteúdo específico do relatório -->
        <div *ngIf="reportData?.status === 'completed'" class="report-body">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .report-container {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      gap: 1rem;
    }

    .report-info {
      flex: 1;
    }

    .report-title {
      font-size: 1.875rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 0.5rem 0;
    }

    .report-subtitle {
      color: #6b7280;
      font-size: 1rem;
      margin: 0;
    }

    .report-actions {
      display: flex;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    .report-content {
      width: 100%;
    }

    .status-card {
      margin-bottom: 1.5rem;
    }

    .status-card.error {
      border-color: #ef4444;
      background-color: #fef2f2;
    }

    .generating-status,
    .error-status {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .spinner {
      width: 2rem;
      height: 2rem;
      border: 3px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .error-icon {
      font-size: 2rem;
    }

    .generating-status h3,
    .error-status h3 {
      margin: 0 0 0.25rem 0;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .generating-status p,
    .error-status p {
      margin: 0 0 0.75rem 0;
      color: #6b7280;
    }

    .report-body {
      width: 100%;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @media (max-width: 768px) {
      .report-header {
        flex-direction: column;
        align-items: stretch;
      }

      .report-actions {
        justify-content: flex-end;
      }
    }
  `]
})
export class ReportComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  reportData: ReportData | null = null;
  reportTitle = 'Relatório';
  reportSubtitle = '';
  canExport = false;

  ngOnInit() {
    // Escuta mudanças na rota para atualizar as informações do relatório
    this.route.params.subscribe(params => {
      this.updateReportInfo(params['type']);
    });

    // Simula dados do relatório (em produção viria do backend)
    this.loadReportData();
  }

  private updateReportInfo(reportType: string) {
    switch (reportType) {
      case 'monthly-consumption':
        this.reportTitle = 'Relatório de Consumo Mensal';
        this.reportSubtitle = 'Análise detalhada do consumo por unidade';
        break;
      case 'quarterly-comparative':
        this.reportTitle = 'Relatório Comparativo Trimestral';
        this.reportSubtitle = 'Comparação de consumo entre períodos';
        break;
      case 'economy-analysis':
        this.reportTitle = 'Análise de Economia';
        this.reportSubtitle = 'Identificação de oportunidades de economia';
        break;
      case 'billing':
        this.reportTitle = 'Relatório de Faturamento';
        this.reportSubtitle = 'Detalhamento de custos por unidade';
        break;
      default:
        this.reportTitle = 'Relatório';
        this.reportSubtitle = '';
    }
  }

  private loadReportData() {
    // Simula o carregamento dos dados
    this.reportData = {
      id: '1',
      type: 'monthly-consumption',
      title: 'Consumo Mensal - Janeiro 2025',
      description: 'Relatório de consumo mensal',
      status: 'generating'
    };

    // Simula o processo de geração
    setTimeout(() => {
      if (this.reportData) {
        this.reportData.status = 'completed';
        this.reportData.generatedAt = new Date();
        this.canExport = true;
      }
    }, 2000);
  }

  goBack() {
    this.router.navigate(['/reports']);
  }

  exportReport() {
    // Implementar lógica de exportação para PDF
    console.log('Exporting report to PDF...');
    alert('Funcionalidade de exportação será implementada em breve!');
  }

  retryGeneration() {
    if (this.reportData) {
      this.reportData.status = 'generating';
      this.canExport = false;
      
      // Simula nova tentativa
      setTimeout(() => {
        if (this.reportData) {
          this.reportData.status = 'completed';
          this.reportData.generatedAt = new Date();
          this.canExport = true;
        }
      }, 1500);
    }
  }
}