import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, OnDestroy, signal, inject, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';

// UI Components
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';

// Models
import { Unit } from '@shared/models/unit.model';
import { Condominium } from '@shared/models/condominium.model';

// Services
import { UnitService } from '@core/services/unit.service';
import { CondominiumService } from '@core/services/condominium.service';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-unit-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    ButtonComponent,
    RouterLink
  ],
  template: `
    <div class="units-container">
      <h1 class="units-title">Unidades</h1>
      
      <!-- Filtros Rápidos -->
      <div class="dashboard-actions">
        <app-card title="Filtros" [elevated]="true">
          <div class="quick-filters items-start">
            <div class="filter-group">
              <label for="search-input">Buscar</label>
              <input
                id="search-input"
                type="text"
                [value]="searchTerm()"
                (input)="onSearchChange($event)"
                placeholder="Buscar por número ou proprietário..."
                class="filter-select">
            </div>

            <div class="filter-group">
              <label for="condominium-select">Condomínio</label>
              <select
                id="condominium-select"
                [value]="selectedCondominiumId() || ''"
                (change)="onCondominiumChange($event)"
                class="filter-select">
                <option value="">Todos os condomínios</option>
                <option *ngFor="let condo of condominiums()" [value]="condo.id">
                  {{ condo.name }}
                </option>
              </select>
            </div>

            <div class="filter-group">
              <label for="status-select">Status</label>
              <select
                id="status-select"
                [value]="selectedStatus()"
                (change)="onStatusChange($event)"
                class="filter-select">
                <option value="all">Todos</option>
                <option value="active">Ativas</option>
                <option value="inactive">Inativas</option>
              </select>
            </div>

            <div class="filter-actions">
              <app-button (click)="applyFilters()">Aplicar</app-button>
              <app-button (click)="clearFilters()" variant="outline">Limpar</app-button>
            </div>
          </div>
        </app-card>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="loading-state">
        <app-card [elevated]="true">
          <div class="loading-content">
            <div class="loading-spinner"></div>
            <p>Carregando unidades...</p>
          </div>
        </app-card>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="error-state">
        <app-card [elevated]="true">
          <div class="error-content">
            <p><strong>Erro:</strong> {{ error() }}</p>
            <app-button (click)="loadUnits()" variant="outline">Tentar Novamente</app-button>
          </div>
        </app-card>
      </div>

      <!-- Units List -->
      <div class="dashboard-recent">
        <app-card title="Lista de Unidades" [elevated]="true">
          <div class="units-header">
            <p>Total de {{ filteredUnits().length }} unidades{{ totalUnits() > filteredUnits().length ? (' (' + totalUnits() + ' total)') : '' }}</p>
            <app-button [routerLink]="['/condominiums']" variant="outline" size="sm">
              Gerenciar Condomínios
            </app-button>
          </div>

          <div *ngIf="!isLoading() && !error() && filteredUnits().length > 0; else noUnits">
            <table class="units-table">
              <thead>
                <tr>
                  <th>Unidade</th>
                  <th>Condomínio</th>
                  <th>Proprietário</th>
                  <th>Medidores</th>
                  <th>Última Leitura</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let unit of filteredUnits(); trackBy: trackByUnitId">
                  <td>
                    <span class="unit-number">{{ unit.number }}</span>
                  </td>
                  <td>{{ getCondominiumName(unit.condominium_id) }}</td>
                  <td>{{ unit.owner }}</td>
                  <td>
                    <span class="meters-count">{{ unit.meters_count || 0 }}</span>
                  </td>
                  <td>{{ unit.last_reading ? (unit.last_reading | date:'dd/MM/yyyy') : 'Nenhuma' }}</td>
                  <td>
                    <span class="status-badge" 
                          [class.bg-green-100]="unit.active"
                          [class.text-green-800]="unit.active"
                          [class.bg-red-100]="!unit.active"
                          [class.text-red-800]="!unit.active">
                      {{ unit.active ? 'Ativa' : 'Inativa' }}
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <app-button 
                        (click)="editUnit(unit)"
                        size="sm" 
                        variant="outline"
                        title="Editar unidade">
                        Editar
                      </app-button>
                      <app-button 
                        (click)="goToUnitMeters(unit)"
                        size="sm" 
                        variant="primary"
                        title="Ver medidores da unidade">
                        Medidores
                      </app-button>
                      <app-button 
                        (click)="confirmDeleteUnit(unit)"
                        size="sm" 
                        variant="danger"
                        title="Excluir unidade">
                        Excluir
                      </app-button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Paginação -->
            <div class="pagination" *ngIf="totalUnits() > pageSize()">
              <app-button 
                (click)="previousPage()" 
                [disabled]="!hasPreviousPage()"
                variant="outline" 
                size="sm">
                Anterior
              </app-button>
              <span class="pagination-info">
                Página {{ currentPage() + 1 }} de {{ Math.ceil(totalUnits() / pageSize()) }}
              </span>
              <app-button 
                (click)="nextPage()" 
                [disabled]="!hasNextPage()"
                variant="outline" 
                size="sm">
                Próxima
              </app-button>
            </div>
          </div>

          <ng-template #noUnits>
            <div class="no-data-message" *ngIf="!isLoading() && !error()">
              <div class="empty-state">
                <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" 
                     fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3>Nenhuma unidade encontrada</h3>
                <p>{{ selectedCondominiumId() || searchTerm() || selectedStatus() !== 'all' ? 
                      'Tente ajustar os filtros de busca.' : 
                      'Nenhuma unidade cadastrada no sistema.' }}</p>
                <app-button 
                  *ngIf="selectedCondominiumId() || searchTerm() || selectedStatus() !== 'all'"
                  (click)="clearFilters()" 
                  variant="outline">
                  Limpar Filtros
                </app-button>
                <app-button 
                  *ngIf="!selectedCondominiumId() && !searchTerm() && selectedStatus() === 'all'"
                  [routerLink]="['/condominiums']" 
                  variant="primary">
                  Gerenciar Condomínios
                </app-button>
              </div>
            </div>
          </ng-template>
        </app-card>
      </div>
    </div>
  `,
  styleUrls: ['./unit-list.component.scss']
})
export class UnitListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Signals para estado reativo
  units = signal<Unit[]>([]);
  condominiums = signal<Condominium[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  // Filtros
  selectedCondominiumId = signal<number | null>(null);
  searchTerm = signal('');
  selectedStatus = signal<'all' | 'active' | 'inactive'>('all');

  // Paginação
  currentPage = signal(0);
  pageSize = signal(20);
  totalUnits = signal(0);

  // Injeção via inject()
  private unitService = inject(UnitService);
  private condominiumService = inject(CondominiumService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // Computed signals
  filteredUnits = computed(() => {
    let units = this.units();
    
    // Filtro por condomínio
    if (this.selectedCondominiumId()) {
      units = units.filter(unit => unit.condominium_id === this.selectedCondominiumId());
    }

    // Filtro por status
    if (this.selectedStatus() !== 'all') {
      const isActive = this.selectedStatus() === 'active';
      units = units.filter(unit => unit.active === isActive);
    }

    // Filtro por texto
    if (this.searchTerm()) {
      const search = this.searchTerm().toLowerCase();
      units = units.filter(unit => 
        unit.number.toLowerCase().includes(search) ||
        unit.owner.toLowerCase().includes(search)
      );
    }

    return units;
  });

  hasNextPage = computed(() => {
    return (this.currentPage() + 1) * this.pageSize() < this.totalUnits();
  });

  hasPreviousPage = computed(() => {
    return this.currentPage() > 0;
  });

  ngOnInit(): void {
    this.loadCondominiums();
    this.loadUnits();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCondominiums(): void {
    this.condominiumService.getCondominiums(0, 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.condominiums.set(response.condominiums);
        },
        error: (error) => {
          console.error('Erro ao carregar condomínios:', error);
        }
      });
  }

  loadUnits(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const skip = this.currentPage() * this.pageSize();
    
    this.unitService.getAllUnits(skip, this.pageSize(), this.searchTerm() || undefined)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          this.units.set(response.units);
          this.totalUnits.set(response.total);
        },
        error: (error) => {
          console.error('Erro ao carregar unidades:', error);
          this.error.set('Erro ao carregar unidades.');
          this.toastService.showError('Erro ao carregar unidades');
        }
      });
  }

  applyFilters(): void {
    this.currentPage.set(0);
    this.loadUnits();
  }

  clearFilters(): void {
    this.selectedCondominiumId.set(null);
    this.searchTerm.set('');
    this.selectedStatus.set('all');
    this.currentPage.set(0);
    this.loadUnits();
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  onCondominiumChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    this.selectedCondominiumId.set(value ? Number(value) : null);
  }

  onStatusChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedStatus.set(target.value as 'all' | 'active' | 'inactive');
  }

  confirmDeleteUnit(unit: Unit): void {
    if (confirm(`Tem certeza que deseja excluir a unidade ${unit.number}?`)) {
      this.deleteUnit(unit);
    }
  }

  deleteUnit(unit: Unit): void {
    this.unitService.deleteUnit(unit.condominium_id, unit.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.units.update(units => units.filter(u => u.id !== unit.id));
          this.toastService.showSuccess('Unidade excluída com sucesso');
        },
        error: (error) => {
          console.error('Erro ao excluir unidade:', error);
          this.toastService.showError('Erro ao excluir unidade');
        }
      });
  }

  goToUnitMeters(unit: Unit): void {
    this.router.navigate(['/units', unit.id, 'meters']);
  }

  editUnit(unit: Unit): void {
    this.router.navigate(['/condominiums', unit.condominium_id, 'units', unit.id, 'edit']);
  }

  nextPage(): void {
    if (this.hasNextPage()) {
      this.currentPage.update(page => page + 1);
      this.loadUnits();
    }
  }

  previousPage(): void {
    if (this.hasPreviousPage()) {
      this.currentPage.update(page => page - 1);
      this.loadUnits();
    }
  }

  getCondominiumName(condominiumId: number): string {
    const condominium = this.condominiums().find(c => c.id === condominiumId);
    return condominium?.name || `Condomínio ${condominiumId}`;
  }

  trackByUnitId(index: number, unit: Unit): number {
    return unit.id;
  }

  // Expor Math para o template
  Math = Math;
}
