import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { MeasurementTypeService } from '@core/services/MeasurementType.service';
import { MeasurementType } from '@core/models/MeasurementType';
import { CardComponent } from '@shared/components/ui/card/card.component'; // Assuming CardComponent is available
import { ButtonComponent } from '@shared/components/ui/button/button.component'; // Assuming ButtonComponent is available

@Component({
  selector: 'app-measurement-types',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, // Add FormsModule here
    CardComponent,
    ButtonComponent
  ],
  template: `
    <div class="measurement-types-container">
      <h1 class="page-title">Tipos de Medição</h1>

      <app-card [elevated]="true" class="form-card">
        <h2 class="card-title">Adicionar Novo Tipo de Medição</h2>
        <form (ngSubmit)="onAddType()" #addTypeForm="ngForm" class="type-form">
          <div class="form-group">
            <label for="typeName">Nome:</label>
            <input type="text" id="typeName" name="typeName" class="form-control" 
                   [(ngModel)]="newMeasurementType.name" required #name="ngModel">
            <div *ngIf="name.invalid && (name.dirty || name.touched)" class="error-text">
              Nome é obrigatório.
            </div>
          </div>
          <div class="form-group">
            <label for="typeUnit">Unidade:</label>
            <input type="text" id="typeUnit" name="typeUnit" class="form-control"
                   [(ngModel)]="newMeasurementType.unit" required #unit="ngModel">
            <div *ngIf="unit.invalid && (unit.dirty || unit.touched)" class="error-text">
              Unidade é obrigatória.
            </div>
          </div>
          <div class="form-group">
            <label for="typeDescription">Descrição (Opcional):</label>
            <textarea id="typeDescription" name="typeDescription" class="form-control"
                      [(ngModel)]="newMeasurementType.description"></textarea>
          </div>
          <app-button type="submit" [disabled]="addTypeForm.invalid || isSubmitting">
            {{ isSubmitting ? 'Adicionando...' : 'Adicionar Tipo' }}
          </app-button>
          <div *ngIf="addError" class="error-text feedback-error">{{ addError }}</div>
        </form>
      </app-card>

      <app-card [elevated]="true" class="list-card">
        <h2 class="card-title">Tipos de Medição Existentes</h2>
        <div *ngIf="isLoading" class="loading-indicator">Carregando...</div>
        <div *ngIf="!isLoading && loadError" class="error-text">{{ loadError }}</div>
        <ul *ngIf="!isLoading && !loadError && measurementTypes.length > 0" class="types-list">
          <li *ngFor="let type of measurementTypes" class="type-item">
            <strong>{{ type.name }}</strong> ({{ type.unit }})
            <span *ngIf="type.description"> - {{ type.description }}</span>
          </li>
        </ul>
        <div *ngIf="!isLoading && !loadError && measurementTypes.length === 0" class="no-data-message">
          Nenhum tipo de medição encontrado.
        </div>
      </app-card>
    </div>
  `,
  styles: [`
    .measurement-types-container {
      padding: 1.5rem;
    }
    .page-title {
      font-size: 1.875rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1.5rem;
    }
    .form-card, .list-card {
      margin-bottom: 1.5rem;
    }
    .card-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-top: 0;
      margin-bottom: 1rem;
    }
    .type-form .form-group {
      margin-bottom: 1rem;
    }
    .type-form label {
      display: block;
      font-size: 0.875rem;
      color: #4b5563;
      margin-bottom: 0.25rem;
    }
    .type-form .form-control {
      width: 100%;
      padding: 0.5rem;
      border-radius: 0.375rem;
      border: 1px solid #d1d5db;
      background-color: white;
      color: #1f2937;
      font-size: 0.875rem;
    }
    .error-text {
      color: #ef4444; /* Red for errors */
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }
    .feedback-error {
      margin-top: 0.5rem;
    }
    .types-list {
      list-style: none;
      padding: 0;
    }
    .type-item {
      padding: 0.5rem 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .type-item:last-child {
      border-bottom: none;
    }
    .loading-indicator, .no-data-message {
      padding: 1rem;
      text-align: center;
      font-size: 1.125rem;
    }
  `]
})
export class MeasurementTypesComponent implements OnInit {
  measurementTypes: MeasurementType[] = [];
  newMeasurementType: Omit<MeasurementType, 'id'> = { name: '', unit: '', description: '' };
  
  isLoading = true;
  loadError: string | null = null;
  isSubmitting = false;
  addError: string | null = null;

  constructor(private measurementTypeService: MeasurementTypeService) {}

  ngOnInit(): void {
    this.loadMeasurementTypes();
  }

  loadMeasurementTypes(): void {
    this.isLoading = true;
    this.loadError = null;
    this.measurementTypeService.getMeasurementTypes().subscribe({
      next: (data) => {
        this.measurementTypes = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching measurement types:', err);
        this.loadError = 'Falha ao carregar os tipos de medição.';
        this.isLoading = false;
      }
    });
  }

  onAddType(): void {
    if (!this.newMeasurementType.name || !this.newMeasurementType.unit) {
      this.addError = "Nome e Unidade são obrigatórios.";
      return;
    }
    this.isSubmitting = true;
    this.addError = null;
    
    this.measurementTypeService.addMeasurementType(this.newMeasurementType).subscribe({
      next: (addedType) => {
        // this.measurementTypes.push(addedType); // Add to list locally OR reload
        this.loadMeasurementTypes(); // Reload the list to ensure it's up-to-date
        this.newMeasurementType = { name: '', unit: '', description: '' }; // Reset form
        this.isSubmitting = false;
        // Optionally, show a success message via a toast service or similar
      },
      error: (err) => {
        console.error('Error adding measurement type:', err);
        this.addError = err.message || 'Falha ao adicionar o tipo de medição.';
        this.isSubmitting = false;
      }
    });
  }
}
