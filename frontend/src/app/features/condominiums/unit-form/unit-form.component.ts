import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { finalize } from 'rxjs';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { Unit } from "@shared/models/unit.model";
import { UnitService } from '@core/services/Unit.service';
import { Meter } from "@shared/models/meter.model";
import { MeterService } from '@core/services/meter.service';
import { ToastService } from '@app/core/services/toast.service';
import { MeasurementType } from '@app/shared/models/measurement-type.model';
import { MeasurementTypeService } from '@app/core/services/measurementtype.service';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

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
  unit?: Unit;

  get meters(): FormArray {
    return this.unitForm.get('meters') as FormArray;
  }

  get isFormValid(): boolean {
    // Validar campos básicos da unidade
    const basicFormValid = !!(this.unitForm.get('number')?.valid && 
                             this.unitForm.get('owner')?.valid && 
                             this.unitForm.get('metersCount')?.valid);
    
    const metersCount = this.unitForm.get('metersCount')?.value || 0;
    const metersMatch = this.meters.length === metersCount;
    
    // Se não há medidores configurados, apenas validar o form básico
    if (metersCount === 0) {
      return basicFormValid && metersMatch;
    }
    
    // Se há medidores configurados, validar apenas se o measurementTypeId está preenchido
    const allMetersValid = this.meters.controls.every(meter => {
      const measurementTypeId = meter.get('measurementTypeId')?.value;
      return measurementTypeId;
    });
    
    // console.log('Form validation debug:', {
    //   basicFormValid,
    //   metersCount,
    //   metersLength: this.meters.length,
    //   metersMatch,
    //   allMetersValid,
    //   isValid: basicFormValid && metersMatch && allMetersValid,
    //   formValue: this.unitForm.value
    // });
    
    return basicFormValid && metersMatch && allMetersValid;
  }

  fb = inject(FormBuilder);
  route = inject(ActivatedRoute);
  router = inject(Router);
  unitService = inject(UnitService);
  measurementTypeService = inject(MeasurementTypeService);
  meterService = inject(MeterService);
  toastService = inject(ToastService);

  constructor() {
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
        this.unit = unit;
        this.unitForm.patchValue({
          number: unit.number,
          owner: unit.owner,
          observations: unit.observations,
          active: unit.active
        });
        this.unitForm.patchValue({ metersCount: unit.meters_count || 0 });
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
    return this.fb.group({
      id: [meter?.id ?? null],
      measurementTypeId: [meter?.measurement_type_id ?? ''],
      serialNumber: [meter?.serial_number ?? '']
    });
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

  // Override do método removeMeter para considerar o limite e remover do backend
  removeMeter(index: number): void {
    const meterGroup = this.meters.at(index);
    const meterId = meterGroup.get('id')?.value;
    if (meterId) {
      // Se o medidor já existe, remover do backend
      this.meterService.deleteMeter(meterId).subscribe({
        next: () => {
          this.meters.removeAt(index);
          this.toastService.show({
            title: 'Medidor removido com sucesso',
            variant: 'default'
          });
          // Atualizar o contador se necessário
          const currentCount = this.unitForm.get('metersCount')?.value || 0;
          if (this.meters.length < currentCount) {
            this.unitForm.patchValue({ metersCount: this.meters.length });
          }
        },
        error: (error) => {
          console.error('Erro ao remover medidor:', error);
          this.toastService.show({
            title: 'Erro ao remover medidor',
            variant: 'destructive'
          });
        }
      });
    } else {
      // Se o medidor não existe no backend, apenas remove do array
      this.meters.removeAt(index);
      const currentCount = this.unitForm.get('metersCount')?.value || 0;
      if (this.meters.length < currentCount) {
        this.unitForm.patchValue({ metersCount: this.meters.length });
      }
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

    // Validar se todos os medidores têm tipo de medição selecionado
    const allMetersValid = this.meters.controls.every(meter => {
      const measurementTypeId = meter.get('measurementTypeId')?.value;
      return measurementTypeId && measurementTypeId.trim() !== '';
    });

    if (!allMetersValid) {
      this.toastService.show({
        title: 'Selecione o tipo de medição para todos os medidores',
        variant: 'destructive'
      });
      return;
    }

    if (this.isFormValid && !this.isSubmitting) {
      this.isSubmitting = true;
      const formValue = this.unitForm.value;

      // Monta os dados dos medidores para envio usando MeterCreate
      const meters = (formValue.meters || []).map((meter: { measurementTypeId: number; serialNumber: string }) => ({
        measurement_type_id: Number(meter.measurementTypeId),
        serial_number: meter.serialNumber
      }));

      // Inclui os medidores no payload da unidade usando UnitUpdate (ou UnitCreate se preferir)
      const unitData = {
        condominium_id: this.condominiumId,
        number: formValue.number,
        owner: formValue.owner,
        meters_count: formValue.metersCount,
        observations: formValue.observations,
        active: formValue.active,
       // meters: meters,
       // id: 0,
       // created_at: '',
       // updated_at: '',
      //  last_reading: ''
      };

      const operation = this.isEditing
        ? this.unitService.updateUnit(this.condominiumId, this.unitId!, unitData)
        : this.unitService.createUnit(this.condominiumId, unitData);

      operation
        .pipe(finalize(() => this.isSubmitting = false))
        .subscribe({
          next: (unit) => {
            // Após criar/editar a unidade, salva os medidores
            const unitId = this.isEditing ? this.unitId! : unit.id;
            const meterRequests = meters.map((meter: { measurement_type_id: number; serial_number: string; }) =>
              this.meterService.createMeter({
                unit_id: unitId,
                measurement_type_id: meter.measurement_type_id,
                serial_number: meter.serial_number
              }).toPromise()
            );
            Promise.all(meterRequests)
              .then(() => {
                this.toastService.show({
                  title: `Unidade ${this.isEditing ? 'atualizada' : 'criada'} com sucesso!`,
                  variant: 'default'
                });
                this.router.navigate(['/condominiums', this.condominiumId]);
              })
              .catch(error => {
                console.error('Erro ao salvar medidores:', error);
                this.toastService.show({
                  title: 'Erro ao salvar medidores',
                  variant: 'destructive'
                });
              });
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
