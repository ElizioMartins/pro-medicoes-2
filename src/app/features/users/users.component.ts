import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonComponent,
    RouterLink
  ],
  template: `
    <div class="users-container">
      <div class="users-header">
        <h1 class="users-title">Usuários</h1>
        <app-button routerLink="/users/new">Novo Usuário</app-button>
      </div>
      
      <app-card [elevated]="true" class="users-card">
        <div class="users-filters">
          <div class="search-box">
            <input type="text" placeholder="Buscar usuários..." class="search-input">
            <button class="search-button">Buscar</button>
          </div>
          <div class="filter-dropdown">
            <select class="filter-select">
              <option value="all">Todos os perfis</option>
              <option value="admin">Administrador</option>
              <option value="manager">Gerente</option>
              <option value="reader">Leiturista</option>
              <option value="user">Usuário</option>
            </select>
          </div>
        </div>
        
        <div class="users-table-container">
          <table class="users-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Último Acesso</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of users">
                <td>
                  <div class="user-info">
                    <div class="user-avatar" [style.backgroundColor]="user.avatarColor">
                      {{ user.initials }}
                    </div>
                    <span>{{ user.name }}</span>
                  </div>
                </td>
                <td>{{ user.email }}</td>
                <td>
                  <span class="user-role" [class]="'role-' + user.role.toLowerCase()">
                    {{ user.role }}
                  </span>
                </td>
                <td>
                  <span class="user-status" [class]="'status-' + user.status.toLowerCase()">
                    {{ user.status }}
                  </span>
                </td>
                <td>{{ user.lastAccess | date:'dd/MM/yyyy HH:mm' }}</td>
                <td class="actions-cell">
                  <app-button [routerLink]="['/users', user.id]" size="sm" variant="outline">Detalhes</app-button>
                  <app-button [routerLink]="['/users', user.id, 'edit']" size="sm" variant="secondary">Editar</app-button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="pagination">
          <button class="pagination-button" [disabled]="currentPage === 1">Anterior</button>
          <span class="pagination-info">Página {{ currentPage }} de {{ totalPages }}</span>
          <button class="pagination-button" [disabled]="currentPage === totalPages">Próxima</button>
        </div>
      </app-card>
    </div>
  `,
  styles: [`
    .users-container {
      padding: 1.5rem;
    }
    
    .users-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    
    .users-title {
      font-size: 1.875rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }
    
    .users-card {
      margin-bottom: 1.5rem;
    }
    
    .users-filters {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1rem;
    }
    
    .search-box {
      display: flex;
      flex: 1;
      max-width: 500px;
    }
    
    .search-input {
      flex: 1;
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-right: none;
      border-radius: 0.375rem 0 0 0.375rem;
      font-size: 0.875rem;
    }
    
    .search-button {
      padding: 0.5rem 1rem;
      background-color: #2563eb;
      color: white;
      border: none;
      border-radius: 0 0.375rem 0.375rem 0;
      cursor: pointer;
    }
    
    .filter-dropdown {
      margin-left: 1rem;
    }
    
    .filter-select {
      padding: 0.5rem;
      border-radius: 0.375rem;
      border: 1px solid #d1d5db;
      background-color: white;
      color: #1f2937;
      font-size: 0.875rem;
    }
    
    .users-table-container {
      overflow-x: auto;
    }
    
    .users-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .users-table th, .users-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .users-table th {
      font-weight: 600;
      color: #374151;
    }
    
    .user-info {
      display: flex;
      align-items: center;
    }
    
    .user-avatar {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      margin-right: 0.75rem;
    }
    
    .user-role {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
    }
    
    .role-admin {
      background-color: #7c3aed;
      color: white;
    }
    
    .role-manager {
      background-color: #2563eb;
      color: white;
    }
    
    .role-reader {
      background-color: #0891b2;
      color: white;
    }
    
    .role-user {
      background-color: #4b5563;
      color: white;
    }
    
    .user-status {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
    }
    
    .status-active {
      background-color: #10b981;
      color: white;
    }
    
    .status-inactive {
      background-color: #6b7280;
      color: white;
    }
    
    .status-pending {
      background-color: #f59e0b;
      color: white;
    }
    
    .actions-cell {
      display: flex;
      gap: 0.5rem;
    }
    
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
    }
    
    .pagination-button {
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      border: 1px solid #d1d5db;
      background-color: white;
      color: #374151;
      cursor: pointer;
    }
    
    .pagination-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .pagination-info {
      color: #6b7280;
    }
  `]
})
export class UsersComponent {
  // Dados simulados para demonstração
  users = [
    {
      id: '1',
      name: 'João Silva',
      email: 'joao.silva@example.com',
      role: 'Admin',
      status: 'Active',
      lastAccess: new Date(2025, 4, 27, 14, 30),
      initials: 'JS',
      avatarColor: '#7c3aed'
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria.santos@example.com',
      role: 'Manager',
      status: 'Active',
      lastAccess: new Date(2025, 4, 26, 10, 15),
      initials: 'MS',
      avatarColor: '#2563eb'
    },
    {
      id: '3',
      name: 'Carlos Oliveira',
      email: 'carlos.oliveira@example.com',
      role: 'Reader',
      status: 'Active',
      lastAccess: new Date(2025, 4, 25, 16, 45),
      initials: 'CO',
      avatarColor: '#0891b2'
    },
    {
      id: '4',
      name: 'Ana Pereira',
      email: 'ana.pereira@example.com',
      role: 'User',
      status: 'Inactive',
      lastAccess: new Date(2025, 4, 20, 9, 30),
      initials: 'AP',
      avatarColor: '#4b5563'
    },
    {
      id: '5',
      name: 'Roberto Costa',
      email: 'roberto.costa@example.com',
      role: 'Reader',
      status: 'Pending',
      lastAccess: new Date(2025, 4, 15, 11, 20),
      initials: 'RC',
      avatarColor: '#0891b2'
    }
  ];
  
  currentPage = 1;
  totalPages = 3;
}
