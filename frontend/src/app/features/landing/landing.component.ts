import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="landing-container">
      <div class="hero-section">
        <h1>Bem-vindo ao MediSmart</h1>
        <p>Sistema de Medição de Consumíveis para Condomínios</p>
        <div class="cta-buttons">
          <a routerLink="/auth/login" class="btn btn-primary">Entrar</a>
          <a href="#features" class="btn btn-outline">Saiba mais</a>
        </div>
      </div>
      
      <div id="features" class="features-section">
        <h2>Funcionalidades</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>Gestão de Leituras</h3>
            <p>Registre e acompanhe leituras de água, gás e energia com facilidade.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📱</div>
            <h3>Acesso Mobile</h3>
            <p>Acesse suas informações de qualquer lugar através do seu dispositivo móvel.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📈</div>
            <h3>Relatórios Detalhados</h3>
            <p>Gere relatórios personalizados para análise de consumo.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🏢</div>
            <h3>Gestão de Condomínios</h3>
            <p>Administre múltiplos condomínios em uma única plataforma.</p>
          </div>
        </div>
      </div>
      
      <div class="contact-section">
        <h2>Entre em Contato</h2>
        <p>Precisa de ajuda ou mais informações? Nossa equipe está pronta para atendê-lo.</p>
        <a href="mailto:contato@medismart.com" class="btn btn-primary">Contate-nos</a>
      </div>
    </div>
  `,
  styles: [`
    .landing-container {
      padding: 2rem 1rem;
    }
    
    .hero-section {
      text-align: center;
      padding: 4rem 1rem;
      background-color: #f3f4f6;
      border-radius: 0.5rem;
      margin-bottom: 3rem;
    }
    
    .hero-section h1 {
      font-size: 2.5rem;
      color: #2563eb;
      margin-bottom: 1rem;
    }
    
    .hero-section p {
      font-size: 1.25rem;
      color: #4b5563;
      margin-bottom: 2rem;
    }
    
    .cta-buttons {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }
    
    .features-section {
      margin-bottom: 3rem;
    }
    
    .features-section h2 {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
    }
    
    .feature-card {
      background-color: white;
      border-radius: 0.5rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      text-align: center;
    }
    
    .feature-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    
    .feature-card h3 {
      margin-bottom: 0.5rem;
    }
    
    .contact-section {
      text-align: center;
      padding: 3rem 1rem;
      background-color: #f3f4f6;
      border-radius: 0.5rem;
    }
    
    .contact-section h2 {
      margin-bottom: 1rem;
    }
    
    .contact-section p {
      margin-bottom: 1.5rem;
    }
    
    @media (max-width: 768px) {
      .hero-section {
        padding: 2rem 1rem;
      }
      
      .hero-section h1 {
        font-size: 2rem;
      }
      
      .cta-buttons {
        flex-direction: column;
      }
    }
  `]
})
export class LandingComponent {
}
