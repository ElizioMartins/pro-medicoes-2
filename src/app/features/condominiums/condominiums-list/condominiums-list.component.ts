import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-condominiums-list',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonComponent,
    RouterLink
  ],
  template: `
    <div class="condominiums-container">
      <div class="condominiums-header">
        <h1 class="condominiums-title">Condomínios</h1>
        <app-button routerLink="/condominiums/new">Novo Condomínio</app-button>
      </div>
      
      <div class="condominiums-grid">
        <app-card *ngFor="let condominium of condominiums" 
                 [title]="condominium.name"
                 [subtitle]="condominium.address"
                 [elevated]="true"
                 class="condominium-card">
          <div class="condominium-content">
            <div class="condominium-info">
              <p><strong>Unidades:</strong> {{ condominium.unitsCount }}</p>
              <p><strong>Medidores:</strong> {{ condominium.metersCount }}</p>
            </div>
            <div class="condominium-actions">
              <app-button [routerLink]="['/condominiums', condominium.id]" size="sm">Detalhes</app-button>
              <app-button [routerLink]="['/condominiums', condominium.id, 'edit']" variant="secondary" size="sm">Editar</app-button>
            </div>
          </div>
        </app-card>
      </div>
      
      <div *ngIf="condominiums.length === 0" class="no-condominiums">
        <p>Nenhum condomínio cadastrado.</p>
        <app-button routerLink="/condominiums/new">Cadastrar Condomínio</app-button>
      </div>
    </div>
  `,
  styles: [`
    .condominiums-container {
      padding: 1.5rem;
    }
    
    .condominiums-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    
    .condominiums-title {
      font-size: 1.875rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }
    
    .condominiums-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    
    .condominium-card {
      height: 100%;
    }
    
    .condominium-content {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .condominium-info {
      flex-grow: 1;
      margin-bottom: 1rem;
    }
    
    .condominium-info p {
      margin: 0.5rem 0;
      color: #4b5563;
    }
    
    .condominium-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }
    
    .no-condominiums {
      text-align: center;
      padding: 3rem 0;
    }
    
    .no-condominiums p {
      margin-bottom: 1rem;
      color: #6b7280;
    }
  `]
})
export class CondominiumsListComponent implements OnInit {
  // Dados simulados para demonstração
  condominiums = [
    {
      id: '1',
      name: 'Residencial Parque das Flores',
      address: 'Av. Principal, 1000 - Centro',
      unitsCount: 120,
      metersCount: 360
    },
    {
      id: '2',
      name: 'Edifício Solar',
      address: 'Rua das Palmeiras, 500 - Jardim',
      unitsCount: 48,
      metersCount: 144
    },
    {
      id: '3',
      name: 'Condomínio Vista Mar',
      address: 'Av. Beira Mar, 2500 - Praia',
      unitsCount: 80,
      metersCount: 240
    },
    {
      id: '4',
      name: 'Residencial Montanhas',
      address: 'Rua das Serras, 150 - Alto',
      unitsCount: 32,
      metersCount: 96
    }
  ];
  
  constructor() {}
  
  ngOnInit(): void {
    // Em uma implementação real, aqui carregaríamos os dados do backend
  }
}
