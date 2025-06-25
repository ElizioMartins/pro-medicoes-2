import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MeasurementTypeService } from '../../core/services/MeasurementType.service';
import { MeasurementType } from "../../shared/models/measurement-type.model";
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-measurement-types',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    ButtonComponent
  ],
  template: `
    <div class="measurement-types-container">
      <h1 class="page-title">Tipos de Medição</h1>

      <app-card [elevated]="true" class="form-card">
        <h2 class="card-title">{{ editingType ? 'Editar' : 'Adicionar Novo' }} Tipo de Medição</h2>
        <form (ngSubmit)="onSubmit()" #addTypeForm="ngForm" class="type-form">
          <div class="form-group">
            <label for="typeName">Nome:</label>
            <input type="text" id="typeName" name="typeName" class="form-control" 
                   [(ngModel)]="currentType.name" required #name="ngModel">
            <div *ngIf="name.invalid && (name.dirty || name.touched)" class="error-text">
              Nome é obrigatório.
            </div>
          </div>
          <div class="form-group">
            <label for="typeUnit">Unidade:</label>
            <input type="text" id="typeUnit" name="typeUnit" class="form-control"
                   [(ngModel)]="currentType.unit" required #unit="ngModel">
            <div *ngIf="unit.invalid && (unit.dirty || unit.touched)" class="error-text">
              Unidade é obrigatória.            </div>
          </div>
          <div class="form-group">
            <label class="flex items-center gap-2">
              <input type="checkbox" id="typeActive" name="typeActive" class="form-checkbox"
                    [(ngModel)]="currentType.active">
              <span>Ativo</span>
            </label>
          </div>
          <div class="flex gap-2"><app-button type="submit" [variant]="editingType ? 'secondary' : 'primary'" [disabled]="addTypeForm.invalid || isSubmitting">
              {{ isSubmitting ? (editingType ? 'Salvando...' : 'Adicionando...') : (editingType ? 'Salvar' : 'Adicionar') }}
            </app-button>
            <app-button *ngIf="editingType" type="button" variant="outline" (click)="cancelEdit()">
              Cancelar
            </app-button>
          </div>
          <div *ngIf="formError" class="error-text feedback-error">{{ formError }}</div>
        </form>
      </app-card>

      <app-card [elevated]="true" class="list-card">
        <h2 class="card-title">Tipos de Medição Existentes</h2>
        <div *ngIf="isLoading" class="loading-indicator">Carregando...</div>
        <div *ngIf="!isLoading && loadError" class="error-text">{{ loadError }}</div>
        <ul *ngIf="!isLoading && !loadError && measurementTypes.length > 0" class="types-list">
          <li *ngFor="let type of measurementTypes" class="type-item">
            <div class="type-content">              <div>
                <strong>{{ type.name }}</strong> ({{ type.unit }})
                <span class="status-badge" [class.active]="type.active" [class.inactive]="!type.active">
                  {{ type.active ? 'Ativo' : 'Inativo' }}
                </span>
              </div>
              <div class="type-actions">
                <button class="action-btn edit-btn" (click)="startEdit(type)">Editar</button>
                <button class="action-btn delete-btn" (click)="confirmDelete(type)">Excluir</button>
              </div>
            </div>
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
      color: #ef4444;
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
      padding: 0.75rem 0;
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
    .type-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .type-actions {
      display: flex;
      gap: 0.5rem;
    }
    .action-btn {
      padding: 0.25rem 0.75rem;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      cursor: pointer;
      border: 1px solid transparent;
    }
    .edit-btn {
      background-color: #d1d5db;
      color: #1f2937;
    }
    .edit-btn:hover {
      background-color: #9ca3af;
    }
    .delete-btn {
      background-color: #fee2e2;
      color: #dc2626;
    }    .delete-btn:hover {
      background-color: #fecaca;
    }
    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      margin-left: 0.5rem;
    }
    .status-badge.active {
      background-color: #bbf7d0;
      color: #166534;
    }
    .status-badge.inactive {
      background-color: #fecaca;
      color: #991b1b;
    }
  `]
})
export class MeasurementTypesComponent implements OnInit {
  measurementTypes: MeasurementType[] = [];
  currentType: Omit<MeasurementType, 'id'> = { name: '', unit: '', active: true };
  editingType: MeasurementType | null = null;
  
  isLoading = true;
  loadError: string | null = null;
  isSubmitting = false;
  formError: string | null = null;

  constructor(
    private measurementTypeService: MeasurementTypeService,
    private toastService: ToastService
  ) {}

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
        console.error('Erro ao carregar tipos de medição:', err);
        this.loadError = 'Falha ao carregar os tipos de medição.';
        this.isLoading = false;
      }
    });
  }

  startEdit(type: MeasurementType): void {
    this.editingType = type;    this.currentType = {
      name: type.name,
      unit: type.unit,
      active: type.active ?? true
    };
  }
  cancelEdit(): void {
    this.editingType = null;
    this.currentType = { name: '', unit: '', active: true };
    this.formError = null;
  }

  onSubmit(): void {
    if (!this.currentType.name || !this.currentType.unit) {
      this.formError = "Nome e Unidade são obrigatórios.";
      return;
    }
    this.isSubmitting = true;
    this.formError = null;

    if (this.editingType) {
      // Atualizando tipo existente
      this.measurementTypeService.updateMeasurementType(this.editingType.id, this.currentType).subscribe({
        next: () => {
          this.loadMeasurementTypes();
          this.cancelEdit();
          this.toastService.show({
            title: 'Tipo de medição atualizado com sucesso',
            variant: 'default'
          });
        },
        error: (err) => {
          console.error('Erro ao atualizar tipo de medição:', err);
          this.formError = err.error?.detail ?? 'Falha ao atualizar o tipo de medição.';
        }
      }).add(() => {
        this.isSubmitting = false;
      });
    } else {
      // Adicionando novo tipo
      this.measurementTypeService.addMeasurementType(this.currentType).subscribe({
        next: () => {          this.loadMeasurementTypes();
          this.currentType = { name: '', unit: '', active: true };
          this.toastService.show({
            title: 'Tipo de medição criado com sucesso',
            variant: 'default'
          });
        },
        error: (err) => {
          console.error('Erro ao adicionar tipo de medição:', err);
          this.formError = err.error?.detail ?? 'Falha ao adicionar o tipo de medição.';
        }
      }).add(() => {
        this.isSubmitting = false;
      });
    }
  }

  confirmDelete(type: MeasurementType): void {
    if (confirm(`Tem certeza que deseja excluir o tipo de medição "${type.name}"?`)) {
      this.measurementTypeService.deleteMeasurementType(type.id).subscribe({
        next: () => {
          this.loadMeasurementTypes();
          this.toastService.show({
            title: 'Tipo de medição excluído com sucesso',
            variant: 'default'
          });
        },
        error: (err) => {
          console.error('Erro ao excluir tipo de medição:', err);
          this.toastService.show({
            title: 'Erro ao excluir tipo de medição',
            description: err.error?.detail ?? 'Falha ao excluir o tipo de medição.',
            variant: 'destructive'
          });
        }
      });
    }
  }
}
