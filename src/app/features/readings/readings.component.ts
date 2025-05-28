import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-readings',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonComponent,
    RouterLink
  ],
  template: `
    <div class="readings-container">
      <div class="readings-header">
        <h1 class="readings-title">Leituras</h1>
        <app-button routerLink="/readings/new">Nova Leitura</app-button>
      </div>
      
      <app-card [elevated]="true" class="filters-card">
        <div class="filters-container">
          <h3 class="filters-title">Filtros</h3>
          <div class="filters-grid">
            <div class="filter-group">
              <label>Condomínio</label>
              <select class="filter-select">
                <option value="">Todos</option>
                <option *ngFor="let condo of condominiums" [value]="condo.id">{{ condo.name }}</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Tipo de Medição</label>
              <select class="filter-select">
                <option value="">Todos</option>
                <option *ngFor="let type of measurementTypes" [value]="type.id">{{ type.name }}</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Período</label>
              <select class="filter-select">
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
                <option value="180">Últimos 6 meses</option>
                <option value="365">Último ano</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
            <div class="filter-actions">
              <app-button variant="secondary" size="sm">Aplicar Filtros</app-button>
              <app-button variant="outline" size="sm">Limpar</app-button>
            </div>
          </div>
        </div>
      </app-card>
      
      <app-card [elevated]="true" class="readings-card">
        <div class="readings-table-container">
          <table class="readings-table">
            <thead>
              <tr>
                <th>Condomínio</th>
                <th>Unidade</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Data</th>
                <th>Registrado por</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let reading of readings">
                <td>{{ reading.condominium }}</td>
                <td>{{ reading.unit }}</td>
                <td>{{ reading.type }}</td>
                <td>{{ reading.value }}</td>
                <td>{{ reading.date | date:'dd/MM/yyyy' }}</td>
                <td>{{ reading.registeredBy }}</td>
                <td class="actions-cell">
                  <app-button [routerLink]="['/readings', reading.id]" size="sm" variant="outline">Detalhes</app-button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="pagination">
          <button class="pagination-button" [disabled]="currentPage === 1">Anterior</button>
          <span class="pagination-info">Página {{ currentPage }} de {{ totalPages }}</span>
          <button class="pagination-button" [disabled]="currentPage === totalPages">Próxima</button>
        </div>
      </app-card>
    </div>
  `,
  styles: [`
    .readings-container {
      padding: 1.5rem;
    }
    
    .readings-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    
    .readings-title {
      font-size: 1.875rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }
    
    .filters-card {
      margin-bottom: 1.5rem;
    }
    
    .filters-title {
      margin-top: 0;
      margin-bottom: 1rem;
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
    }
    
    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      align-items: end;
    }
    
    .filter-group {
      display: flex;
      flex-direction: column;
    }
    
    .filter-group label {
      font-size: 0.875rem;
      color: #4b5563;
      margin-bottom: 0.25rem;
    }
    
    .filter-select {
      padding: 0.5rem;
      border-radius: 0.375rem;
      border: 1px solid #d1d5db;
      background-color: white;
      color: #1f2937;
      font-size: 0.875rem;
    }
    
    .filter-actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .readings-card {
      margin-bottom: 1.5rem;
    }
    
    .readings-table-container {
      overflow-x: auto;
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
    
    .actions-cell {
      text-align: right;
    }
    
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
    }
    
    .pagination-button {
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      border: 1px solid #d1d5db;
      background-color: white;
      color: #374151;
      cursor: pointer;
    }
    
    .pagination-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .pagination-info {
      color: #6b7280;
    }
  `]
})
export class ReadingsComponent implements OnInit {
  // Dados simulados para demonstração
  readings = [
    {
      id: '1',
      condominium: 'Residencial Parque das Flores',
      unit: 'Apto 101',
      type: 'Água',
      value: '12.5 m³',
      date: new Date(2025, 4, 25),
      registeredBy: 'João Silva'
    },
    {
      id: '2',
      condominium: 'Residencial Parque das Flores',
      unit: 'Apto 203',
      type: 'Energia',
      value: '145 kWh',
      date: new Date(2025, 4, 24),
      registeredBy: 'Maria Santos'
    },
    {
      id: '3',
      condominium: 'Edifício Solar',
      unit: 'Apto 305',
      type: 'Gás',
      value: '22.3 m³',
      date: new Date(2025, 4, 23),
      registeredBy: 'Carlos Oliveira'
    },
    {
      id: '4',
      condominium: 'Condomínio Vista Mar',
      unit: 'Apto 402',
      type: 'Água',
      value: '18.7 m³',
      date: new Date(2025, 4, 22),
      registeredBy: 'Ana Pereira'
    },
    {
      id: '5',
      condominium: 'Residencial Montanhas',
      unit: 'Apto 501',
      type: 'Energia',
      value: '210 kWh',
      date: new Date(2025, 4, 21),
      registeredBy: 'Roberto Costa'
    }
  ];
  
  condominiums = [
    { id: '1', name: 'Residencial Parque das Flores' },
    { id: '2', name: 'Edifício Solar' },
    { id: '3', name: 'Condomínio Vista Mar' },
    { id: '4', name: 'Residencial Montanhas' }
  ];
  
  measurementTypes = [
    { id: '1', name: 'Água' },
    { id: '2', name: 'Energia' },
    { id: '3', name: 'Gás' }
  ];
  
  currentPage = 1;
  totalPages = 5;
  
  constructor() {}
  
  ngOnInit(): void {
    // Em uma implementação real, aqui carregaríamos os dados do backend
  }
}
