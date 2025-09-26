import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { Router } from '@angular/router';

interface QuarterlyData {
  condominium: {
    id: string;
    name: string;
  };
  quarters: {
    name: string;
    period: string;
    totalConsumption: number;
    averageConsumption: number;
    unitsCount: number;
  }[];
}

@Component({
  selector: 'app-quarterly-comparative',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonComponent],
  template: `
    <div class="quarterly-comparative-report">
      <!-- Header com botão voltar -->
      <div class="report-header">
        <div class="header-actions">
          <app-button 
            variant="outline" 
            (click)="goBack()">
            ← Voltar aos Relatórios
          </app-button>
        </div>
        <div class="header-info">
          <h1>Relatório Comparativo Trimestral</h1>
          <p class="subtitle">Comparação de consumo entre períodos</p>
        </div>
      </div>
      <!-- Cabeçalho -->
      <app-card class="report-header-card">
        <div class="report-info">
          <h2>{{ data?.condominium?.name }}</h2>
          <p class="subtitle">Comparativo Trimestral de Consumo</p>
          <p class="generation-date">
            Relatório gerado em {{ currentDate | date: 'dd/MM/yyyy HH:mm' }}
          </p>
        </div>
      </app-card>

      <!-- Comparativo -->
      <app-card title="Comparativo por Trimestre" class="comparative-card">
        <div class="quarters-grid" *ngIf="data?.quarters">
          <div *ngFor="let quarter of data?.quarters" class="quarter-item">
            <h3>{{ quarter.name }}</h3>
            <p class="period">{{ quarter.period }}</p>
            <div class="metrics">
              <div class="metric">
                <span class="label">Consumo Total</span>
                <span class="value">{{ quarter.totalConsumption | number:'1.2-2' }} m³</span>
              </div>
              <div class="metric">
                <span class="label">Média por Unidade</span>
                <span class="value">{{ quarter.averageConsumption | number:'1.2-2' }} m³</span>
              </div>
              <div class="metric">
                <span class="label">Unidades</span>
                <span class="value">{{ quarter.unitsCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </app-card>

      <!-- Em Desenvolvimento -->
      <app-card title="📊 Gráficos e Análises Avançadas" class="development-card">
        <div class="development-notice">
          <p>Esta seção está em desenvolvimento e incluirá:</p>
          <ul>
            <li>Gráficos comparativos de consumo</li>
            <li>Tendências de crescimento/redução</li>
            <li>Análise de sazonalidade</li>
            <li>Previsões de consumo futuro</li>
          </ul>
        </div>
      </app-card>
    </div>
  `,
  styles: [`
    .quarterly-comparative-report {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      gap: 1rem;
    }

    .header-actions {
      flex-shrink: 0;
    }

    .header-info {
      flex: 1;
      text-align: center;
    }

    .header-info h1 {
      font-size: 2rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 0.5rem 0;
    }

    .header-info .subtitle {
      color: #6b7280;
      font-size: 1.125rem;
      margin: 0;
    }

    .report-header-card .report-info h2 {
      margin: 0 0 0.5rem 0;
      color: #111827;
      font-size: 1.5rem;
    }

    .report-header-card .subtitle {
      font-size: 1.125rem;
      font-weight: 600;
      color: #3b82f6;
      margin: 0 0 0.25rem 0;
    }

    .report-header-card .generation-date {
      color: #6b7280;
      margin: 0;
      font-size: 0.875rem;
    }

    .quarters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .quarter-item {
      padding: 1.5rem;
      background-color: #f8fafc;
      border-radius: 0.5rem;
      border: 1px solid #e2e8f0;
    }

    .quarter-item h3 {
      margin: 0 0 0.25rem 0;
      color: #111827;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .quarter-item .period {
      color: #6b7280;
      margin: 0 0 1rem 0;
      font-size: 0.875rem;
    }

    .metrics {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .metric {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .metric .label {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .metric .value {
      font-weight: 600;
      color: #111827;
    }

    .development-card {
      border: 2px dashed #d1d5db;
      background-color: #f9fafb;
    }

    .development-notice p {
      margin: 0 0 1rem 0;
      color: #6b7280;
      font-style: italic;
    }

    .development-notice ul {
      margin: 0;
      padding-left: 1.5rem;
      color: #6b7280;
    }

    .development-notice li {
      margin-bottom: 0.25rem;
    }

    @media (max-width: 768px) {
      .quarters-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class QuarterlyComparativeComponent implements OnInit {
  private router = inject(Router);
  
  data: QuarterlyData | null = null;
  currentDate = new Date();

  ngOnInit() {
    this.loadReportData();
  }

  private loadReportData() {
    // Simula dados do relatório
    this.data = {
      condominium: {
        id: '1',
        name: 'Residencial Parque das Flores'
      },
      quarters: [
        {
          name: '1º Trimestre',
          period: 'Jan - Mar 2025',
          totalConsumption: 1245.50,
          averageConsumption: 35.58,
          unitsCount: 35
        },
        {
          name: '2º Trimestre',
          period: 'Abr - Jun 2025',
          totalConsumption: 1189.30,
          averageConsumption: 33.98,
          unitsCount: 35
        },
        {
          name: '3º Trimestre',
          period: 'Jul - Set 2025',
          totalConsumption: 1356.80,
          averageConsumption: 38.77,
          unitsCount: 35
        }
      ]
    };
  }

  goBack(): void {
    this.router.navigate(['/reports']);
  }
}