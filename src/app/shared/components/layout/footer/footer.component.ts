import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-logo">
            <h2>MediSmart</h2>
            <p>Sistema de Medição de Consumíveis</p>
          </div>
          
          <div class="footer-links">
            <div class="footer-section">
              <h3>Navegação</h3>
              <ul>
                <li><a href="/dashboard">Dashboard</a></li>
                <li><a href="/condominiums">Condomínios</a></li>
                <li><a href="/readings">Leituras</a></li>
                <li><a href="/reports">Relatórios</a></li>
              </ul>
            </div>
            
            <div class="footer-section">
              <h3>Suporte</h3>
              <ul>
                <li><a href="/help">Ajuda</a></li>
                <li><a href="/contact">Contato</a></li>
                <li><a href="/faq">FAQ</a></li>
              </ul>
            </div>
            
            <div class="footer-section">
              <h3>Legal</h3>
              <ul>
                <li><a href="/terms">Termos de Uso</a></li>
                <li><a href="/privacy">Privacidade</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p>&copy; 2025 MediSmart. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background-color: #1f2937;
      color: #f3f4f6;
      padding: 3rem 0 1.5rem;
      margin-top: 2rem;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }
    
    .footer-content {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      margin-bottom: 2rem;
    }
    
    .footer-logo {
      margin-bottom: 1.5rem;
    }
    
    .footer-logo h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #2563eb;
    }
    
    .footer-logo p {
      margin: 0.25rem 0 0;
      font-size: 0.875rem;
      color: #9ca3af;
    }
    
    .footer-links {
      display: flex;
      flex-wrap: wrap;
      gap: 2rem;
    }
    
    .footer-section h3 {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 1rem;
      color: #e5e7eb;
    }
    
    .footer-section ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .footer-section li {
      margin-bottom: 0.5rem;
    }
    
    .footer-section a {
      color: #9ca3af;
      text-decoration: none;
      transition: color 0.2s;
    }
    
    .footer-section a:hover {
      color: #e5e7eb;
    }
    
    .footer-bottom {
      border-top: 1px solid #374151;
      padding-top: 1.5rem;
      text-align: center;
    }
    
    .footer-bottom p {
      margin: 0;
      font-size: 0.875rem;
      color: #9ca3af;
    }
    
    @media (max-width: 768px) {
      .footer-content {
        flex-direction: column;
      }
      
      .footer-links {
        flex-direction: column;
        gap: 1.5rem;
      }
    }
  `]
})
export class FooterComponent {
}
