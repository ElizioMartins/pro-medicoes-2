import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { RouterLink } from '@angular/router';
import { ToastService } from '@core/services/toast.service';
import { finalize } from 'rxjs';
import { Condominium } from '@app/shared/models/condominium.model';
import { CondominiumService } from '@app/core/services/condominium.service';
import { UserService } from '@app/core/services/user.service';

@Component({
  selector: 'app-condominiums-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    ButtonComponent,
    RouterLink
  ],
  templateUrl: './condominiums-list.component.html',
  styleUrls: ['./condominiums-list.component.scss']
})
export class CondominiumsListComponent implements OnInit {
  condominiums: Condominium[] = [];
  isLoading = false;
  error: string | null = null;
  total = 0;
  currentPage = 0;
  pageSize = 10;
  searchTerm = '';

  constructor(
    private readonly condominiumService: CondominiumService,
    private readonly toastService: ToastService,
    private readonly userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadCondominiums();
  }

  loadCondominiums(): void {
    this.isLoading = true;
    this.error = null;

    this.condominiumService.getCondominiums(this.currentPage * this.pageSize, this.pageSize, this.searchTerm)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.condominiums = response.condominiums;
          this.total = response.total;
        },
        error: (error: unknown) => {
          this.error = 'Não foi possível carregar os condomínios. Por favor, tente novamente.';
          this.toastService.show({
            title: 'Erro ao carregar condomínios',
            variant: 'destructive'
          });
          console.error('Erro ao carregar condomínios:', error);
        }
      });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage = 0;
    this.loadCondominiums();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadCondominiums();
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.pageSize);
  }

  // Verificações de permissão
  canCreateCondominiums(): boolean {
    const user = this.userService.getCurrentUser();
    return user?.role === 'Admin' || user?.role === 'Manager';
  }

  canEditCondominiums(): boolean {
    const user = this.userService.getCurrentUser();
    return user?.role === 'Admin' || user?.role === 'Manager';
  }

  canDeleteCondominiums(): boolean {
    const user = this.userService.getCurrentUser();
    return user?.role === 'Admin' || user?.role === 'Manager';
  }
}
