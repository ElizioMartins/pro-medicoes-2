import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { Observable, tap } from 'rxjs'; // Import Observable and tap

// Import Services
import { ReadingService } from '@core/services/Reading.service';
import { MeasurementTypeService } from '@core/services/MeasurementType.service';
import { CondominiumService } from '@core/services/Condominium.service';

// Import Models
import { Reading } from '@core/models/Reading';
import { MeasurementType } from '@core/models/MeasurementType';
import { Condominium } from '@core/models/Condominium';

@Component({
  selector: 'app-readings',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonComponent,
    RouterLink,
    FormsModule // <--- Add this
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
              <select class="filter-select" [(ngModel)]="selectedCondominiumId" (ngModelChange)="applyFilters()">
                <option value="">Todos</option>
                <option *ngFor="let condo of condominiums" [value]="condo.id">{{ condo.name }}</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Tipo de Medição</label>
              <select class="filter-select" [(ngModel)]="selectedMeasurementTypeId" (ngModelChange)="applyFilters()">
                <option value="">Todos</option>
                <option *ngFor="let type of measurementTypes" [value]="type.id">{{ type.name }}</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Período</label>
              <select class="filter-select" [(ngModel)]="selectedPeriod" (ngModelChange)="applyFilters()">
                <option value="all">Todos</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
                <option value="180">Últimos 6 meses</option>
                <option value="365">Último ano</option>
                <!-- <option value="custom">Personalizado</option> -->
              </select>
            </div>
            <div class="filter-actions">
              <!-- Apply filters button can be removed if filtering is done on change -->
              <!-- <app-button variant="secondary" size="sm" (click)="applyFilters()">Aplicar Filtros</app-button> -->
              <app-button variant="outline" size="sm" (click)="clearFilters()">Limpar</app-button>
            </div>
          </div>
        </div>
      </app-card>
      
      <app-card [elevated]="true" class="readings-card">
        <div *ngIf="isLoading" class="loading-indicator">Carregando...</div>
        <div *ngIf="!isLoading && error" class="error-message">{{ error }}</div>
        
        <div *ngIf="!isLoading && !error && filteredReadings.length === 0" class="no-data-message">Nenhuma leitura encontrada.</div>

        <div *ngIf="!isLoading && !error && filteredReadings.length > 0" class="readings-table-container">
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
              <tr *ngFor="let reading of paginatedReadings">
                <td>{{ reading.condominiumName }}</td>
                <td>{{ reading.unit }}</td>
                <td>{{ reading.measurementTypeName }}</td>
                <td>{{ reading.status === 'INACCESSIBLE' ? reading.inaccessibleReason : reading.currentReading }}</td>
                <td>{{ reading.date | date:'dd/MM/yyyy' }}</td>
                <td>{{ reading.registeredBy }}</td>
                <td class="actions-cell">
                  <app-button [routerLink]="['/readings', reading.id, 'form']" size="sm" variant="outline">
                    {{ reading.status === 'PENDING' ? 'Registrar' : 'Ver/Editar' }}
                  </app-button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div *ngIf="!isLoading && !error && filteredReadings.length > 0" class="pagination">
          <button class="pagination-button" (click)="previousPage()" [disabled]="currentPage === 1">Anterior</button>
          <span class="pagination-info">Página {{ currentPage }} de {{ totalPages }}</span>
          <button class="pagination-button" (click)="nextPage()" [disabled]="currentPage === totalPages">Próxima</button>
        </div>
      </app-card>
    </div>
  `,
  styles: [`
    // ... (keep existing styles, add if needed for loading/error/no-data messages) ...
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
    .loading-indicator, .error-message, .no-data-message {
      padding: 1rem;
      text-align: center;
      font-size: 1.125rem;
    }
    .error-message {
      color: #ef4444; /* Red color for errors */
    }
  `]
})
export class ReadingsComponent implements OnInit {
  allReadings: Reading[] = [];
  filteredReadings: Reading[] = [];
  paginatedReadings: Reading[] = [];
  
  condominiums: Condominium[] = [];
  measurementTypes: MeasurementType[] = [];

  isLoading = true;
  error: string | null = null;
  
  // Filter selections
  selectedCondominiumId: string = "";
  selectedMeasurementTypeId: string = "";
  selectedPeriod: string = "all";

  // Pagination
  currentPage = 1;
  itemsPerPage = 5; // Or any other number you prefer
  totalPages = 1;

  constructor(
    private readingService: ReadingService,
    private measurementTypeService: MeasurementTypeService,
    private condominiumService: CondominiumService
  ) {}
  
  ngOnInit(): void {
    this.isLoading = true;
    this.error = null;
    // Fetch all necessary data
    this.condominiumService.getCondominiums().subscribe({
      next: data => this.condominiums = data,
      error: err => console.error('Error fetching condominiums', err) // Basic error handling
    });

    this.measurementTypeService.getMeasurementTypes().subscribe({
      next: data => this.measurementTypes = data,
      error: err => console.error('Error fetching measurement types', err) // Basic error handling
    });

    this.readingService.getReadings().subscribe({
      next: data => {
        this.allReadings = data;
        this.applyFilters(); // Apply initial filters (which might be none)
        this.isLoading = false;
      },
      error: err => {
        console.error('Error fetching readings', err);
        this.error = 'Falha ao carregar as leituras. Tente novamente mais tarde.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let readings = [...this.allReadings];

    if (this.selectedCondominiumId) {
      readings = readings.filter(r => r.condominiumId === this.selectedCondominiumId);
    }

    if (this.selectedMeasurementTypeId) {
      readings = readings.filter(r => r.measurementTypeId === this.selectedMeasurementTypeId);
    }
    
    if (this.selectedPeriod !== "all") {
      const now = new Date();
      // Create a new date object for cutoffDate to avoid modifying 'now' in-place with setDate
      const cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const daysToSubtract = parseInt(this.selectedPeriod, 10);
      cutoffDate.setDate(cutoffDate.getDate() - daysToSubtract); // Correctly subtract days
      
      readings = readings.filter(r => {
        const readingDate = new Date(r.date);
        return readingDate >= cutoffDate;
      });
    }

    this.filteredReadings = readings;
    this.currentPage = 1; // Reset to first page after filtering
    this.updatePaginatedReadings();
  }

  clearFilters(): void {
    this.selectedCondominiumId = "";
    this.selectedMeasurementTypeId = "";
    this.selectedPeriod = "all";
    this.applyFilters();
  }

  updatePaginatedReadings(): void {
    this.totalPages = Math.ceil(this.filteredReadings.length / this.itemsPerPage);
    if (this.totalPages === 0) this.totalPages = 1; // Ensure totalPages is at least 1

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedReadings = this.filteredReadings.slice(startIndex, startIndex + this.itemsPerPage);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedReadings();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedReadings();
    }
  }
}
