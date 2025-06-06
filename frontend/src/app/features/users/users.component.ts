import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '@core/services/user.service';
import { User } from '@core/models/User';
import { finalize } from 'rxjs';

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
export class UsersComponent implements OnInit {
  users: User[] = [];
  currentPage = 1;
  totalPages = 1;
  pageSize = 10;
  loading = false;
  searchTerm = '';
  selectedRole = 'all';

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
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
          // Aqui você pode adicionar uma notificação de erro para o usuário
        }
      });
  }

  onSearch() {
    this.loading = true;
    this.userService.searchUsers(this.searchTerm, this.selectedRole)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (users) => {
          this.users = users;
          this.currentPage = 1;
          this.totalPages = Math.ceil(users.length / this.pageSize);
        },
        error: (error) => {
          console.error('Erro ao pesquisar usuários:', error);
          // Aqui você pode adicionar uma notificação de erro para o usuário
        }
      });
  }

  onPageChange(next: boolean) {
    if (next && this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadUsers();
    } else if (!next && this.currentPage > 1) {
      this.currentPage--;
      this.loadUsers();
    }
  }
}
