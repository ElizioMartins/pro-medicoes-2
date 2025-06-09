import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { User } from '@core/models/User';
import { finalize, Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { UserService } from '@app/core/services/user.service';
import { ToastService } from '@app/core/services/toast.service';

interface UserRole {
  value: string;
  label: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonComponent,
    RouterLink,
    FormsModule
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit, OnDestroy {
  users: User[] = [];
  currentPage = 1;
  totalPages = 1;
  pageSize = 10;
  loading = false;
  searchTerm = '';
  selectedRole = 'all';

  private readonly searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  readonly roles: UserRole[] = [
    { value: 'all', label: 'Todos os perfis' },
    { value: 'Admin', label: 'Administrador' },
    { value: 'Manager', label: 'Gerente' },
    { value: 'Reader', label: 'Leiturista' },
    { value: 'User', label: 'Usuário' }
  ];

  constructor(
    private readonly userService: UserService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    
    // Configura o debounce para a busca
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.onSearch();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm = value; // Atualiza o valor do input
    this.searchSubject.next(this.searchTerm); // Dispara a busca com o termo atualizado
  }

  // Busca apenas por perfil
  onRoleChange(): void {
    this.currentPage = 1; // Reseta a página ao mudar o filtro
    this.searchWithFilters('', this.selectedRole);
  }

  // Busca completa (botão)
  onSearchClick(): void {
    this.searchWithFilters(this.searchTerm, this.selectedRole);
  }
  onSearch(): void {
    this.searchWithFilters(this.searchTerm, this.selectedRole);
  }

  onPageChange(next: boolean): void {
    if (next && this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadUsers();
    } else if (!next && this.currentPage > 1) {
      this.currentPage--;
      this.loadUsers();
    }
  }

  private loadUsers(): void {
    this.loading = true;
    this.userService.getUsers(this.currentPage, this.pageSize)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: ({ users, total }) => {
          this.users = users;
          this.totalPages = Math.ceil(total / this.pageSize);
        },
        error: (error) => {
          console.error('Erro ao carregar usuários:', error);
          this.toastService.show({
            title: 'Erro ao carregar usuários',
            description: error.message || 'Ocorreu um erro ao carregar os usuários. Tente novamente.',
            variant: 'destructive'
          });
        }
      });
  }

  private searchWithFilters(searchTerm: string, role: string): void {
    this.loading = true;
    this.userService.searchUsers(searchTerm, role, this.currentPage, this.pageSize)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: ({ users, total }) => {
          this.users = users;
          this.totalPages = Math.ceil(total / this.pageSize);
        },
        error: (error) => {
          console.error('Erro ao pesquisar usuários:', error);
          this.toastService.show({
            title: 'Erro ao pesquisar usuários',
            description: error.message || 'Ocorreu um erro ao pesquisar os usuários. Tente novamente.',
            variant: 'destructive'
          });
        }
      });
  }
}