import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ResponsiveService } from '@core/services/responsive.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="header">
      <div class="container">
        <div class="header-content">
          <div class="logo">
            <a routerLink="/">
              <h1>MediSmart</h1>
            </a>
          </div>
          
          <button *ngIf="responsiveService.isMobile" class="mobile-menu-button" (click)="toggleMobileMenu()">
            <span class="menu-icon"></span>
          </button>
            <nav class="main-nav" [class.mobile-open]="mobileMenuOpen">
            <ul class="nav-list">
              <li class="nav-item">
                <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">Dashboard</a>
              </li>
              <li class="nav-item">
                <a routerLink="/condominiums" routerLinkActive="active" class="nav-link">Condomínios</a>
              </li>
              <li class="nav-item">
                <a routerLink="/units" routerLinkActive="active" class="nav-link">Unidades</a>
              </li>
              <li class="nav-item">
                <a routerLink="/readings" routerLinkActive="active" class="nav-link">Leituras</a>
              </li>
              <li class="nav-item">
                <a routerLink="/reports" routerLinkActive="active" class="nav-link">Relatórios</a>
              </li>
              <li class="nav-item">
                <a routerLink="/users" routerLinkActive="active" class="nav-link">Usuários</a>
              </li>
            </ul>
          </nav>
          
          <div class="user-menu">
            <div class="user-avatar">JS</div>
            <div class="user-dropdown">
              <ul class="dropdown-menu">
                <li><a routerLink="/profile">Meu Perfil</a></li>
                <li><a routerLink="/settings">Configurações</a></li>
                <li><a href="#" (click)="logout($event)">Sair</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background-color: white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }
    
    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 4rem;
    }
    
    .logo a {
      text-decoration: none;
      color: #2563eb;
    }
    
    .logo h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
    }
    
    .main-nav {
      flex: 1;
      margin: 0 2rem;
    }
    
    .nav-list {
      display: flex;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    
    .nav-item {
      margin-right: 1.5rem;
    }
    
    .nav-link {
      color: #4b5563;
      text-decoration: none;
      font-weight: 500;
      padding: 0.5rem 0;
      transition: color 0.2s;
    }
    
    .nav-link:hover, .nav-link.active {
      color: #2563eb;
    }
    
    .user-menu {
      position: relative;
    }
    
    .user-avatar {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      background-color: #2563eb;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      cursor: pointer;
    }
    
    .user-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      background-color: white;
      border-radius: 0.375rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      min-width: 12rem;
      margin-top: 0.5rem;
      display: none;
    }
    
    .user-menu:hover .user-dropdown {
      display: block;
    }
    
    .dropdown-menu {
      list-style: none;
      margin: 0;
      padding: 0.5rem 0;
    }
    
    .dropdown-menu li a {
      display: block;
      padding: 0.5rem 1rem;
      color: #374151;
      text-decoration: none;
      transition: background-color 0.2s;
    }
    
    .dropdown-menu li a:hover {
      background-color: #f3f4f6;
    }
    
    .mobile-menu-button {
      display: none;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
    }
    
    .menu-icon {
      display: block;
      width: 1.5rem;
      height: 2px;
      background-color: #374151;
      position: relative;
    }
    
    .menu-icon::before, .menu-icon::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 2px;
      background-color: #374151;
      left: 0;
    }
    
    .menu-icon::before {
      top: -6px;
    }
    
    .menu-icon::after {
      bottom: -6px;
    }
    
    @media (max-width: 768px) {
      .mobile-menu-button {
        display: block;
      }
      
      .main-nav {
        position: absolute;
        top: 4rem;
        left: 0;
        right: 0;
        background-color: white;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        display: none;
        margin: 0;
      }
      
      .main-nav.mobile-open {
        display: block;
      }
      
      .nav-list {
        flex-direction: column;
        padding: 1rem;
      }
      
      .nav-item {
        margin-right: 0;
        margin-bottom: 0.5rem;
      }
      
      .nav-link {
        display: block;
        padding: 0.75rem 0;
      }
    }
  `]
})
export class HeaderComponent {
  mobileMenuOpen = false;
  
  constructor(public responsiveService: ResponsiveService) {}
  
  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
  
  logout(event: Event): void {
    event.preventDefault();
    // Em uma implementação real, aqui chamaríamos o serviço de autenticação
    console.log('Logout clicked');
  }
}
