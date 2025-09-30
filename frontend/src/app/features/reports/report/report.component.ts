import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterOutlet, Router } from '@angular/router';
import { ButtonComponent } from '@shared/components/ui/button/button.component';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
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
            ← Voltar aos Relatórios
          </app-button>
        </div>
      </div>

      <div class="report-content">
        <router-outlet></router-outlet>
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

    @media (max-width: 768px) {
      .report-header {
        flex-direction: column;
        align-items: stretch;
      }

      .report-actions {
        justify-content: flex-start;
      }
    }
  `]
})
export class ReportComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  reportTitle = 'Relatório';
  reportSubtitle = '';

  ngOnInit() {
    // Escuta mudanças na rota para atualizar as informações do relatório
    this.route.params.subscribe(params => {
      this.updateReportInfo(params['type']);
    });
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

  goBack() {
    this.router.navigate(['/reports']);
  }
}