import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InputComponent } from '@shared/components/ui/input/input.component';

import { Meter } from '@core/models/Meter';
import { MeterService } from '@core/services/Meter.service';
import { MeasurementTypeService } from '@core/services/MeasurementType.service';
import { MeasurementType } from '@core/models/MeasurementType';
import { ToastService } from '@core/services/toast.service';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

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
    <div class="container mx-auto p-4">
      <app-card>
        <div class="p-6">
          <h1 class="text-2xl font-bold text-gray-800 mb-6">{{ isEditMode ? 'Editar' : 'Novo' }} Medidor</h1>
          
          <!-- Loading State -->
          <div *ngIf="isLoading" class="text-center py-12">
            <div class="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <p class="mt-2 text-gray-600">Carregando...</p>
          </div>

          <!-- Error State -->
          <div *ngIf="error" class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            <p><strong>Erro:</strong> {{ error }}</p>
            <app-button (click)="loadMeter()" *ngIf="isEditMode" variant="outline" class="mt-2">Tentar Novamente</app-button>
          </div>

          <!-- Form -->
          <form [formGroup]="meterForm" (ngSubmit)="onSubmit()" *ngIf="!isLoading && !error">
            <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="measurementType">
                Tipo de Medição*
              </label>
              <select
                id="measurementType"
                formControlName="measurementTypeId"
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Selecione um tipo de medição</option>
                <option *ngFor="let type of measurementTypes" [value]="type.id">
                  {{ type.name }} ({{ type.unit }})
                </option>
              </select>
              <p *ngIf="meterForm.get('measurementTypeId')?.invalid && meterForm.get('measurementTypeId')?.touched" class="text-red-500 text-xs italic">
                Tipo de medição é obrigatório
              </p>
            </div>

            <div class="mb-4">
              <app-input
                label="Número de Série"
                formControlName="serialNumber"
                [error]="true"
                [errorMessage]="meterForm.get('serialNumber')?.hasError('required') ? 'Número de série é obrigatório' : ''"
              ></app-input>
            </div>

            <!-- Add additional fields as needed -->

            <div class="flex justify-end space-x-2 mt-6">
              <app-button type="button" variant="outline" (click)="goBack()">
                Cancelar
              </app-button>
              <app-button type="submit" variant="primary" [disabled]="meterForm.invalid || isSaving" [loading]="isSaving">
                {{ isEditMode ? 'Salvar Alterações' : 'Criar Medidor' }}
              </app-button>
            </div>
          </form>
        </div>
      </app-card>
    </div>
  `,
  styles: [`
    /* Additional component styles if needed */
  `]
})
export class MeterFormComponent implements OnInit {
  meterForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  error: string | null = null;
  meterId: number | null = null;
  unitId: number | null = null;
  measurementTypes: MeasurementType[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private meterService: MeterService,
    private measurementTypeService: MeasurementTypeService,
    private toastService: ToastService
  ) {
    this.meterForm = this.fb.group({
      measurementTypeId: ['', Validators.required],
      serialNumber: ['', Validators.required]
      // Adicione outros campos conforme necessário
    });
  }

  ngOnInit(): void {
    // Carregar tipos de medição
    this.loadMeasurementTypes();
    
    // Obter parâmetros de rota
    this.route.params.subscribe(params => {
      this.unitId = params['unitId'];
      
      if (params['id'] && params['id'] !== 'new') {
        this.isEditMode = true;
        this.meterId = params['id'];
        this.loadMeter();
      } else {
        // No modo de criação, o unitId já foi configurado acima
        // e apenas inicializamos o formulário vazio
      }
    });
  }

  loadMeasurementTypes(): void {
    this.measurementTypeService.getMeasurementTypes().subscribe({
      next: types => {
        this.measurementTypes = types;
      },
      error: err => {
        console.error('Erro ao carregar tipos de medição:', err);
        this.error = 'Erro ao carregar tipos de medição.';
      }
    });
  }

  loadMeter(): void {
    if (!this.meterId) return;
    
    this.isLoading = true;
    this.error = null;
    
    this.meterService.getMeterById(this.meterId).subscribe({
      next: meter => {
        if (meter) {
          this.meterForm.patchValue({
            measurementTypeId: meter.measurementTypeId,
            serialNumber: meter.serialNumber || ''
          });
          this.unitId = meter.unitId;
          this.isLoading = false;
        } else {
          this.error = 'Medidor não encontrado.';
          this.isLoading = false;
        }
      },
      error: err => {
        console.error('Erro ao carregar medidor:', err);
        this.error = 'Erro ao carregar dados do medidor.';
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.meterForm.invalid) {
      this.meterForm.markAllAsTouched();
      return;
    }

    const formData = this.meterForm.value;
    const meterData: Meter = {
      ...formData,
      unitId: this.unitId // Associa o medidor à unidade atual
    };

    this.isSaving = true;

    if (this.isEditMode && this.meterId) {
      // Modo de edição - atualiza um medidor existente
      this.meterService.updateMeter(this.meterId, meterData)
        .pipe(
          catchError(err => {
            console.error('Erro ao atualizar medidor:', err);
            this.toastService.show({
              title: 'Erro',
              description: 'Não foi possível atualizar o medidor.',
              variant: 'destructive'
            });
            return of(null);
          }),
          finalize(() => this.isSaving = false)
        )
        .subscribe(result => {
          if (result) {
            this.toastService.show({
              title: 'Sucesso',
              description: 'Medidor atualizado com sucesso.',
              variant: 'default'
            });
            this.goBack();
          }
        });
    } else {
      // Modo de criação - cria um novo medidor
      this.meterService.createMeter(meterData)
        .pipe(
          catchError(err => {
            console.error('Erro ao criar medidor:', err);
            this.toastService.show({
              title: 'Erro',
              description: 'Não foi possível criar o medidor.',
              variant: 'destructive'
            });
            return of(null);
          }),
          finalize(() => this.isSaving = false)
        )
        .subscribe(result => {
          if (result) {
            this.toastService.show({
              title: 'Sucesso',
              description: 'Medidor criado com sucesso.',
              variant: 'default'
            });
            this.goBack();
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
