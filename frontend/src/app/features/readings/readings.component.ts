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
import { Meter } from '../../shared/models/meter.model';

// Services  
import { ReadingService } from '../../core/services/reading.service';
import { CondominiumService } from '../../core/services/condominium.service';
import { MeasurementTypeService } from '../../core/services/measurementtype.service';
import { UnitService } from '../../core/services/Unit.service';
import { MeterService } from '../../core/services/meter.service';
import { NotificationService } from '../../core/services/notification.service';

interface ReadingFilters {
  condominiumId?: number;
  unitId?: number;
  measurementTypeId?: number;
  meterId?: number;
  referenceMonth?: string; // Formato YYYY-MM
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
  private meterService = inject(MeterService);
  private notificationService = inject(NotificationService);

  ngOnInit(): void {
    this.handleRouteParams(); // Processar primeiro os route params
    this.loadInitialData();
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

    // Só carregar leituras se não tiver meterId nos params (será carregado pelo contexto)
    if (!this.filters().meterId) {
      this.loadReadings();
    }
  }

  private handleRouteParams(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        console.log('[DEBUG] Query params recebidos:', params);

        // Se temos um contexto completo nos params, usar diretamente
        if (params['meterId'] && params['unitId'] && params['condominiumId']) {
          const filters: ReadingFilters = {
            meterId: Number(params['meterId']),
            unitId: Number(params['unitId']),
            condominiumId: Number(params['condominiumId']),
            measurementTypeId: params['measurementTypeId'] ? Number(params['measurementTypeId']) : undefined,
            period: 'all'
          };

          console.log('[DEBUG] Usando contexto completo dos params:', filters);
          
          this.filters.set(filters);
          
          // Carregar unidades do condomínio para o filtro
          if (filters.condominiumId) {
            this.loadUnitsForCondominium(filters.condominiumId);
          }
          
          // Carregar leituras com contexto completo
          this.loadReadings();

        } else if (params['meterId']) {
          // Fallback: buscar contexto do medidor (método anterior)
          const meterId = Number(params['meterId']);
          this.filters.update(f => ({ ...f, meterId }));
          this.loadMeterContext(meterId);
        }
      });
  }

  private loadMeterContext(meterId: number): void {
    this.meterService.getMeterById(meterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (meter: Meter) => {
          if (meter && meter.unit_id) {
            // Buscar informações da unidade para obter o condomínio
            this.unitService.getUnitById(meter.unit_id)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (unit) => {
                  if (unit && unit.condominium_id) {
                    console.log('[DEBUG] Contexto do medidor:', {
                      meterId,
                      unitId: unit.id,
                      condominiumId: unit.condominium_id,
                      measurementTypeId: meter.measurement_type_id
                    });

                    // Pré-preencher filtros com contexto
                    this.filters.update(f => ({
                      ...f,
                      condominiumId: unit.condominium_id,
                      unitId: unit.id,
                      // measurementTypeId deixar como undefined para mostrar "Todos"
                      meterId
                    }));

                    // Carregar unidades do condomínio para o filtro
                    this.loadUnitsForCondominium(unit.condominium_id);
                    
                    // Recarregar leituras com novo contexto
                    this.loadReadings();
                  }
                },
                error: (error) => {
                  console.error('Erro ao carregar unidade do medidor:', error);
                  // Mesmo com erro, carregar as leituras com o meterId
                  this.loadReadings();
                }
              });
          } else {
            // Se não conseguir buscar contexto, carregar apenas com meterId
            this.loadReadings();
          }
        },
        error: (error) => {
          console.error('Erro ao carregar medidor:', error);
          // Mesmo com erro, carregar as leituras com o meterId
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
    
    // Removido: this.onFilterChange() - agora só filtra ao clicar em aplicar
  }

  onUnitChange(unitId: number | null): void {
    this.filters.update(f => ({ ...f, unitId: unitId || undefined }));
    // Removido: this.onFilterChange() - agora só filtra ao clicar em aplicar
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
    // Método mantido para compatibilidade, mas não faz nada
    // Os filtros só são aplicados quando clicar no botão "Aplicar"
  }

  applyFilters(): void {
    console.log('[DEBUG] === APLICANDO FILTROS ===');
    console.log('[DEBUG] Estado atual dos filtros:', this.filters());
    console.log('[DEBUG] selectedCondominiumId:', this.selectedCondominiumId);
    console.log('[DEBUG] selectedUnitId:', this.selectedUnitId);
    console.log('[DEBUG] selectedMeasurementTypeId:', this.selectedMeasurementTypeId);
    console.log('[DEBUG] selectedReferenceMonth:', this.selectedReferenceMonth);
    console.log('[DEBUG] selectedPeriod:', this.selectedPeriod);
    
    // Atualizar filtros com valores selecionados
    this.filters.update(f => ({
      ...f,
      condominiumId: this.selectedCondominiumId || undefined,
      unitId: this.selectedUnitId || undefined,
      measurementTypeId: this.selectedMeasurementTypeId || undefined,
      referenceMonth: this.selectedReferenceMonth || undefined,
      meterId: undefined, // Limpar meterId quando aplicando filtros manualmente
      period: this.selectedPeriod
    }));
    
    this.loadReadings();
  }

  clearFilters(): void {
    this.filters.set({ period: 'all', referenceMonth: undefined });
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
    if (currentFilters.referenceMonth && currentFilters.referenceMonth.trim()) {
      params.reference_month = currentFilters.referenceMonth;
    }

    console.log('[DEBUG] Filtros atuais:', currentFilters);
    console.log('[DEBUG] Parâmetros que serão enviados:', params);

    this.readingService.getReadingsFiltered(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (readings: Reading[]) => {
          console.log('[DEBUG] Leituras recebidas:', readings);
          let filteredReadings = readings;

          // Apply period filter on frontend
          if (currentFilters.period && currentFilters.period !== 'all') {
            const days = parseInt(currentFilters.period, 10);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            filteredReadings = readings.filter((reading: Reading) => 
              new Date(reading.date) >= cutoffDate
            );
          }

          this.readings.set(filteredReadings);
        },
        error: (error: unknown) => {
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

  formatReferenceMonth(referenceMonth: string): string {
    if (!referenceMonth) return 'N/A';
    
    try {
      // Formato esperado: YYYY-MM
      const [year, month] = referenceMonth.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      
      // Formatação em português
      return date.toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: 'long' 
      });
    } catch {
      return referenceMonth; // Retorna o valor original se houver erro
    }
  }

  // Getters para os filtros (necessário para ngModel funcionar corretamente com signals)
  get selectedCondominiumId(): number | null {
    return this.filters().condominiumId || null;
  }

  set selectedCondominiumId(value: number | null) {
    this.onCondominiumChange(value);
  }

  get selectedUnitId(): number | null {
    return this.filters().unitId || null;
  }

  set selectedUnitId(value: number | null) {
    this.onUnitChange(value);
  }

  get selectedMeasurementTypeId(): number | null {
    return this.filters().measurementTypeId || null;
  }

  set selectedMeasurementTypeId(value: number | null) {
    this.filters.update(f => ({ ...f, measurementTypeId: value || undefined }));
    // Removido: this.onFilterChange() - agora só filtra ao clicar em aplicar
  }

  get selectedPeriod(): string {
    return this.filters().period || 'all';
  }

  set selectedPeriod(value: string) {
    this.filters.update(f => ({ ...f, period: value }));
    // Não chama onFilterChange() - só filtra ao clicar em aplicar
  }

  get selectedReferenceMonth(): string | null {
    return this.filters().referenceMonth || null;
  }

  set selectedReferenceMonth(value: string | null) {
    this.filters.update(f => ({ ...f, referenceMonth: value || undefined }));
    // Não chama onFilterChange() - só filtra ao clicar em aplicar
  }
}