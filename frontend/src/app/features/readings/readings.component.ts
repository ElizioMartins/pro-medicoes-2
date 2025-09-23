import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { tap, catchError, throwError } from 'rxjs';

// Import Services
import { ReadingService } from "@core/services/reading.service";
import { MeasurementTypeService } from '@core/services/measurementtype.service';
import { CondominiumService } from "@core/services/condominium.service";
import { MeterService } from '@core/services/meter.service';

// Import Models
import { Reading } from "@shared/models/reading.model";
import { MeasurementType } from "@shared/models/measurement-type.model";
import { Condominium } from "@shared/models/condominium.model";
import { Meter } from "@shared/models/meter.model";
import { PaginatedResponse } from "@shared/models/api-response.model";

@Component({
  selector: 'app-readings',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonComponent,
    RouterLink,
    FormsModule
  ],
  templateUrl: './readings.component.html',
  styleUrls: ['./readings.component.scss']
})
export class ReadingsComponent implements OnInit {
  allReadings: Reading[] = [];
  filteredReadings: Reading[] = [];
  paginatedReadings: Reading[] = [];

  condominiums: Condominium[] = [];
  measurementTypes: MeasurementType[] = [];

  isLoading = true;
  error: string | null = null;
  // Filter selections
  selectedCondominiumId: number | null = null;
  selectedMeasurementTypeId: number | null = null;
  selectedPeriod = "all";

  // Pagination
  currentPage = 1;
  itemsPerPage = 5; // Or any other number you prefer
  totalPages = 1;

  // Injeção via inject()
  private readingService = inject(ReadingService);
  private measurementTypeService = inject(MeasurementTypeService);
  private condominiumService = inject(CondominiumService);
  private meterService = inject(MeterService);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    console.log('[DEBUG] ngOnInit() chamado');
    this.isLoading = true;
    this.error = null;

    // Ler meterId da query string
    let meterIdFromQuery: number | null = null;
    this.route.queryParamMap.subscribe(params => {
      const meterIdParam = params.get('meterId');
      meterIdFromQuery = meterIdParam ? Number(meterIdParam) : null;
      console.log('[DEBUG] meterIdFromQuery:', meterIdFromQuery);

      // Buscar condomínios
      this.condominiumService.getCondominiums().subscribe({
        next: (data: { condominiums: Condominium[] }) => {
          this.condominiums = data.condominiums;
          data.condominiums.forEach((condo: Condominium) => {
            this.condominiumNames.set(condo.id, condo.name);
          });
        },
        error: (err: unknown) => console.error('Error fetching condominiums', err)
      });

      // Buscar tipos de medição
      this.measurementTypeService.getMeasurementTypes().subscribe({
        next: (data: MeasurementType[]) => this.measurementTypes = data,
        error: (err: unknown) => console.error('Error fetching measurement types', err)
      });

      console.log('[DEBUG] Verificando meterIdFromQuery:', meterIdFromQuery);
      
      if (meterIdFromQuery) {
        console.log('[DEBUG] Há meterId, carregando leituras filtradas...');
        // Buscar o medidor para setar o condomínio relacionado e tipo de medição
        this.meterService.getMeterById(meterIdFromQuery).subscribe((meter) => {
          if (meter?.unit?.condominium_id) {
            this.selectedCondominiumId = meter.unit.condominium_id;
          }
          if (meter?.measurement_type?.id) {
            this.selectedMeasurementTypeId = meter.measurement_type.id;
          } else {
            this.selectedMeasurementTypeId = null;
          }
        });
        // Debug: logar o meterId, token e endpoint
        const token = localStorage.getItem('authToken');
        console.log('[DEBUG] meterIdFromQuery:', meterIdFromQuery, 'authToken:', token);
        const endpoint = `/api/readings?meter_id=${meterIdFromQuery}`;
        console.log('[DEBUG] Endpoint chamado:', endpoint);
        this.readingService.getReadingsFiltered({ meter_id: meterIdFromQuery }).subscribe({
          next: (readings: Reading[]) => {
            console.log('[DEBUG] Readings recebidas para meter', meterIdFromQuery, readings);
            this.allReadings = readings; // Keep this as the filtered list for the initial view
            this.filteredReadings = readings;
            this.updatePaginatedReadings();
            // Preencher cache de todos os medidores das leituras recebidas
            const meterIds = Array.from(new Set(readings.map(r => r.meter_id)));
            if (meterIds.length > 0) {
              Promise.all(meterIds.map(id => this.meterService.getMeterById(id).toPromise()))
                .then((meters: (Meter | undefined)[]) => {
                  meters.forEach((meter) => {
                    if (meter) this.metersCache.set(meter.id, meter);
                  });
                  // Now that meters are cached, apply filters to show the correct initial state
                  this.applyFilters();
                });
            }
            this.isLoading = false;
          },
          error: (err: any) => {
            console.error('[DEBUG] Erro ao buscar leituras por meter:', err);
            if (err && err.error) {
              console.error('[DEBUG] err.error:', err.error);
            }
            if (err && err.status) {
              console.error('[DEBUG] err.status:', err.status);
            }
            if (err && err.statusText) {
              console.error('[DEBUG] err.statusText:', err.statusText);
            }
            if (err && err.message) {
              console.error('[DEBUG] err.message:', err.message);
            }
            // Tentar mostrar mensagem detalhada
            if (err && err.error && err.error.detail) {
              this.error = 'Erro: ' + err.error.detail;
            } else if (err && err.status) {
              this.error = `Erro HTTP ${err.status}: ${err.statusText}`;
            } else {
              this.error = 'Falha ao carregar as leituras do medidor.';
            }
            this.isLoading = false;
          }
        });
      } else {
        console.log('[DEBUG] Não há meterId, buscando todas as leituras...');
        console.log('[DEBUG] Chamando readingService.getAll()...');
        // Buscar todas as leituras normalmente
        this.readingService.getAll().pipe(
          tap((response: PaginatedResponse<Reading>) => {
            console.log('[DEBUG] Response do serviço:', response);
            const readings = response.data || [];
            console.log('[DEBUG] Readings carregadas:', readings.length);
            console.log('[DEBUG] Readings data:', readings);
            this.allReadings = readings;
            
            const meterIds = Array.from(new Set(readings.map((r: Reading) => r.meter_id)));
            console.log('[DEBUG] MeterIds únicos:', meterIds);
            
            if (meterIds.length === 0) {
              console.log('[DEBUG] Nenhum medidor encontrado, finalizando carregamento');
              this.filteredReadings = readings;
              this.updatePaginatedReadings();
              this.isLoading = false;
              return;
            }
            
            console.log('[DEBUG] Buscando medidores...');
            // Buscar todos os medidores individualmente
            Promise.all(meterIds.map(id => this.meterService.getMeterById(id).toPromise()))
              .then((meters: (Meter | undefined)[]) => {
                console.log('[DEBUG] Medidores carregados:', meters.length);
                meters.forEach((meter) => {
                  if (meter) this.metersCache.set(meter.id, meter);
                });
                
                this.filteredReadings = this.allReadings;
                this.updatePaginatedReadings();
                this.isLoading = false;
              })
              .catch((err) => {
                console.error('[DEBUG] Error fetching meters:', err);
                this.error = 'Falha ao carregar os medidores. Tente novamente mais tarde.';
                this.isLoading = false;
              });
          }),
          catchError((err: unknown) => {
            console.error('[DEBUG] Error fetching readings:', err);
            this.error = 'Falha ao carregar as leituras. Tente novamente mais tarde.';
            this.isLoading = false;
            return throwError(() => err);
          })
        ).subscribe({
          next: () => console.log('[DEBUG] Subscribe next executado'),
          error: (err) => console.error('[DEBUG] Subscribe error:', err),
          complete: () => console.log('[DEBUG] Subscribe completed')
        });
      }
    });
  }
  // Cache de medidores para evitar múltiplas requisições
  private metersCache = new Map<number, Meter>();

  // Dados carregados
  meters = new Map<number, Meter>();
  condominiumNames = new Map<number, string>();

  // Métodos auxiliares para acessar dados relacionados
  getCondominiumName(reading: Reading): string {
    const meter = this.metersCache.get(reading.meter_id);
    if (!meter?.unit?.condominium_id) return 'N/A';
    return this.condominiumNames.get(meter.unit.condominium_id) || 'N/A';
  }

  getUnitNumber(reading: Reading): string {
    const meter = this.metersCache.get(reading.meter_id);
    return meter?.unit?.number || 'N/A';
  }

  getMeasurementTypeName(reading: Reading): string {
    const meter = this.metersCache.get(reading.meter_id);
    return meter?.measurement_type?.name || 'N/A';
  }

  getMeasurementTypeUnit(reading: Reading): string {
    const meter = this.metersCache.get(reading.meter_id);
    return meter?.measurement_type?.unit || '';
  }

  getReadingValue(reading: Reading): string {
    if (reading.status === 'INACCESSIBLE') {
      return reading.inaccessible_reason || 'Inacessível';
    }
    return `${reading.current_reading} ${this.getMeasurementTypeUnit(reading)}`;
  }

  applyFilters(): void {
    console.log('[DEBUG] applyFilters() chamado');
    console.log('[DEBUG] allReadings.length:', this.allReadings.length);
    console.log('[DEBUG] Filtros selecionados:', {
      condominiumId: this.selectedCondominiumId,
      measurementTypeId: this.selectedMeasurementTypeId,
      period: this.selectedPeriod
    });

    const readings = [...this.allReadings];

    // Carregar medidores faltantes usando getMeterById em paralelo
    const uniqueMeterIds = new Set(readings.map(r => r.meter_id));
    const missingMeterIds = Array.from(uniqueMeterIds).filter(id => !this.metersCache.has(id));

    console.log('[DEBUG] uniqueMeterIds:', Array.from(uniqueMeterIds));
    console.log('[DEBUG] missingMeterIds:', missingMeterIds);
    console.log('[DEBUG] metersCache size:', this.metersCache.size);

    if (missingMeterIds.length > 0) {
      console.log('[DEBUG] Carregando medidores faltantes...');
      this.isLoading = true;
      Promise.all(missingMeterIds.map(id => this.meterService.getMeterById(id).toPromise()))
        .then((meters: (Meter | undefined)[]) => {
          console.log('[DEBUG] Medidores carregados:', meters);
          meters.forEach((meter) => {
            if (meter) this.metersCache.set(meter.id, meter);
          });
          console.log('[DEBUG] metersCache size após carregamento:', this.metersCache.size);
          this.applyFiltersInternal();
          this.isLoading = false;
        })
        .catch((err) => {
          console.error('[DEBUG] Error fetching meters', err);
          this.error = 'Falha ao carregar os medidores. Tente novamente mais tarde.';
          this.isLoading = false;
        });
    } else {
      console.log('[DEBUG] Todos os medidores já estão em cache, aplicando filtros...');
      this.applyFiltersInternal();
    }
  }

  private applyFiltersInternal(): void {
    console.log('[DEBUG] applyFiltersInternal() chamado');
    let readings = [...this.allReadings];
    console.log('[DEBUG] Readings iniciais:', readings.length);

    if (this.selectedCondominiumId) {
      console.log('[DEBUG] Filtrando por condomínio:', this.selectedCondominiumId);
      const beforeFilter = readings.length;
      readings = readings.filter(r => {
        const meter = this.metersCache.get(r.meter_id);
        const condoId = meter?.unit?.condominium_id;
        console.log('[DEBUG] Meter ID:', r.meter_id, 'Condo ID:', condoId, 'Selected:', this.selectedCondominiumId);
        return condoId === Number(this.selectedCondominiumId);
      });
      console.log('[DEBUG] Após filtro condomínio:', beforeFilter, '->', readings.length);
    }

    if (this.selectedMeasurementTypeId) {
      console.log('[DEBUG] Filtrando por tipo de medição:', this.selectedMeasurementTypeId);
      const beforeFilter = readings.length;
      readings = readings.filter(r => {
        const meter = this.metersCache.get(r.meter_id);
        const typeId = meter?.measurement_type?.id;
        console.log('[DEBUG] Meter ID:', r.meter_id, 'Type ID:', typeId, 'Selected:', this.selectedMeasurementTypeId);
        return typeId === Number(this.selectedMeasurementTypeId);
      });
      console.log('[DEBUG] Após filtro tipo:', beforeFilter, '->', readings.length);
    }
    
    if (this.selectedPeriod !== "all") {
      console.log('[DEBUG] Filtrando por período:', this.selectedPeriod);
      const beforeFilter = readings.length;
      const now = new Date();
      // Create a new date object for cutoffDate to avoid modifying 'now' in-place with setDate
      const cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const daysToSubtract = parseInt(this.selectedPeriod, 10);
      cutoffDate.setDate(cutoffDate.getDate() - daysToSubtract); // Correctly subtract days
      console.log('[DEBUG] Data de corte:', cutoffDate);
      
      readings = readings.filter(r => {
        const readingDate = new Date(r.date);
        console.log('[DEBUG] Reading date:', readingDate, 'Cutoff:', cutoffDate, 'Valid:', readingDate >= cutoffDate);
        return readingDate >= cutoffDate;
      });
      console.log('[DEBUG] Após filtro período:', beforeFilter, '->', readings.length);
    }

    console.log('[DEBUG] Readings finais após filtros:', readings.length);
    this.filteredReadings = readings;
    this.currentPage = 1; // Reset to first page after filtering
    this.updatePaginatedReadings();
  }
  clearFilters(): void {
    console.log('[DEBUG] clearFilters() chamado');
    this.selectedCondominiumId = null;
    this.selectedMeasurementTypeId = null;
    this.selectedPeriod = "all";
    this.applyFilters();
  }

  updatePaginatedReadings(): void {
    console.log('[DEBUG] updatePaginatedReadings() chamado');
    console.log('[DEBUG] filteredReadings.length:', this.filteredReadings.length);
    
    this.totalPages = Math.ceil(this.filteredReadings.length / this.itemsPerPage);
    if (this.totalPages === 0) this.totalPages = 1; // Ensure totalPages is at least 1

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedReadings = this.filteredReadings.slice(startIndex, startIndex + this.itemsPerPage);
    
    console.log('[DEBUG] paginatedReadings.length:', this.paginatedReadings.length);
    console.log('[DEBUG] currentPage:', this.currentPage, 'totalPages:', this.totalPages);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedReadings();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedReadings();
    }
  }
}
