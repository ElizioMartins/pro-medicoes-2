import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';

// UI Components
import { CardComponent } from '../../shared/components/ui/card/card.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';

// Models
import { Reading } from '../../shared/models/reading.model';
import { Condominium } from '../../shared/models/condominium.model';
import { MeasurementType } from '../../shared/models/measurement-type.model';
import { Unit } from '../../shared/models/unit.model';

// Services  
import { ReadingService } from '../../core/services/reading.service';
import { CondominiumService } from '../../core/services/condominium.service';
import { MeasurementTypeService } from '../../core/services/measurementtype.service';
import { UnitService } from '../../core/services/Unit.service';
import { NotificationService } from '../../core/services/notification.service';

interface ReadingFilters {
  condominiumId?: number;
  unitId?: number;
  measurementTypeId?: number;
  meterId?: number;
  period?: string;
}

@Component({
  selector: 'app-readings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    ButtonComponent
  ],
  templateUrl: './readings.component.html',
  styleUrl: './readings.component.scss'
})
export class ReadingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Signals para estado reativo
  readings = signal<Reading[]>([]);
  condominiums = signal<Condominium[]>([]);
  units = signal<Unit[]>([]);
  filteredUnits = signal<Unit[]>([]);
  measurementTypes = signal<MeasurementType[]>([]);
  
  filters = signal<ReadingFilters>({
    period: 'all'
  });
  
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Injeção via inject()
  private route = inject(ActivatedRoute);
  private readingService = inject(ReadingService);
  private condominiumService = inject(CondominiumService);
  private unitService = inject(UnitService);
  private measurementTypeService = inject(MeasurementTypeService);
  private notificationService = inject(NotificationService);

  ngOnInit(): void {
    this.loadInitialData();
    this.handleRouteParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {
    this.isLoading.set(true);

    // Carregar condominiums
    this.condominiumService.getCondominiums()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.condominiums.set(response.condominiums || []);
        },
        error: (error) => {
          console.error('Erro ao carregar condomínios:', error);
        }
      });

    // Carregar tipos de medição
    this.measurementTypeService.getMeasurementTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types: MeasurementType[]) => {
          this.measurementTypes.set(types);
        },
        error: (error: unknown) => {
          console.error('Erro ao carregar tipos de medição:', error);
        }
      });

    this.loadReadings();
  }

  private handleRouteParams(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['meterId']) {
          const meterId = Number(params['meterId']);
          this.filters.update(f => ({ ...f, meterId }));
          this.loadReadings();
        }
      });
  }

  onCondominiumChange(condominiumId: number | null): void {
    this.filters.update(f => ({ 
      ...f, 
      condominiumId: condominiumId || undefined,
      unitId: undefined // Reset unit when condominium changes
    }));
    
    if (condominiumId) {
      this.loadUnitsForCondominium(condominiumId);
    } else {
      this.filteredUnits.set([]);
    }
    
    this.onFilterChange();
  }

  onUnitChange(unitId: number | null): void {
    this.filters.update(f => ({ ...f, unitId: unitId || undefined }));
    this.onFilterChange();
  }

  private loadUnitsForCondominium(condominiumId: number): void {
    this.unitService.getUnitsByCondominiumId(condominiumId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { units: Unit[] }) => {
          this.filteredUnits.set(response.units || []);
        },
        error: (error: unknown) => {
          console.error('Erro ao carregar unidades:', error);
        }
      });
  }

  onFilterChange(): void {
    // Debounce could be added here if needed
    this.loadReadings();
  }

  applyFilters(): void {
    this.loadReadings();
  }

  clearFilters(): void {
    this.filters.set({ period: 'all' });
    this.filteredUnits.set([]);
    this.loadReadings();
  }

  loadReadings(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const currentFilters = this.filters();
    const params: Parameters<typeof this.readingService.getReadingsFiltered>[0] = {};

    // Apenas adicionar parâmetros que realmente têm valores válidos
    if (currentFilters.meterId && currentFilters.meterId > 0) {
      params.meter_id = currentFilters.meterId;
    }
    if (currentFilters.condominiumId && currentFilters.condominiumId > 0) {
      params.condominium_id = currentFilters.condominiumId;
    }
    if (currentFilters.unitId && currentFilters.unitId > 0) {
      params.unit_id = currentFilters.unitId;
    }
    if (currentFilters.measurementTypeId && currentFilters.measurementTypeId > 0) {
      params.measurement_type_id = currentFilters.measurementTypeId;
    }

    console.log('[DEBUG] Filtros atuais:', currentFilters);
    console.log('[DEBUG] Parâmetros que serão enviados:', params);

    this.readingService.getReadingsFiltered(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (readings) => {
          console.log('[DEBUG] Leituras recebidas:', readings);
          let filteredReadings = readings;

          // Apply period filter on frontend
          if (currentFilters.period && currentFilters.period !== 'all') {
            const days = parseInt(currentFilters.period, 10);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            filteredReadings = readings.filter(reading => 
              new Date(reading.date) >= cutoffDate
            );
          }

          this.readings.set(filteredReadings);
        },
        error: (error) => {
          console.error('Erro ao carregar leituras:', error);
          this.error.set('Erro ao carregar leituras. Tente novamente.');
          this.notificationService.showError('Erro ao carregar leituras');
        }
      });
  }

  // Helper methods
  trackByReadingId(index: number, reading: Reading): number {
    return reading.id;
  }

  getCondominiumName(reading: Reading): string {
    return reading.meter?.unit?.condominium?.name || 'N/A';
  }

  getUnitNumber(reading: Reading): string {
    return reading.meter?.unit?.number || 'N/A';
  }

  getMeasurementTypeName(reading: Reading): string {
    return reading.meter?.measurement_type?.name || 'N/A';
  }

  getReadingValue(reading: Reading): string {
    if (reading.status === 'INACCESSIBLE') {
      return reading.inaccessible_reason || 'Inacessível';
    }
    const unit = reading.meter?.measurement_type?.unit || '';
    return `${reading.current_reading} ${unit}`;
  }

  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'PENDING': 'Pendente',
      'COMPLETED': 'Concluída',
      'INACCESSIBLE': 'Inacessível'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classMap: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'INACCESSIBLE': 'bg-red-100 text-red-800'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
  }
}