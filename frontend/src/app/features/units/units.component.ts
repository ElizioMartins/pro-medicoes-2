import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';

import { Unit } from '@core/models/Unit';
import { UnitService } from '@core/services/Unit.service';
import { CondominiumService } from '@core/services/Condominium.service';
import { Condominium } from '@core/models/Condominium';

@Component({
  selector: 'app-units',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardComponent,
    ButtonComponent
  ],
  template: `
    <div class="container mx-auto p-4">
      <app-card>
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-gray-800">Unidades</h1>
          </div>

          <!-- Loading State -->
          <div *ngIf="isLoading" class="text-center py-12">
            <div class="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <p class="mt-2 text-gray-600">Carregando unidades...</p>
          </div>

          <!-- Error State -->
          <div *ngIf="error" class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            <p><strong>Erro:</strong> {{ error }}</p>
            <app-button (click)="loadUnits()" variant="outline" class="mt-2">Tentar Novamente</app-button>
          </div>

          <!-- Empty State -->
          <div *ngIf="!isLoading && !error && (!units || units.length === 0)" class="text-center py-12 bg-gray-50 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="mt-2 text-lg font-medium text-gray-900">Nenhuma unidade cadastrada</h3>
            <p class="mt-1 text-gray-500">Ainda não existem unidades cadastradas no sistema.</p>
          </div>

          <!-- Units List -->
          <div *ngIf="!isLoading && !error && units && units.length > 0" class="overflow-x-auto">
            <table class="min-w-full bg-white">
              <thead class="bg-gray-50 text-gray-600 text-sm leading-normal">
                <tr>
                  <th class="py-3 px-6 text-left">Identificador</th>
                  <th class="py-3 px-6 text-left">Proprietário</th>
                  <th class="py-3 px-6 text-left">Condomínio</th>
                  <th class="py-3 px-6 text-left">Medidores</th>
                  <th class="py-3 px-6 text-left">Última Leitura</th>
                  <th class="py-3 px-6 text-center">Ações</th>
                </tr>
              </thead>
              <tbody class="text-gray-600 text-sm">
                <tr *ngFor="let unit of units" class="border-b border-gray-200 hover:bg-gray-50">
                  <td class="py-3 px-6">{{ unit.identifier }}</td>
                  <td class="py-3 px-6">{{ unit.owner }}</td>
                  <td class="py-3 px-6">{{ getCondominiumName(unit.condominiumId) }}</td>
                  <td class="py-3 px-6">{{ unit.metersCount || 0 }}</td>
                  <td class="py-3 px-6">{{ unit.lastReading | date:'dd/MM/yyyy' || 'Nunca' }}</td>
                  <td class="py-3 px-6 text-center">
                    <div class="flex justify-center space-x-2">
                      <app-button [routerLink]="['/units', unit.id, 'meters']" size="sm" variant="primary">Medidores</app-button>
                      <app-button [routerLink]="['/condominiums', unit.condominiumId, 'units', unit.id, 'edit']" size="sm" variant="outline">Editar</app-button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </app-card>
    </div>
  `,
  styles: [`
    /* Additional component styles if needed */
  `]
})
export class UnitsComponent implements OnInit {
  units: Unit[] = [];
  condominiums: Condominium[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(
    private unitService: UnitService,
    private condominiumService: CondominiumService
  ) {}

  ngOnInit(): void {
    this.loadCondominiums();
    this.loadUnits();
  }

  loadCondominiums(): void {
    this.condominiumService.getCondominiums().subscribe({
      next: (condominiums) => {
        this.condominiums = condominiums;
      },
      error: (err) => {
        console.error('Erro ao carregar condomínios:', err);
      }
    });
  }

  loadUnits(): void {
    this.isLoading = true;
    this.error = null;
    
    this.unitService.getUnits().subscribe({
      next: (units) => {
        this.units = units;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar unidades:', err);
        this.error = 'Erro ao carregar unidades. Tente novamente mais tarde.';
        this.isLoading = false;
      }
    });
  }

  getCondominiumName(condominiumId: number): string {
    const condominium = this.condominiums.find(c => c.id === condominiumId);
    return condominium ? condominium.name : 'Não especificado';
  }
}
