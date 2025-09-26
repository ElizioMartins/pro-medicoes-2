import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { Router } from '@angular/router';

interface MonthlyConsumptionData {
  period: string;
  condominium: {
    id: string;
    name: string;
  };
  units: {
    id: string;
    number: string;
    resident: string;
    currentReading: number;
    previousReading: number;
    consumption: number;
    cost: number;
  }[];
  summary: {
    totalConsumption: number;
    totalCost: number;
    averageConsumption: number;
    unitsCount: number;
  };
}

@Component({
  selector: 'app-monthly-consumption',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonComponent],
  template: `
    <div class="monthly-consumption-report">
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
          <h1>Relatório de Consumo Mensal</h1>
          <p class="subtitle">Análise detalhada do consumo por unidade</p>
        </div>
      </div>

      <!-- Cabeçalho do Relatório -->
      <app-card class="report-header-card">
        <div class="report-info">
          <h2>{{ data?.condominium?.name }}</h2>
          <p class="period">Período: {{ data?.period }}</p>
          <p class="generation-date">
            Relatório gerado em {{ currentDate | date: 'dd/MM/yyyy HH:mm' }}
          </p>
        </div>
      </app-card>

      <!-- Resumo Executivo -->
      <app-card title="Resumo Executivo" class="summary-card">
        <div class="summary-grid" *ngIf="data?.summary">
          <div class="summary-item">
            <span class="label">Total de Unidades</span>
            <span class="value">{{ data?.summary?.unitsCount }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Consumo Total</span>
            <span class="value">{{ data?.summary?.totalConsumption | number:'1.2-2' }} m³</span>
          </div>
          <div class="summary-item">
            <span class="label">Consumo Médio</span>
            <span class="value">{{ data?.summary?.averageConsumption | number:'1.2-2' }} m³</span>
          </div>
          <div class="summary-item">
            <span class="label">Custo Total</span>
            <span class="value">{{ data?.summary?.totalCost | currency:'BRL':'symbol':'1.2-2' }}</span>
          </div>
        </div>
      </app-card>

      <!-- Detalhamento por Unidade -->
      <app-card title="Consumo por Unidade" class="details-card">
        <div class="table-container">
          <table class="consumption-table" *ngIf="data?.units">
            <thead>
              <tr>
                <th>Unidade</th>
                <th>Morador</th>
                <th>Leitura Anterior</th>
                <th>Leitura Atual</th>
                <th>Consumo (m³)</th>
                <th>Custo (R$)</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let unit of data?.units" [class.high-consumption]="isHighConsumption(unit.consumption)">
                <td class="unit-number">{{ unit.number }}</td>
                <td>{{ unit.resident }}</td>
                <td class="reading">{{ unit.previousReading | number:'1.0-0' }}</td>
                <td class="reading">{{ unit.currentReading | number:'1.0-0' }}</td>
                <td class="consumption">{{ unit.consumption | number:'1.2-2' }}</td>
                <td class="cost">{{ unit.cost | currency:'BRL':'symbol':'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </app-card>

      <!-- Análises e Observações -->
      <app-card title="Análises e Observações" class="analysis-card">
        <div class="analysis-content">
          <div class="observation" *ngIf="getHighConsumptionUnits().length > 0">
            <h4>⚠️ Unidades com Consumo Elevado</h4>
            <p>As seguintes unidades apresentaram consumo acima da média:</p>
            <ul>
              <li *ngFor="let unit of getHighConsumptionUnits()">
                <strong>Unidade {{ unit.number }}</strong> - {{ unit.consumption | number:'1.2-2' }} m³
                ({{ getConsumptionVariation(unit.consumption) }}% acima da média)
              </li>
            </ul>
          </div>

          <div class="recommendation">
            <h4>💡 Recomendações</h4>
            <ul>
              <li>Verificar possíveis vazamentos nas unidades com consumo elevado</li>
              <li>Orientar moradores sobre práticas de economia de água</li>
              <li>Considerar instalação de dispositivos economizadores</li>
              <li>Agendar vistoria técnica nas unidades com variação superior a 30%</li>
            </ul>
          </div>
        </div>
      </app-card>
    </div>
  `,
  styles: [`
    .monthly-consumption-report {
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

    .report-header-card .period {
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

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 1rem;
      background-color: #f8fafc;
      border-radius: 0.5rem;
    }

    .summary-item .label {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }

    .summary-item .value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
    }

    .table-container {
      overflow-x: auto;
    }

    .consumption-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .consumption-table th,
    .consumption-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    .consumption-table th {
      background-color: #f8fafc;
      font-weight: 600;
      color: #374151;
    }

    .consumption-table tbody tr:hover {
      background-color: #f8fafc;
    }

    .consumption-table tbody tr.high-consumption {
      background-color: #fef3c7;
    }

    .consumption-table tbody tr.high-consumption:hover {
      background-color: #fde68a;
    }

    .unit-number {
      font-weight: 600;
    }

    .reading,
    .consumption,
    .cost {
      text-align: right;
      font-family: 'Courier New', monospace;
    }

    .analysis-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .observation,
    .recommendation {
      padding: 1rem;
      border-radius: 0.5rem;
    }

    .observation {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
    }

    .recommendation {
      background-color: #ecfdf5;
      border-left: 4px solid #10b981;
    }

    .observation h4,
    .recommendation h4 {
      margin: 0 0 0.75rem 0;
      color: #111827;
    }

    .observation p,
    .recommendation p {
      margin: 0 0 0.5rem 0;
    }

    .observation ul,
    .recommendation ul {
      margin: 0;
      padding-left: 1.5rem;
    }

    .observation li,
    .recommendation li {
      margin-bottom: 0.25rem;
    }

    @media (max-width: 768px) {
      .summary-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .consumption-table {
        font-size: 0.75rem;
      }
      
      .consumption-table th,
      .consumption-table td {
        padding: 0.5rem;
      }
    }
  `]
})
export class MonthlyConsumptionComponent implements OnInit {
  private router = inject(Router);
  
  data: MonthlyConsumptionData | null = null;
  currentDate = new Date();

  ngOnInit() {
    this.loadReportData();
  }

  private loadReportData() {
    // Simula dados do relatório (em produção viria do backend)
    this.data = {
      period: 'Janeiro de 2025',
      condominium: {
        id: '1',
        name: 'Residencial Parque das Flores'
      },
      units: [
        {
          id: '1',
          number: '101',
          resident: 'João Silva',
          currentReading: 1245,
          previousReading: 1220,
          consumption: 25,
          cost: 87.50
        },
        {
          id: '2',
          number: '102',
          resident: 'Maria Santos',
          currentReading: 987,
          previousReading: 950,
          consumption: 37,
          cost: 129.50
        },
        {
          id: '3',
          number: '103',
          resident: 'Pedro Costa',
          currentReading: 1456,
          previousReading: 1398,
          consumption: 58,
          cost: 203.00
        },
        {
          id: '4',
          number: '201',
          resident: 'Ana Oliveira',
          currentReading: 823,
          previousReading: 798,
          consumption: 25,
          cost: 87.50
        },
        {
          id: '5',
          number: '202',
          resident: 'Carlos Lima',
          currentReading: 1123,
          previousReading: 1089,
          consumption: 34,
          cost: 119.00
        }
      ],
      summary: {
        totalConsumption: 0,
        totalCost: 0,
        averageConsumption: 0,
        unitsCount: 0
      }
    };

    // Calcula o resumo
    if (this.data.units) {
      this.data.summary.unitsCount = this.data.units.length;
      this.data.summary.totalConsumption = this.data.units.reduce((sum, unit) => sum + unit.consumption, 0);
      this.data.summary.totalCost = this.data.units.reduce((sum, unit) => sum + unit.cost, 0);
      this.data.summary.averageConsumption = this.data.summary.totalConsumption / this.data.summary.unitsCount;
    }
  }

  isHighConsumption(consumption: number): boolean {
    if (!this.data?.summary.averageConsumption) return false;
    return consumption > this.data.summary.averageConsumption * 1.3; // 30% acima da média
  }

  getHighConsumptionUnits() {
    if (!this.data?.units) return [];
    return this.data.units.filter(unit => this.isHighConsumption(unit.consumption));
  }

  getConsumptionVariation(consumption: number): number {
    if (!this.data?.summary.averageConsumption) return 0;
    return Math.round(((consumption - this.data.summary.averageConsumption) / this.data.summary.averageConsumption) * 100);
  }

  goBack(): void {
    this.router.navigate(['/reports']);
  }
}