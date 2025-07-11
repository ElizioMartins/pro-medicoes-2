import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { Unit } from "@shared/models/unit.model";
import { UnitService } from '@core/services/Unit.service';
import { ToastService } from '@core/services/toast.service';
import { Meter } from "@shared/models/meter.model";
import { MeasurementTypeService } from '@core/services/measurementtype.service';
import { MeasurementType } from "@shared/models/measurement-type.model";
import { NotificationService } from '@core/services/notification.service';

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
  condominiumId: number = 0;
  unitId?: number;
  measurementTypes: MeasurementType[] = [];

  get meters(): FormArray {
    return this.unitForm.get('meters') as FormArray;
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
      identifier: ['', Validators.required],
      owner: ['', Validators.required],
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
    this.unitService.getUnitById(this.condominiumId, id).subscribe({
      next: (unit) => {
        this.unitForm.patchValue({
          identifier: unit.identifier,
          owner: unit.owner
        });
        this.meters.clear();
        if (unit.meters && unit.meters.length > 0) {
          unit.meters.forEach(meter => this.meters.push(this.createMeterGroup(meter)));
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
      measurementTypeId: [meter?.measurement_type_id ?? '', Validators.required],
      serialNumber: [meter?.serial_number ?? '', Validators.required]
    });
  }

  addMeter(): void {
    this.meters.push(this.createMeterGroup());
  }

  removeMeter(index: number): void {
    this.meters.removeAt(index);
  }

  onSubmit(): void {
    if (this.unitForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const unitData: Partial<Unit> = {
        identifier: this.unitForm.value.identifier,
        owner: this.unitForm.value.owner,
        meters: this.unitForm.value.meters
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
