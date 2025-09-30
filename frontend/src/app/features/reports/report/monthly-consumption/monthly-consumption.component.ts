import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { Router } from '@angular/router';
import { CondominiumService } from '@core/services/condominium.service';
import { Condominium } from '@shared/models/condominium.model';
import { Subject, takeUntil } from 'rxjs';

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
  imports: [CommonModule, ReactiveFormsModule, CardComponent, ButtonComponent],
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
              <label for="period">Período:</label>
              <input 
                type="month" 
                id="period" 
                formControlName="selectedPeriod" 
                class="filter-input"
                (change)="onPeriodChange()">
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

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <app-card>
          <div class="loading-content">
            <p>Carregando relatório...</p>
          </div>
        </app-card>
      </div>

      <!-- Instructions State -->
      <div *ngIf="!loading && !data && !hasTriedToGenerate && !filtersForm.value.selectedCondominium" class="instructions-state">
        <app-card>
          <div class="instructions-content">
            <h3>📊 Relatório de Consumo Mensal</h3>
            <p>Selecione um condomínio e período para gerar o relatório detalhado de consumo.</p>
            <ul>
              <li>Escolha o condomínio desejado</li>
              <li>Defina o período de referência</li>
              <li>Clique em "Gerar Relatório"</li>
            </ul>
          </div>
        </app-card>
      </div>

      <!-- No Data State -->
      <div *ngIf="!loading && !data && hasTriedToGenerate && filtersForm.value.selectedCondominium" class="no-data-state">
        <app-card>
          <div class="no-data-content">
            <h3>Nenhum dado encontrado</h3>
            <p>Não foram encontrados dados para o período selecionado.</p>
            <p class="suggestion">Tente selecionar um período diferente ou verifique se há leituras registradas para este condomínio.</p>
          </div>
        </app-card>
      </div>

      <!-- Relatório -->
      <div *ngIf="!loading && data" class="report-content">
        <!-- Cabeçalho do Relatório -->
        <app-card class="report-header-card">
          <div class="report-info">
            <h2>{{ data.condominium.name }}</h2>
            <p class="period">Período: {{ data.period }}</p>
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
              <span class="value">{{ data.summary.unitsCount }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Consumo Total</span>
              <span class="value">{{ data.summary.totalConsumption | number:'1.2-2' }} m³</span>
            </div>
            <div class="summary-item">
              <span class="label">Consumo Médio</span>
              <span class="value">{{ data.summary.averageConsumption | number:'1.2-2' }} m³</span>
            </div>
            <div class="summary-item">
              <span class="label">Custo Total</span>
              <span class="value">{{ data.summary.totalCost | currency:'BRL':'symbol':'1.2-2' }}</span>
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
      .filter-row {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      
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
export class MonthlyConsumptionComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private condominiumService = inject(CondominiumService);
  private formBuilder = inject(FormBuilder);
  private destroy$ = new Subject<void>();
  
  data: MonthlyConsumptionData | null = null;
  currentDate = new Date();
  loading = false;
  condominiums: Condominium[] = [];
  hasTriedToGenerate = false; // Flag para controlar se já tentou gerar relatório
  
  filtersForm: FormGroup;

  constructor() {
    this.filtersForm = this.formBuilder.group({
      selectedCondominium: [''],
      selectedPeriod: [this.getCurrentMonth()]
    });
  }

  ngOnInit() {
    this.loadCondominiums();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getCurrentMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
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
    if (selectedCondominiumId && this.filtersForm.value.selectedPeriod) {
      // Limpa dados anteriores quando muda o condomínio
      this.data = null;
      this.hasTriedToGenerate = false; // Reset da flag
    }
  }

  onPeriodChange() {
    const selectedPeriod = this.filtersForm.value.selectedPeriod;
    if (this.filtersForm.value.selectedCondominium && selectedPeriod) {
      // Limpa dados anteriores quando muda o período
      this.data = null;
      this.hasTriedToGenerate = false; // Reset da flag
    }
  }

  canGenerateReport(): boolean {
    return !!(this.filtersForm.value.selectedCondominium && 
              this.filtersForm.value.selectedPeriod && 
              !this.loading);
  }

  generateReport() {
    if (!this.canGenerateReport()) return;

    this.loading = true;
    this.data = null;
    this.hasTriedToGenerate = true; // Marca que tentou gerar relatório

    // Simula chamada para o backend
    setTimeout(() => {
      this.loadReportData();
      this.loading = false;
    }, 1500);
  }

  private loadReportData() {
    const selectedCondominiumId = this.filtersForm.value.selectedCondominium;
    const selectedPeriod = this.filtersForm.value.selectedPeriod;
    
    if (!selectedCondominiumId || !selectedPeriod) {
      return;
    }

    // Encontra o condomínio selecionado
    const selectedCondominium = this.condominiums.find(c => c.id.toString() === selectedCondominiumId);
    if (!selectedCondominium) {
      return;
    }

    // Converte o período para formato legível
    const [year, month] = selectedPeriod.split('-');
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const formattedPeriod = `${monthNames[parseInt(month) - 1]} de ${year}`;

    // Simula dados do relatório (em produção viria do backend)
    this.data = {
      period: formattedPeriod,
      condominium: {
        id: selectedCondominium.id.toString(),
        name: selectedCondominium.name
      },
      units: this.generateMockUnitsData(selectedCondominium.name),
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

  private generateMockUnitsData(condominiumName: string) {
    // Gera dados mock baseados no condomínio selecionado
    const baseUnits = [
      { number: '101', resident: 'João Silva', baseConsumption: 25 },
      { number: '102', resident: 'Maria Santos', baseConsumption: 37 },
      { number: '103', resident: 'Pedro Costa', baseConsumption: 58 },
      { number: '201', resident: 'Ana Oliveira', baseConsumption: 25 },
      { number: '202', resident: 'Carlos Lima', baseConsumption: 34 },
      { number: '203', resident: 'Lucia Ferreira', baseConsumption: 42 },
      { number: '301', resident: 'Ricardo Alves', baseConsumption: 28 },
      { number: '302', resident: 'Sandra Moura', baseConsumption: 31 }
    ];

    return baseUnits.map((unit, index) => {
      // Adiciona variação baseada no hash do nome do condomínio para consistência
      const variation = (condominiumName.length + index) % 20 - 10; // Variação de -10 a +10
      const consumption = Math.max(5, unit.baseConsumption + variation);
      const previousReading = 1000 + (index * 100) + Math.floor(Math.random() * 100);
      const currentReading = previousReading + consumption;
      const cost = consumption * 3.5; // R$ 3,50 por m³

      return {
        id: (index + 1).toString(),
        number: unit.number,
        resident: unit.resident,
        currentReading,
        previousReading,
        consumption,
        cost
      };
    });
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