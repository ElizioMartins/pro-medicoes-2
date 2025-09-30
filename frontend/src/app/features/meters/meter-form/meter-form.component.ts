import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';

// UI Components
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';

// Models
import { Meter } from "@shared/models/meter.model";
import { MeasurementType } from "@shared/models/measurement-type.model";

// Services
import { MeterService } from '@core/services/meter.service';
import { ToastService } from '@core/services/toast.service';
import { MeasurementTypeService } from '@core/services/measurementtype.service';
import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-meter-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    ButtonComponent
  ],
  templateUrl: './meter-form.component.html',
  styleUrl: './meter-form.component.scss'
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

  // Use inject() for dependency injection
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private meterService = inject(MeterService);
  private toastService = inject(ToastService);
  private measurementTypeService = inject(MeasurementTypeService);

  constructor() {
    this.meterForm = this.createMeterForm();
  }

  ngOnInit(): void {
    this.loadMeasurementTypes();
    
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      // Pode vir de query params para criar novo medidor
      this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(queryParams => {
        if (queryParams['unitId']) {
          this.unitId = Number(queryParams['unitId']);
        }
      });
      
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

  onActiveChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const control = this.meterForm.get('active');
    if (control) {
      control.setValue(input.checked);
    }
  }

  private createMeterForm(): FormGroup {
    return this.fb.group({
      measurement_type_id: ['', [Validators.required]],
      serial_number: [''],
      active: [true]
    });
  }

  private loadMeasurementTypes(): void {
    this.isLoading.set(true);
    this.measurementTypes.set([]);
    this.error.set(null);
    this.measurementTypeService.getMeasurementTypes()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (types: MeasurementType[]) => {
          this.measurementTypes.set(types);
        },
        error: (error: unknown) => {
          console.error('Erro ao carregar tipos de medição:', error);
          this.error.set('Erro ao carregar tipos de medição.');
          this.toastService.showError('Erro ao carregar tipos de medição');
        }
      });
  }

  loadMeter(): void {
    if (!this.meterId) return;
    this.isLoading.set(true);
    this.error.set(null);
    this.meterService.getMeterById(this.meterId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (meter: Meter) => {
          if (meter) {
            console.log('Valor recebido de meter.active:', meter);
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
        error: (error: unknown) => {
          console.error('Erro ao carregar medidor:', error);
          this.error.set('Erro ao carregar dados do medidor.');
          this.toastService.showError('Erro ao carregar medidor');
        }
      });
  }

  onSubmit(): void {
    if (this.meterForm.invalid) {
      this.meterForm.markAllAsTouched();
      return;
    }

    // Garante que o valor de 'active' seja booleano
    const formData = {
      ...this.meterForm.value,
      active: !!this.meterForm.get('active')?.value
    };
    this.isSaving.set(true);

    if (this.isEditMode() && this.meterId) {
      // Modo de edição
      const updateData: Meter = formData;
      
      this.meterService.updateMeter(this.meterId, updateData)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isSaving.set(false))
        )
        .subscribe({
          next: () => {
            this.toastService.showSuccess('Medidor atualizado com sucesso');
            this.goBack();
          },
          error: (error) => {
            console.error('Erro ao atualizar medidor:', error);
            this.toastService.showError('Erro ao atualizar medidor');
          }
        });
    } else {
      // Modo de criação
      const createData: Meter = {
        ...formData,
        unit_id: this.unitId!
      };
      
      this.meterService.createMeter(createData)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isSaving.set(false))
        )
        .subscribe({
          next: () => {
            this.toastService.showSuccess('Medidor criado com sucesso');
            this.goBack();
          },
          error: (error) => {
            console.error('Erro ao criar medidor:', error);
            this.toastService.showError('Erro ao criar medidor');
          }
        });
    }
  }

  goBack(): void {
    if (this.unitId) {
      this.router.navigate(['/units', this.unitId, 'meters']);
    } else {
      this.router.navigate(['/meters']);
    }
  }
}
