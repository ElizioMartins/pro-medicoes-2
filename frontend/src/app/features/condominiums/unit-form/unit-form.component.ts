import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { Unit } from '@core/models/Unit';
import { UnitService } from '@core/services/Unit.service';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-unit-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardComponent,
    ButtonComponent
  ],
  template: `
    <div class="unit-form-container">
      <app-card [elevated]="true">
        <div class="card-header">
          <h2 class="form-title">{{ isEditing ? 'Editar' : 'Nova' }} Unidade</h2>
        </div>
        
        <form [formGroup]="unitForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="identifier">Identificador*</label>
            <input type="text" id="identifier" formControlName="identifier" class="form-control" placeholder="Ex: Apto 101">
            <div *ngIf="unitForm.get('identifier')?.invalid && unitForm.get('identifier')?.touched" class="error-message">
              Identificador é obrigatório
            </div>
          </div>

          <div class="form-group">
            <label for="owner">Proprietário*</label>
            <input type="text" id="owner" formControlName="owner" class="form-control" placeholder="Nome do proprietário">
            <div *ngIf="unitForm.get('owner')?.invalid && unitForm.get('owner')?.touched" class="error-message">
              Proprietário é obrigatório
            </div>
          </div>

          <div class="form-group">
            <label for="metersCount">Número de Medidores*</label>
            <input type="number" id="metersCount" formControlName="metersCount" class="form-control" min="0">
            <div *ngIf="unitForm.get('metersCount')?.invalid && unitForm.get('metersCount')?.touched" class="error-message">
              Número de medidores deve ser maior ou igual a 0
            </div>
          </div>

          <div class="buttons-container">
            <app-button type="button" [variant]="'secondary'" (click)="goBack()">Voltar</app-button>
            <app-button type="submit" [disabled]="!unitForm.valid || isSubmitting">
              {{ isSubmitting ? 'Salvando...' : 'Salvar' }}
            </app-button>
          </div>
        </form>
      </app-card>
    </div>
  `,
  styles: [`
    .unit-form-container {
      padding: 1.5rem;
    }

    .card-header {
      margin-bottom: 1.5rem;
    }

    .form-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .form-control {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: 0.25rem;
      font-size: 1rem;
      transition: border-color 0.2s;

      &:focus {
        outline: none;
        border-color: var(--primary-color);
      }
    }

    .error-message {
      color: var(--destructive);
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .buttons-container {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
    }
  `]
})
export class UnitFormComponent implements OnInit {
  unitForm: FormGroup;
  isSubmitting = false;
  isEditing = false;
  condominiumId: number = 0;
  unitId?: number;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly unitService: UnitService,
    private readonly toastService: ToastService
  ) {
    this.unitForm = this.fb.group({
      identifier: ['', Validators.required],
      owner: ['', Validators.required],
      metersCount: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.condominiumId = Number(params['condominiumId']);
      this.unitId = params['id'] ? Number(params['id']) : undefined;
      this.isEditing = !!this.unitId;

      if (this.isEditing && this.unitId) {
        this.loadUnit(this.unitId);
      }
    });
  }

  loadUnit(id: number): void {
    this.unitService.getUnitById(this.condominiumId, id).subscribe({
      next: (unit) => {
        this.unitForm.patchValue({
          identifier: unit.identifier,
          owner: unit.owner,
          metersCount: unit.metersCount
        });
      },
      error: (error) => {
        console.error('Erro ao carregar unidade:', error);
        this.toastService.show({
          title: 'Erro ao carregar unidade',
          variant: 'destructive'
        });
      }
    });
  }

  onSubmit(): void {
    if (this.unitForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const unitData: Partial<Unit> = this.unitForm.value;
      const operation = this.isEditing 
        ? this.unitService.updateUnit(this.condominiumId, this.unitId!, unitData)
        : this.unitService.createUnit(this.condominiumId, unitData);

      operation
        .pipe(finalize(() => this.isSubmitting = false))
        .subscribe({
          next: () => {
            this.toastService.show({
              title: `Unidade ${this.isEditing ? 'atualizada' : 'criada'} com sucesso!`,
              variant: 'default'
            });
            this.router.navigate(['/condominiums', this.condominiumId]);
          },
          error: (error) => {
            console.error('Erro ao salvar unidade:', error);
            this.toastService.show({
              title: `Erro ao ${this.isEditing ? 'atualizar' : 'criar'} unidade`,
              variant: 'destructive'
            });
          }
        });
    }
  }

  goBack(): void {
    this.router.navigate(['/condominiums', this.condominiumId]);
  }
}
