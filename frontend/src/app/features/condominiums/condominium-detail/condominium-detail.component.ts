import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { RouterLink } from '@angular/router';
import { Condominium } from '@core/models/Condominium';
import { CondominiumService } from '@core/services/Condominium.service';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-condominium-detail',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonComponent,
    RouterLink
  ],
  template: `
    <div class="condominium-detail-container">
      <div class="condominium-header">
        <div>
          <h1 class="condominium-title">{{ condominium.name }}</h1>
          <p class="condominium-address">{{ condominium.address }}</p>
        </div>
        <div class="condominium-header-actions">
          <app-button [routerLink]="['/condominiums', condominium.id, 'edit']" variant="secondary">Editar</app-button>
          <app-button variant="outline" (click)="goBack()">Voltar</app-button>
        </div>
      </div>
      
      <div class="condominium-info-grid">
        <app-card title="Informações Gerais" [elevated]="true">
          <div class="info-group">
            <div class="info-item">
              <span class="info-label">CNPJ</span>
              <span class="info-value">{{ condominium.cnpj }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Responsável</span>
              <span class="info-value">{{ condominium.manager }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Telefone</span>
              <span class="info-value">{{ condominium.phone }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Email</span>
              <span class="info-value">{{ condominium.email }}</span>
            </div>
          </div>
        </app-card>
        
        <app-card title="Estatísticas" [elevated]="true">
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-value">{{ condominium.unitsCount }}</span>
              <span class="stat-label">Unidades</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ condominium.metersCount }}</span>
              <span class="stat-label">Medidores</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ condominium.readingsCount }}</span>
              <span class="stat-label">Leituras</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ condominium.reportsCount }}</span>
              <span class="stat-label">Relatórios</span>
            </div>
          </div>
        </app-card>
      </div>
      
      <app-card title="Unidades" [elevated]="true" class="units-card">
        <div class="units-header">
          <p>Total de {{ condominium.units.length }} unidades</p>
          <app-button [routerLink]="['/condominiums', condominium.id, 'units', 'new']" size="sm">Nova Unidade</app-button>
        </div>
        
        <div class="units-table-container">
          <table class="units-table">
            <thead>
              <tr>
                <th>Identificação</th>
                <th>Proprietário</th>
                <th>Medidores</th>
                <th>Última Leitura</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let unit of condominium.units">
                <td>{{ unit.identifier }}</td>
                <td>{{ unit.owner }}</td>
                <td>{{ unit.metersCount }}</td>
                <td>{{ unit.lastReading | date:'dd/MM/yyyy' }}</td>
                <td class="actions-cell">
                  <app-button [routerLink]="['/units', unit.id]" size="sm" variant="outline">Detalhes</app-button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </app-card>
    </div>
  `,
  styles: [`
    .condominium-detail-container {
      padding: 1.5rem;
    }
    
    .condominium-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }
    
    .condominium-title {
      font-size: 1.875rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }
    
    .condominium-address {
      color: #6b7280;
      margin: 0.25rem 0 0;
    }
    
    .condominium-header-actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .condominium-info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    
    .info-group {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
    }
    
    .info-label {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.25rem;
    }
    
    .info-value {
      font-weight: 500;
      color: #111827;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
    
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    
    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #2563eb;
    }
    
    .stat-label {
      font-size: 0.875rem;
      color: #6b7280;
    }
    
    .units-card {
      margin-bottom: 1.5rem;
    }
    
    .units-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .units-header p {
      margin: 0;
      color: #6b7280;
    }
    
    .units-table-container {
      overflow-x: auto;
    }
    
    .units-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .units-table th, .units-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .units-table th {
      font-weight: 600;
      color: #374151;
    }
    
    .actions-cell {
      text-align: right;
    }
  `]
})
export class CondominiumDetailComponent implements OnInit {
  condominiumId: number = 0;
  condominium: Condominium | null = null;
  isLoading = false;
  error: string | null = null;
  
  constructor(
    private route: ActivatedRoute,
    private condominiumService: CondominiumService,
    private toastService: ToastService
  ) {}
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = Number(params['id']);
      if (!isNaN(id)) {
        this.condominiumId = id;
        this.loadCondominium();
      }
    });
  }
  
  loadCondominium(): void {
    this.isLoading = true;
    this.error = null;
    
    this.condominiumService.getCondominiumById(this.condominiumId)
      .subscribe({
        next: (data) => {
          this.condominium = data;
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Não foi possível carregar os dados do condomínio.';
          this.toastService.show({
            title: 'Erro ao carregar condomínio',
            variant: 'destructive'
          });
          this.isLoading = false;
        }
      });
  }
  
  goBack(): void {
    window.history.back();
  }
}
