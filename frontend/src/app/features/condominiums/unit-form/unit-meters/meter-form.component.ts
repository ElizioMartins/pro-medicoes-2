import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';

// UI Components
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InputComponent } from '@shared/components/ui/input/input.component';

// Models
import { Meter, MeterCreate, MeterUpdate } from "../../shared/models/meter.model";
import { MeasurementType } from "../../shared/models/measurement-type.model";

// Services
import { MeterService } from '../../core/services/meter.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-meter-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    ButtonComponent,
    InputComponent
  ],
  template: `
    <div class="container mx-auto p-2 sm:p-4">
      <app-card>
        <div class="p-4 sm:p-6">
          <!-- Header responsivo -->
          <div class="mb-6">
            <h1 class="text-xl sm:text-2xl font-bold text-gray-800">
              {{ isEditMode() ? 'Editar' : 'Novo' }} Medidor
            </h1>
            <p class="text-sm text-gray-600 mt-1">
              {{ isEditMode() ? 'Atualize as informações do medidor' : 'Cadastre um novo medidor para a unidade' }}
            </p>
          </div>
          
          <!-- Loading State -->
          <div *ngIf="isLoading()" class="text-center py-12">
            <div class="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <p class="mt-2 text-gray-600">Carregando...</p>
          </div>

          <!-- Error State -->
          <div *ngIf="error()" class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            <p><strong>Erro:</strong> {{ error() }}</p>
            <app-button (click)="loadMeter()" *ngIf="isEditMode()" variant="outline" class="mt-2">
              Tentar Novamente
            </app-button>
          </div>

          <!-- Form -->
          <form [formGroup]="meterForm" (ngSubmit)="onSubmit()" *ngIf="!isLoading() && !error()">
            <div class="space-y-4 sm:space-y-6">
              <!-- Tipo de Medição -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2" for="measurement_type_id">
                  Tipo de Medição *
                </label>
                <select
                  id="measurement_type_id"
                  formControlName="measurement_type_id"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione um tipo de medição</option>
                  <option *ngFor="let type of measurementTypes()" [value]="type.id">
                    {{ type.name }} ({{ type.unit }})
                  </option>
                </select>
                <p *ngIf="meterForm.get('measurement_type_id')?.invalid && meterForm.get('measurement_type_id')?.touched" 
                   class="text-red-500 text-xs mt-1">
                  Tipo de medição é obrigatório
                </p>
              </div>

              <!-- Número de Série -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2" for="serial_number">
                  Número de Série (Opcional)
                </label>
                <input
                  type="text"
                  id="serial_number"
                  formControlName="serial_number"
                  placeholder="Ex: ABC123456"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
              </div>

              <!-- Status Ativo -->
              <div class="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  formControlName="active"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                >
                <label for="active" class="ml-2 block text-sm text-gray-700">
                  Medidor ativo
                </label>
              </div>
            </div>

            <!-- Botões do formulário -->
            <div class="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-gray-200">
              <app-button 
                type="submit" 
                [disabled]="meterForm.invalid || isSaving()" 
                [loading]="isSaving()"
                class="w-full sm:w-auto order-2 sm:order-1">
                {{ isEditMode() ? 'Salvar Alterações' : 'Criar Medidor' }}
              </app-button>
              <app-button 
                type="button" 
                variant="outline" 
                (click)="goBack()"
                class="w-full sm:w-auto order-1 sm:order-2">
                Cancelar
              </app-button>
            </div>
          </form>
        </div>
      </app-card>
    </div>
  `,
  styles: [`
    /* Responsividade adicional */
    @media (max-width: 640px) {
      .container {
        @apply px-2;
      }
    }
  `]
})
export class MeterFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Signals para estado reativo
  isEditMode = signal(false);
  isLoading = signal(false);
  isSaving = signal(false);
  error = signal<string | null>(null);
  measurementTypes = signal<MeasurementType[]>([]);
  
  // Estado do componente
  meterForm: FormGroup;
  meterId: number | null = null;
  unitId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private meterService: MeterService,
    private notificationService: NotificationService
  ) {
    this.meterForm = this.createMeterForm();
  }

  ngOnInit(): void {
    this.loadMeasurementTypes();
    
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.unitId = Number(params['unitId']);
      
      if (params['id'] && params['id'] !== 'new') {
        this.isEditMode.set(true);
        this.meterId = Number(params['id']);
        this.loadMeter();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createMeterForm(): FormGroup {
    return this.fb.group({
      measurement_type_id: ['', [Validators.required]],
      serial_number: [''],
      active: [true]
    });
  }

  private loadMeasurementTypes(): void {
    // TODO: Implementar carregamento de tipos de medição
    // Por enquanto, usar dados mock
    this.measurementTypes.set([
      { id: 1, name: 'Água', unit: 'm³', active: true, created_at: '', updated_at: '' },
      { id: 2, name: 'Energia', unit: 'kWh', active: true, created_at: '', updated_at: '' },
      { id: 3, name: 'Gás', unit: 'm³', active: true, created_at: '', updated_at: '' }
    ]);
  }

  private loadMeter(): void {
    if (!this.meterId) return;
    
    this.isLoading.set(true);
    this.error.set(null);
    
    this.meterService.getById(this.meterId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          if (response.data) {
            const meter = response.data;
            this.meterForm.patchValue({
              measurement_type_id: meter.measurement_type_id,
              serial_number: meter.serial_number || '',
              active: meter.active
            });
            this.unitId = meter.unit_id;
          } else {
            this.error.set('Medidor não encontrado.');
          }
        },
        error: (error) => {
          console.error('Erro ao carregar medidor:', error);
          this.error.set('Erro ao carregar dados do medidor.');
          this.notificationService.showError('Erro ao carregar medidor');
        }
      });
  }

  onSubmit(): void {
    if (this.meterForm.invalid) {
      this.meterForm.markAllAsTouched();
      return;
    }

    const formData = this.meterForm.value;
    this.isSaving.set(true);

    if (this.isEditMode() && this.meterId) {
      // Modo de edição
      const updateData: MeterUpdate = formData;
      
      this.meterService.update(this.meterId, updateData)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isSaving.set(false))
        )
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Medidor atualizado com sucesso');
            this.goBack();
          },
          error: (error) => {
            console.error('Erro ao atualizar medidor:', error);
            this.notificationService.showError('Erro ao atualizar medidor');
          }
        });
    } else {
      // Modo de criação
      const createData: MeterCreate = {
        ...formData,
        unit_id: this.unitId!
      };
      
      this.meterService.create(createData)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isSaving.set(false))
        )
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Medidor criado com sucesso');
            this.goBack();
          },
          error: (error) => {
            console.error('Erro ao criar medidor:', error);
            this.notificationService.showError('Erro ao criar medidor');
          }
        });
    }
  }

  goBack(): void {
    if (this.unitId) {
      this.router.navigate(['/units', this.unitId, 'meters']);
    } else {
      this.router.navigate(['/units']);
    }
  }
}

