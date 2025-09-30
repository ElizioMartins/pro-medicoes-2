import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { Router } from '@angular/router';
import { CondominiumService } from '@core/services/condominium.service';
import { UnitService } from '@core/services/unit.service';
import { ReportService, UnitConsumptionPeriodReport } from '@core/services/report.service';
import { Condominium } from '@shared/models/condominium.model';
import { Unit } from '@shared/models/unit.model';
import { Subject, takeUntil } from 'rxjs';

// Interface removida - usando a do ReportService

@Component({
  selector: 'app-unit-consumption-period',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardComponent, ButtonComponent],
  template: `
    <div class="unit-consumption-report">
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
          <h1>Relatório de Consumo por Unidade</h1>
          <p class="subtitle">Análise detalhada de consumo em período customizado</p>
        </div>
      </div>

      <!-- Filtros e Seleção -->
      <app-card title="Filtros do Relatório" class="filters-card">
        <form [formGroup]="filtersForm" class="filters-form">
          <div class="filter-row">
            <div class="filter-group">
              <label for="condominium">Condomínio:</label>
              <select 
                id="condominium" 
                formControlName="selectedCondominium" 
                class="filter-select"
                (change)="onCondominiumChange()">
                <option value="">Selecione um condomínio...</option>
                <option 
                  *ngFor="let condominium of condominiums" 
                  [value]="condominium.id">
                  {{ condominium.name }}
                </option>
              </select>
            </div>

            <div class="filter-group">
              <label for="unit">Unidade:</label>
              <select 
                id="unit" 
                formControlName="selectedUnit" 
                class="filter-select"
                [disabled]="!units.length"
                (change)="onUnitChange()">
                <option value="">Selecione uma unidade...</option>
                <option 
                  *ngFor="let unit of units" 
                  [value]="unit.id">
                  {{ unit.number }}
                </option>
              </select>
            </div>
          </div>

          <div class="filter-row">
            <div class="filter-group">
              <label for="startDate">Data Inicial:</label>
              <input 
                type="date" 
                id="startDate" 
                formControlName="startDate" 
                class="filter-input"
                (change)="onDateChange()">
            </div>

            <div class="filter-group">
              <label for="endDate">Data Final:</label>
              <input 
                type="date" 
                id="endDate" 
                formControlName="endDate" 
                class="filter-input"
                (change)="onDateChange()">
            </div>

            <div class="filter-actions">
              <app-button 
                variant="primary" 
                [disabled]="!canGenerateReport()"
                (click)="generateReport()">
                Gerar Relatório
              </app-button>
            </div>
          </div>
        </form>
      </app-card>

      <!-- Instructions State -->
      <div *ngIf="!loading && !data && !hasTriedToGenerate && !filtersForm.value.selectedCondominium" class="instructions-state">
        <app-card>
          <div class="instructions-content">
            <h3>🏠 Relatório de Consumo por Unidade</h3>
            <p>Analise o consumo detalhado de uma unidade específica em qualquer período.</p>
            <ul>
              <li>Escolha o condomínio desejado</li>
              <li>Selecione a unidade específica</li>
              <li>Defina o período inicial e final</li>
              <li>Clique em "Gerar Relatório"</li>
            </ul>
          </div>
        </app-card>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <app-card>
          <div class="loading-content">
            <p>Carregando relatório...</p>
          </div>
        </app-card>
      </div>

      <!-- No Data State -->
      <div *ngIf="!loading && !data && hasTriedToGenerate && filtersForm.value.selectedUnit" class="no-data-state">
        <app-card>
          <div class="no-data-content">
            <h3>{{ errorMessage ? 'Erro ao gerar relatório' : 'Nenhum dado encontrado' }}</h3>
            <p>{{ errorMessage || 'Não foram encontradas leituras para o período selecionado.' }}</p>
            <p *ngIf="!errorMessage" class="suggestion">Tente selecionar um período diferente ou verifique se há leituras registradas para esta unidade.</p>
          </div>
        </app-card>
      </div>

      <!-- Relatório -->
      <div *ngIf="!loading && data" class="report-content">
        <!-- Cabeçalho do Relatório -->
        <app-card class="report-header-card">
          <div class="report-info">
            <h2>{{ data.condominium.name }} - Unidade {{ data.unit.number }}</h2>
            <p class="period">Período: {{ formatPeriod(data.period) }}</p>
            <p class="generation-date">
              Relatório gerado em {{ currentDate | date: 'dd/MM/yyyy HH:mm' }}
            </p>
          </div>
        </app-card>

        <!-- Resumo Executivo -->
        <app-card title="Resumo do Período" class="summary-card">
          <div class="summary-grid" *ngIf="data.summary">
            <div class="summary-item">
              <span class="label">Total de Leituras</span>
              <span class="value">{{ data.summary.readingsCount }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Consumo Total</span>
              <span class="value">{{ data.summary.totalConsumption | number:'1.2-2' }} m³</span>
            </div>
            <div class="summary-item">
              <span class="label">Consumo Médio Mensal</span>
              <span class="value">{{ data.summary.averageMonthlyConsumption | number:'1.2-2' }} m³</span>
            </div>
            <div class="summary-item">
              <span class="label">Custo Total</span>
              <span class="value">{{ data.summary.totalCost | currency:'BRL':'symbol':'1.2-2' }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Maior Consumo</span>
              <span class="value">{{ data.summary.highestConsumption | number:'1.2-2' }} m³</span>
            </div>
            <div class="summary-item">
              <span class="label">Menor Consumo</span>
              <span class="value">{{ data.summary.lowestConsumption | number:'1.2-2' }} m³</span>
            </div>
          </div>
        </app-card>

        <!-- Histórico de Leituras -->
        <app-card title="Histórico de Leituras" class="details-card">
          <div class="table-container">
            <table class="readings-table" *ngIf="data.readings">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Mês Referência</th>
                  <th>Leitura</th>
                  <th>Consumo (m³)</th>
                  <th>Custo (R$)</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let reading of data.readings" [class.high-consumption]="isHighConsumption(reading.consumption)">
                  <td class="date">{{ reading.date | date: 'dd/MM/yyyy' }}</td>
                  <td class="reference-month">{{ formatReferenceMonth(reading.referenceMonth) }}</td>
                  <td class="reading">{{ reading.currentReading | number:'1.0-0' }}</td>
                  <td class="consumption">{{ reading.consumption | number:'1.2-2' }}</td>
                  <td class="cost">{{ reading.cost | currency:'BRL':'symbol':'1.2-2' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </app-card>

        <!-- Análises e Observações -->
        <app-card title="Análises e Observações" class="analysis-card">
          <div class="analysis-content">
            <div class="observation" *ngIf="hasHighConsumptionReadings()">
              <h4>⚠️ Leituras com Consumo Elevado</h4>
              <p>Foram identificadas leituras com consumo significativamente acima da média:</p>
              <ul>
                <li *ngFor="let reading of getHighConsumptionReadings()">
                  <strong>{{ formatReferenceMonth(reading.referenceMonth) }}</strong> - {{ reading.consumption | number:'1.2-2' }} m³
                  ({{ getConsumptionVariation(reading.consumption) }}% acima da média)
                </li>
              </ul>
            </div>

            <div class="trend-analysis">
              <h4>📈 Análise de Tendência</h4>
              <p>{{ getTrendAnalysis() }}</p>
            </div>

            <div class="recommendation">
              <h4>💡 Recomendações</h4>
              <ul>
                <li>Monitore padrões de consumo mensal para identificar vazamentos</li>
                <li>Compare com unidades similares do mesmo condomínio</li>
                <li>Considere implementar medidas de economia em meses de alto consumo</li>
                <li>Verifique equipamentos em caso de variações bruscas</li>
              </ul>
            </div>
          </div>
        </app-card>
      </div>
    </div>
  `,
  styles: [`
    .unit-consumption-report {
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

    /* Estilos do formulário de filtros */
    .filters-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .filter-row {
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 1.5rem;
      align-items: end;
    }

    .filter-row:last-child {
      grid-template-columns: 1fr 1fr auto;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-group label {
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
    }

    .filter-select,
    .filter-input {
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      background-color: white;
      transition: border-color 0.2s;
    }

    .filter-select:focus,
    .filter-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .filter-select:disabled {
      background-color: #f3f4f6;
      color: #6b7280;
    }

    .filter-actions {
      display: flex;
      align-items: center;
    }

    /* Estados de loading e sem dados */
    .loading-state,
    .no-data-state,
    .instructions-state {
      margin: 2rem 0;
    }

    .loading-content,
    .no-data-content,
    .instructions-content {
      text-align: center;
      padding: 2rem;
    }

    .loading-content p {
      color: #6b7280;
      margin: 0;
    }

    .no-data-content h3,
    .instructions-content h3 {
      margin: 0 0 0.5rem 0;
      color: #111827;
    }

    .no-data-content p,
    .instructions-content p {
      color: #6b7280;
      margin: 0 0 0.5rem 0;
    }

    .no-data-content .suggestion {
      color: #3b82f6;
      font-size: 0.875rem;
      margin-top: 1rem;
    }

    .instructions-content ul {
      text-align: left;
      display: inline-block;
      margin: 1rem 0 0 0;
      padding-left: 1.5rem;
    }

    .instructions-content li {
      color: #6b7280;
      margin-bottom: 0.5rem;
    }

    .report-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
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

    .readings-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .readings-table th,
    .readings-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    .readings-table th {
      background-color: #f8fafc;
      font-weight: 600;
      color: #374151;
    }

    .readings-table tbody tr:hover {
      background-color: #f8fafc;
    }

    .readings-table tbody tr.high-consumption {
      background-color: #fef3c7;
    }

    .readings-table tbody tr.high-consumption:hover {
      background-color: #fde68a;
    }

    .date,
    .reference-month {
      font-weight: 500;
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
    .trend-analysis,
    .recommendation {
      padding: 1rem;
      border-radius: 0.5rem;
    }

    .observation {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
    }

    .trend-analysis {
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
    }

    .recommendation {
      background-color: #ecfdf5;
      border-left: 4px solid #10b981;
    }

    .observation h4,
    .trend-analysis h4,
    .recommendation h4 {
      margin: 0 0 0.75rem 0;
      color: #111827;
    }

    .observation p,
    .trend-analysis p,
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
      .filter-row {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      
      .summary-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .readings-table {
        font-size: 0.75rem;
      }
      
      .readings-table th,
      .readings-table td {
        padding: 0.5rem;
      }
    }
  `]
})
export class UnitConsumptionPeriodComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private condominiumService = inject(CondominiumService);
  private unitService = inject(UnitService);
  private reportService = inject(ReportService);
  private formBuilder = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  data: UnitConsumptionPeriodReport | null = null;
  currentDate = new Date();
  loading = false;
  condominiums: Condominium[] = [];
  units: Unit[] = [];
  hasTriedToGenerate = false;
  errorMessage = '';

  filtersForm: FormGroup;

  constructor() {
    this.filtersForm = this.formBuilder.group({
      selectedCondominium: ['', Validators.required],
      selectedUnit: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadCondominiums();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCondominiums() {
    this.condominiumService.getCondominiums(0, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.condominiums = response.condominiums;
        },
        error: (error) => {
          console.error('Erro ao carregar condomínios:', error);
        }
      });
  }

  onCondominiumChange() {
    const selectedCondominiumId = this.filtersForm.value.selectedCondominium;
    this.units = [];
    this.filtersForm.patchValue({ selectedUnit: '' });
    this.data = null;
    this.hasTriedToGenerate = false;
    this.errorMessage = '';

    if (selectedCondominiumId) {
      this.loadUnits(parseInt(selectedCondominiumId));
    }
  }

  private loadUnits(condominiumId: number) {
    this.unitService.getUnitsByCondominiumId(condominiumId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: {units: Unit[], total: number, skip: number, limit: number}) => {
          this.units = response.units || [];
        },
        error: (error: Error) => {
          console.error('Erro ao carregar unidades:', error);
        }
      });
  }

  onUnitChange() {
    this.data = null;
    this.hasTriedToGenerate = false;
    this.errorMessage = '';
  }

  onDateChange() {
    this.data = null;
    this.hasTriedToGenerate = false;
    this.errorMessage = '';
  }

  canGenerateReport(): boolean {
    return this.filtersForm.valid && !this.loading;
  }

  generateReport() {
    if (!this.canGenerateReport()) return;

    this.loading = true;
    this.data = null;
    this.hasTriedToGenerate = true;
    this.errorMessage = '';

    const formValue = this.filtersForm.value;
    const selectedCondominiumId = parseInt(formValue.selectedCondominium);
    const selectedUnitId = parseInt(formValue.selectedUnit);

    this.reportService.generateUnitConsumptionPeriodReport(
      selectedCondominiumId,
      selectedUnitId, 
      formValue.startDate,
      formValue.endDate
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (report) => {
          this.data = report;
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao gerar relatório:', error);
          this.loading = false;
          this.errorMessage = error.message || 'Erro ao gerar o relatório. Tente novamente.';
        }
      });
  }

  formatPeriod(period: { startDate: string; endDate: string; totalDays: number }): string {
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    return `${start.toLocaleDateString('pt-BR')} a ${end.toLocaleDateString('pt-BR')} (${period.totalDays} dias)`;
  }

  formatReferenceMonth(referenceMonth: string): string {
    const [year, month] = referenceMonth.split('-');
    const monthNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    return `${monthNames[parseInt(month) - 1]}/${year}`;
  }

  isHighConsumption(consumption: number): boolean {
    if (!this.data?.summary.averageMonthlyConsumption) return false;
    return consumption > this.data.summary.averageMonthlyConsumption * 1.3;
  }

  hasHighConsumptionReadings(): boolean {
    return this.getHighConsumptionReadings().length > 0;
  }

  getHighConsumptionReadings() {
    if (!this.data?.readings) return [];
    return this.data.readings.filter(reading => this.isHighConsumption(reading.consumption));
  }

  getConsumptionVariation(consumption: number): number {
    if (!this.data?.summary.averageMonthlyConsumption) return 0;
    return Math.round(((consumption - this.data.summary.averageMonthlyConsumption) / this.data.summary.averageMonthlyConsumption) * 100);
  }

  getTrendAnalysis(): string {
    if (!this.data?.readings || this.data.readings.length < 2) {
      return 'Período insuficiente para análise de tendência.';
    }

    const readings = this.data.readings;
    const firstHalf = readings.slice(0, Math.ceil(readings.length / 2));
    const secondHalf = readings.slice(Math.ceil(readings.length / 2));

    const firstHalfAvg = firstHalf.reduce((sum, r) => sum + r.consumption, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, r) => sum + r.consumption, 0) / secondHalf.length;

    const diff = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    if (Math.abs(diff) < 5) {
      return 'Consumo estável ao longo do período analisado.';
    } else if (diff > 0) {
      return `Tendência de aumento no consumo: ${Math.abs(diff).toFixed(1)}% maior na segunda metade do período.`;
    } else {
      return `Tendência de redução no consumo: ${Math.abs(diff).toFixed(1)}% menor na segunda metade do período.`;
    }
  }

  goBack(): void {
    this.router.navigate(['/reports']);
  }
}