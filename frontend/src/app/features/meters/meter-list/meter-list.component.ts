import { CommonModule } from '@angular/common';
import { Subject, takeUntil, finalize } from 'rxjs';

// UI Components
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';

// Models
import { Meter } from "@shared/models/meter.model";
import { Unit } from "@shared/models/unit.model";
import { MeasurementType } from "@shared/models/measurement-type.model";

// Services
import { MeterService } from '@core/services/meter.service';
import { ToastService } from '@core/services/toast.service';
import { UnitService } from '@core/services/Unit.service';
import { MeasurementTypeService } from '@core/services/measurementtype.service';
import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { RouterLink, ActivatedRoute, Router, Params } from '@angular/router';

@Component({
  selector: 'app-meter-list',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonComponent,
    RouterLink
  ],
  templateUrl: './meter-list.component.html',
  styleUrl: './meter-list.component.scss'
})
export class MeterListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Signals para estado reativo
  unit = signal<Unit | null>(null);
  meters = signal<Meter[]>([]);
  measurementTypes = signal<MeasurementType[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  unitId = signal<number | null>(null);

  // Injeção via inject()
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private meterService = inject(MeterService);
  private toastService = inject(ToastService);
  private unitService = inject(UnitService);
  private measurementTypeService = inject(MeasurementTypeService);

  ngOnInit(): void {
    this.loadMeasurementTypes();
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params: Params) => {
      const unitId = params['unitId'];
      if (!unitId) {
        this.error.set('ID da unidade não fornecido.');
        return;
      }
      this.unitId.set(Number(unitId));
      this.loadMeters();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMeasurementTypes(): void {
    this.measurementTypeService.getMeasurementTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.measurementTypes.set(types);
        },
        error: (error) => {
          console.error('Erro ao carregar tipos de medição:', error);
        }
      });
  }

  loadMeters(): void {
    const currentUnitId = this.unitId();
    if (!currentUnitId) {
      this.error.set('ID da unidade não fornecido');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.unitService.getUnitById(currentUnitId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (unit) => {
          this.unit.set(unit);
          this.meters.set(unit.meters || []);
        },
        error: (error) => {
          console.error('Erro ao carregar unidade:', error);
          this.error.set('Erro ao carregar dados da unidade.');
          this.toastService.showError('Erro ao carregar unidade');
        }
      });
  }

  confirmDeleteMeter(meter: Meter): void {
    if (confirm(`Tem certeza que deseja excluir o medidor ${this.getMeasurementTypeName(meter.measurement_type_id)}?`)) {
      this.deleteMeter(meter.id);
    }
  }

  deleteMeter(id: number): void {
    this.meterService.deleteMeter(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.meters.update(meters => meters.filter(m => m.id !== id));
          this.toastService.showSuccess('Medidor excluído com sucesso');
        },
        error: (error) => {
          console.error('Erro ao excluir medidor:', error);
          this.toastService.showError('Erro ao excluir medidor');
        }
      });
  }

  trackByMeterId(index: number, meter: Meter): number {
    return meter.id;
  }

  getMeasurementTypeName(typeId: number): string {
    const measurementType = this.measurementTypes().find(type => type.id === typeId);
    return measurementType?.name || `Tipo ${typeId}`;
  }

  // Navegação explícita com contexto completo
  goToReadings(meterId: number): void {
    const meter = this.meters().find(m => m.id === meterId);
    const unit = this.unit();
    
    if (!meter || !unit) {
      console.warn('[DEBUG] Dados incompletos para navegação:', { meter, unit });
      // Fallback para navegação básica
      this.router.navigate(['/readings'], { queryParams: { meterId } });
      return;
    }

    const queryParams = {
      meterId: meterId,
      unitId: unit.id,
      condominiumId: unit.condominium_id,
      measurementTypeId: meter.measurement_type_id
    };

    console.log('[DEBUG] Navegando para leituras com contexto completo:', queryParams);
    this.router.navigate(['/readings'], { queryParams });
  }

  // Navegar para adicionar nova leitura com contexto completo
  addReading(meter: Meter): void {
    const unit = this.unit();
    
    if (!unit) {
      console.warn('[DEBUG] Unidade não encontrada para adicionar leitura');
      // Fallback para navegação básica apenas com medidor
      this.router.navigate(['/readings/new'], { queryParams: { meterId: meter.id } });
      return;
    }

    const queryParams = {
      meterId: meter.id,
      unitId: unit.id,
      condominiumId: unit.condominium_id,
      measurementTypeId: meter.measurement_type_id
    };

    console.log('[DEBUG] Navegando para nova leitura com contexto completo:', queryParams);
    this.router.navigate(['/readings/new'], { queryParams });
  }
}
