import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-economy-analysis',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonComponent],
  template: `
    <div class="economy-analysis-report">
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
          <h1>Análise de Economia</h1>
          <p class="subtitle">Identificação de oportunidades de economia</p>
        </div>
      </div>

      <app-card title="🌱 Análise de Economia de Água" class="main-card">
        <div class="development-content">
          <div class="icon-section">
            <div class="construction-icon">🚧</div>
          </div>
          
          <div class="text-content">
            <h2>Em Desenvolvimento</h2>
            <p>Este relatório de análise de economia está sendo desenvolvido e incluirá:</p>
            
            <div class="features-grid">
              <div class="feature-item">
                <h3>💧 Identificação de Desperdícios</h3>
                <p>Detecção automática de padrões de consumo anômalos</p>
              </div>
              
              <div class="feature-item">
                <h3>📈 Potencial de Economia</h3>
                <p>Cálculo de economia potencial por unidade</p>
              </div>
              
              <div class="feature-item">
                <h3>💡 Recomendações Personalizadas</h3>
                <p>Sugestões específicas baseadas no perfil de consumo</p>
              </div>
              
              <div class="feature-item">
                <h3>🎯 Metas de Redução</h3>
                <p>Estabelecimento de metas realistas de economia</p>
              </div>
            </div>
          </div>
        </div>
      </app-card>
    </div>
  `,
  styles: [`
    .economy-analysis-report {
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
      animation: bounce 2s infinite;
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

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-10px);
      }
      60% {
        transform: translateY(-5px);
      }
    }

    @media (max-width: 768px) {
      .features-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class EconomyAnalysisComponent {
  private router = inject(Router);

  goBack(): void {
    this.router.navigate(['/reports']);
  }
}