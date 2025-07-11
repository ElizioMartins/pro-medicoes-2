import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { UnitCreate } from "@shared/models/unit.model";
import { UnitService } from '@core/services/Unit.service';
import { ToastService } from '@core/services/toast.service';
import { Meter } from "@shared/models/meter.model";
import { MeasurementTypeService, MeasurementType } from '@core/services/measurement-type.service';

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
  templateUrl: './unit-form.component.html',
  styleUrls: ['./unit-form.component.scss']
})
export class UnitFormComponent implements OnInit {
  unitForm: FormGroup;
  isSubmitting = false;
  isEditing = false;
  condominiumId = 0;
  unitId?: number;
  measurementTypes: MeasurementType[] = [];

  get meters(): FormArray {
    return this.unitForm.get('meters') as FormArray;
  }

  get isFormValid(): boolean {
    const metersCount = this.unitForm.get('metersCount')?.value || 0;
    const metersMatch = this.meters.length === metersCount;
    
    // Se não há medidores configurados, apenas validar o form principal
    if (metersCount === 0) {
      return this.unitForm.valid && metersMatch;
    }
    
    // Se há medidores configurados, validar se todos os medidores estão válidos
    const allMetersValid = this.meters.controls.every(meter => meter.valid);
    
    return this.unitForm.valid && metersMatch && allMetersValid;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly unitService: UnitService,
    private readonly toastService: ToastService,
    private readonly measurementTypeService: MeasurementTypeService
  ) {
    this.unitForm = this.fb.group({
      number: ['', Validators.required],
      owner: ['', Validators.required],
      metersCount: [0, [Validators.required, Validators.min(0)]],
      observations: [''],
      active: [true],
      meters: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadMeasurementTypes();
    this.route.params.subscribe(params => {
      this.condominiumId = Number(params['condominiumId']);
      this.unitId = params['id'] ? Number(params['id']) : undefined;
      this.isEditing = !!this.unitId;

      if (this.isEditing && this.unitId) {
        this.loadUnit(this.unitId);
      }
    });

    // Monitorar mudanças no número de medidores
    this.unitForm.get('metersCount')?.valueChanges.subscribe(count => {
      this.adjustMetersArray(count);
    });
  }

  loadMeasurementTypes(): void {
    this.measurementTypeService.getMeasurementTypes().subscribe({
      next: types => this.measurementTypes = types,
      error: err => {
        console.error('Erro ao carregar tipos de medição:', err);
        this.toastService.show({
          title: 'Erro ao carregar tipos de medição',
          variant: 'destructive'
        });
      }
    });
  }

  loadUnit(id: number): void {
    this.unitService.getUnitById(id).subscribe({
      next: (unit) => {
        this.unitForm.patchValue({
          number: unit.number,
          owner: unit.owner,
          observations: unit.observations,
          active: unit.active
        });
        this.meters.clear();
        if (unit.meters && unit.meters.length > 0) {
          unit.meters.forEach(meter => this.meters.push(this.createMeterGroup(meter as Partial<Meter>)));
        }
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

  createMeterGroup(meter?: Partial<Meter>): FormGroup {
    const group = this.fb.group({
      measurementTypeId: [meter?.measurement_type_id ?? '', Validators.required],
      serialNumber: [meter?.serial_number ?? ''] // Número de série opcional
    });
    
    return group;
  }

  adjustMetersArray(count: number): void {
    const currentCount = this.meters.length;
    
    if (count > currentCount) {
      // Adicionar medidores
      for (let i = currentCount; i < count; i++) {
        this.meters.push(this.createMeterGroup());
      }
    } else if (count < currentCount) {
      // Remover medidores
      for (let i = currentCount - 1; i >= count; i--) {
        this.meters.removeAt(i);
      }
    }
  }

  // Override do método addMeter para considerar o limite
  addMeter(): void {
    const metersCount = this.unitForm.get('metersCount')?.value || 0;
    if (this.meters.length < metersCount) {
      this.meters.push(this.createMeterGroup());
    } else {
      this.toastService.show({
        title: 'Limite de medidores atingido',
        variant: 'destructive'
      });
    }
  }

  // Override do método removeMeter para considerar o limite
  removeMeter(index: number): void {
    this.meters.removeAt(index);
    // Atualizar o contador se necessário
    const currentCount = this.unitForm.get('metersCount')?.value || 0;
    if (this.meters.length < currentCount) {
      this.unitForm.patchValue({ metersCount: this.meters.length });
    }
  }

  onSubmit(): void {
    // Validar se o número de medidores corresponde ao especificado
    const metersCount = this.unitForm.get('metersCount')?.value || 0;
    if (this.meters.length !== metersCount) {
      this.toastService.show({
        title: 'Número de medidores não confere',
        variant: 'destructive'
      });
      return;
    }

    if (this.unitForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const formValue = this.unitForm.value;
      
      const unitData: UnitCreate = {
        number: formValue.number,
        owner: formValue.owner,
        observations: formValue.observations,
        active: formValue.active
      };
      
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
