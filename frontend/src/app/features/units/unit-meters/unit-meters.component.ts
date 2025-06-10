import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';

import { Meter } from '@core/models/Meter';
import { MeterService } from '@core/services/Meter.service';
import { UnitService } from '@core/services/Unit.service';
import { Unit } from '@core/models/Unit';

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
    <div class="container mx-auto p-4">
      <app-card>
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-gray-800">Medidores da Unidade: {{ unit?.identifier || 'Carregando...' }}</h1>
            <app-button routerLink="./new" variant="primary">Novo Medidor</app-button>
          </div>

          <!-- Loading State -->
          <div *ngIf="isLoading" class="text-center py-12">
            <div class="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <p class="mt-2 text-gray-600">Carregando medidores...</p>
          </div>

          <!-- Error State -->
          <div *ngIf="error" class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            <p><strong>Erro:</strong> {{ error }}</p>
            <app-button (click)="loadMeters()" variant="outline" class="mt-2">Tentar Novamente</app-button>
          </div>

          <!-- Empty State -->
          <div *ngIf="!isLoading && !error && (!meters || meters.length === 0)" class="text-center py-12 bg-gray-50 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="mt-2 text-lg font-medium text-gray-900">Nenhum medidor cadastrado</h3>
            <p class="mt-1 text-gray-500">Esta unidade ainda não possui medidores cadastrados.</p>
            <div class="mt-6">
              <app-button routerLink="./new" variant="primary">Cadastrar Medidor</app-button>
            </div>
          </div>

          <!-- Meter List -->
          <div *ngIf="!isLoading && !error && meters && meters.length > 0" class="overflow-x-auto">
            <table class="min-w-full bg-white">
              <thead class="bg-gray-50 text-gray-600 text-sm leading-normal">
                <tr>
                  <th class="py-3 px-6 text-left">ID</th>
                  <th class="py-3 px-6 text-left">Tipo de Medição</th>
                  <th class="py-3 px-6 text-left">Número de Série</th>
                  <th class="py-3 px-6 text-left">Última Leitura</th>
                  <th class="py-3 px-6 text-center">Ações</th>
                </tr>
              </thead>
              <tbody class="text-gray-600 text-sm">
                <tr *ngFor="let meter of meters" class="border-b border-gray-200 hover:bg-gray-50">
                  <td class="py-3 px-6">{{ meter.id }}</td>
                  <td class="py-3 px-6">{{ meter.measurementType?.name || 'Não especificado' }}</td>
                  <td class="py-3 px-6">{{ meter.serialNumber || 'Não especificado' }}</td>
                  <td class="py-3 px-6">Em desenvolvimento</td>
                  <td class="py-3 px-6 text-center">
                    <div class="flex justify-center space-x-2">
                      <app-button [routerLink]="['./', meter.id, 'edit']" size="sm" variant="outline">Editar</app-button>
                      <app-button [routerLink]="['./', meter.id, 'readings']" size="sm" variant="outline">Leituras</app-button>
                      <app-button (click)="confirmDeleteMeter(meter)" size="sm" variant="destructive">Excluir</app-button>
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
export class UnitMetersComponent implements OnInit {
  unit: Unit | undefined;
  meters: Meter[] = [];
  isLoading = false;
  error: string | null = null;
  unitId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private meterService: MeterService,
    private unitService: UnitService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['unitId']) {
        this.unitId = params['unitId'];
        this.loadUnit();
        this.loadMeters();
      } else {
        this.error = 'ID da unidade não fornecido.';
      }
    });
  }

  loadUnit(): void {
    if (!this.unitId) return;
    
    this.isLoading = true;
    this.unitService.getUnitById(parseInt(this.unitId)).subscribe({
      next: unit => {
        this.unit = unit;
        this.isLoading = false;
      },
      error: err => {
        console.error('Erro ao carregar unidade:', err);
        this.error = 'Erro ao carregar dados da unidade.';
        this.isLoading = false;
      }
    });
  }

  loadMeters(): void {
    if (!this.unitId) return;
    
    this.isLoading = true;
    this.error = null;
    
    this.meterService.getMetersByUnitId(this.unitId).subscribe({
      next: meters => {
        this.meters = meters;
        this.isLoading = false;
      },
      error: err => {
        console.error('Erro ao carregar medidores:', err);
        this.error = 'Erro ao carregar medidores. Tente novamente mais tarde.';
        this.isLoading = false;
      }
    });
  }

  confirmDeleteMeter(meter: Meter): void {
    if (confirm(`Tem certeza que deseja excluir o medidor ${meter.measurementType?.name || 'selecionado'}?`)) {
      this.deleteMeter(meter.id);
    }
  }

  deleteMeter(id: string): void {
    this.meterService.deleteMeter(id).subscribe({
      next: () => {
        // Remove o medidor da lista local após a exclusão bem-sucedida
        this.meters = this.meters.filter(m => m.id !== id);
        // Exibir mensagem de sucesso (pode ser implementado posteriormente com um serviço de toast)
      },
      error: err => {
        console.error('Erro ao excluir medidor:', err);
        // Exibir mensagem de erro (pode ser implementado posteriormente com um serviço de toast)
      }
    });
  }
}
