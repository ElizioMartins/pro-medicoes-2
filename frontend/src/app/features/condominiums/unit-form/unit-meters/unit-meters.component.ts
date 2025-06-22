import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, Params } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';

// UI Components
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';

// Models
import { Meter } from "../../shared/models/meter.model";
import { Unit } from "../../shared/models/unit.model";

// Services
import { MeterService } from '../../core/services/meter.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-unit-meters',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonComponent,
    RouterLink
  ],
  template: `
    <div class="container mx-auto p-2 sm:p-4 space-y-4">
      <!-- Header responsivo -->
      <app-card>
        <div class="p-4 sm:p-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 class="text-xl sm:text-2xl font-bold text-gray-800">
                Medidores da Unidade: {{ unit()?.identifier || 'Carregando...' }}
              </h1>
              <p class="text-sm text-gray-600 mt-1">
                Gerencie os medidores desta unidade
              </p>
            </div>
            <app-button 
              [routerLink]="['/units', unitId(), 'meters', 'new']" 
              variant="primary"
              class="w-full sm:w-auto">
              <span class="hidden sm:inline">Novo Medidor</span>
              <span class="sm:hidden">+ Medidor</span>
            </app-button>
          </div>

          <!-- Loading State -->
          <div *ngIf="isLoading()" class="text-center py-12">
            <div class="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <p class="mt-2 text-gray-600">Carregando medidores...</p>
          </div>

          <!-- Error State -->
          <div *ngIf="error()" class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            <p><strong>Erro:</strong> {{ error() }}</p>
            <app-button (click)="loadMeters()" variant="outline" class="mt-2">
              Tentar Novamente
            </app-button>
          </div>

          <!-- Empty State -->
          <div *ngIf="!isLoading() && !error() && meters().length === 0" 
               class="text-center py-12 bg-gray-50 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" 
                 class="h-12 w-12 mx-auto text-gray-400" 
                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="mt-2 text-lg font-medium text-gray-900">Nenhum medidor cadastrado</h3>
            <p class="mt-1 text-gray-500">Esta unidade ainda não possui medidores cadastrados.</p>
            <div class="mt-6">
              <app-button [routerLink]="['/units', unitId(), 'meters', 'new']" variant="primary">
                Cadastrar Primeiro Medidor
              </app-button>
            </div>
          </div>

          <!-- Meter List - Responsivo -->
          <div *ngIf="!isLoading() && !error() && meters().length > 0">
            <!-- Desktop Table -->
            <div class="hidden md:block overflow-x-auto">
              <table class="min-w-full bg-white">
                <thead class="bg-gray-50 text-gray-600 text-sm leading-normal">
                  <tr>
                    <th class="py-3 px-6 text-left">ID</th>
                    <th class="py-3 px-6 text-left">Tipo de Medição</th>
                    <th class="py-3 px-6 text-left">Número de Série</th>
                    <th class="py-3 px-6 text-left">Status</th>
                    <th class="py-3 px-6 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody class="text-gray-600 text-sm">
                  <tr *ngFor="let meter of meters(); trackBy: trackByMeterId" 
                      class="border-b border-gray-200 hover:bg-gray-50">
                    <td class="py-3 px-6">{{ meter.id }}</td>
                    <td class="py-3 px-6">{{ getMeasurementTypeName(meter.measurement_type_id) }}</td>
                    <td class="py-3 px-6">{{ meter.serial_number || 'Não especificado' }}</td>
                    <td class="py-3 px-6">
                      <span [class]="meter.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                            class="px-2 py-1 text-xs font-medium rounded-full">
                        {{ meter.active ? 'Ativo' : 'Inativo' }}
                      </span>
                    </td>
                    <td class="py-3 px-6 text-center">
                      <div class="flex justify-center space-x-2">
                        <app-button [routerLink]="['/units', unitId(), 'meters', meter.id, 'edit']" 
                                    size="sm" variant="outline">
                          Editar
                        </app-button>
                        <app-button [routerLink]="['/readings', 'meter', meter.id]" 
                                    size="sm" variant="outline">
                          Leituras
                        </app-button>
                        <app-button (click)="confirmDeleteMeter(meter)" 
                                    size="sm" variant="danger">
                          Excluir
                        </app-button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Mobile Cards -->
            <div class="md:hidden space-y-4">
              <div *ngFor="let meter of meters(); trackBy: trackByMeterId" 
                   class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div class="flex items-start justify-between mb-3">
                  <div class="flex-1">
                    <h3 class="font-semibold text-gray-900">
                      {{ getMeasurementTypeName(meter.measurement_type_id) }}
                    </h3>
                    <p class="text-sm text-gray-600">ID: {{ meter.id }}</p>
                  </div>
                  <span [class]="meter.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                        class="px-2 py-1 text-xs font-medium rounded-full">
                    {{ meter.active ? 'Ativo' : 'Inativo' }}
                  </span>
                </div>
                
                <div *ngIf="meter.serial_number" class="mb-3">
                  <span class="text-sm text-gray-500">Série:</span>
                  <span class="ml-1 text-sm font-mono">{{ meter.serial_number }}</span>
                </div>

                <div class="flex flex-col space-y-2">
                  <app-button [routerLink]="['/readings', 'meter', meter.id]" 
                              size="sm" variant="outline" class="w-full">
                    Ver Leituras
                  </app-button>
                  <div class="flex space-x-2">
                    <app-button [routerLink]="['/units', unitId(), 'meters', meter.id, 'edit']" 
                                size="sm" variant="outline" class="flex-1">
                      Editar
                    </app-button>
                    <app-button (click)="confirmDeleteMeter(meter)" 
                                size="sm" variant="danger" class="flex-1">
                      Excluir
                    </app-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </app-card>
    </div>
  `,
  styles: [`
    /* Additional component styles if needed */
  `]
})
export class UnitMetersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Signals para estado reativo
  unit = signal<Unit | null>(null);
  meters = signal<Meter[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  unitId = signal<number | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private meterService: MeterService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
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

  loadMeters(): void {
    const currentUnitId = this.unitId();
    if (!currentUnitId) {
      this.error.set('ID da unidade não fornecido');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.meterService.getByUnit(currentUnitId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          this.meters.set(response.data || []);
          // TODO: Carregar dados da unidade se necessário
        },
        error: (error) => {
          console.error('Erro ao carregar medidores:', error);
          this.error.set('Erro ao carregar dados dos medidores.');
          this.notificationService.showError('Erro ao carregar medidores');
        }
      });
  }

  confirmDeleteMeter(meter: Meter): void {
    if (confirm(`Tem certeza que deseja excluir o medidor ${this.getMeasurementTypeName(meter.measurement_type_id)}?`)) {
      this.deleteMeter(meter.id);
    }
  }

  deleteMeter(id: number): void {
    this.meterService.delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.meters.update(meters => meters.filter(m => m.id !== id));
          this.notificationService.showSuccess('Medidor excluído com sucesso');
        },
        error: (error) => {
          console.error('Erro ao excluir medidor:', error);
          this.notificationService.showError('Erro ao excluir medidor');
        }
      });
  }

  trackByMeterId(index: number, meter: Meter): number {
    return meter.id;
  }

  getMeasurementTypeName(typeId: number): string {
    // TODO: Implementar busca do nome do tipo de medição
    // Por enquanto, retorna um placeholder
    return `Tipo ${typeId}`;
  }
}
