import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonComponent],
  template: `
    <div class="billing-report">
      <!-- Header com botão voltar -->
      <div class="report-header">
        <div class="header-actions">
          <app-button 
            variant="outline" 
            (click)="goBack()">
            ← Voltar aos Relatórios
          </app-button>
        </div>
        <div class="header-info">
          <h1>Relatório de Faturamento</h1>
          <p class="subtitle">Detalhamento de custos por unidade</p>
        </div>
      </div>

      <app-card title="💰 Relatório de Faturamento" class="main-card">
        <div class="development-content">
          <div class="icon-section">
            <div class="construction-icon">⚙️</div>
          </div>
          
          <div class="text-content">
            <h2>Em Construção</h2>
            <p>Este relatório de faturamento está sendo desenvolvido e incluirá:</p>
            
            <div class="features-grid">
              <div class="feature-item">
                <h3>🧾 Detalhamento de Custos</h3>
                <p>Breakdown completo de todos os custos por unidade</p>
              </div>
              
              <div class="feature-item">
                <h3>📊 Resumo Financeiro</h3>
                <p>Totais, médias e comparativos financeiros</p>
              </div>
              
              <div class="feature-item">
                <h3>🏢 Rateio por Condomínio</h3>
                <p>Distribuição proporcional dos custos fixos</p>
              </div>
              
              <div class="feature-item">
                <h3>📈 Histórico de Faturamento</h3>
                <p>Evolução dos custos ao longo do tempo</p>
              </div>
            </div>
          </div>
        </div>
      </app-card>
    </div>
  `,
  styles: [`
    .billing-report {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      gap: 1rem;
    }

    .header-actions {
      flex-shrink: 0;
    }

    .header-info {
      flex: 1;
      text-align: center;
    }

    .header-info h1 {
      font-size: 2rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 0.5rem 0;
    }

    .header-info .subtitle {
      color: #6b7280;
      font-size: 1.125rem;
      margin: 0;
    }

    .main-card {
      min-height: 400px;
    }

    .development-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 2rem 0;
    }

    .icon-section {
      margin-bottom: 2rem;
    }

    .construction-icon {
      font-size: 4rem;
      animation: rotate 3s linear infinite;
    }

    .text-content h2 {
      color: #111827;
      margin: 0 0 1rem 0;
      font-size: 1.875rem;
    }

    .text-content > p {
      color: #6b7280;
      margin: 0 0 2rem 0;
      font-size: 1.125rem;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      width: 100%;
      margin-top: 1rem;
    }

    .feature-item {
      background-color: #f8fafc;
      padding: 1.5rem;
      border-radius: 0.5rem;
      border: 1px solid #e2e8f0;
      text-align: left;
    }

    .feature-item h3 {
      color: #111827;
      margin: 0 0 0.5rem 0;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .feature-item p {
      color: #6b7280;
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    @keyframes rotate {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    @media (max-width: 768px) {
      .features-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class BillingComponent {
  private router = inject(Router);

  goBack(): void {
    this.router.navigate(['/reports']);
  }
}