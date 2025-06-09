import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '@app/core/services/user.service';
import { User } from '@app/core/models/User';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { ToastService } from '@app/core/services/toast.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-user-delete',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonComponent
  ],
  templateUrl: './user-delete.component.html',
  styleUrls: ['./user-delete.component.scss']
})
export class UserDeleteComponent implements OnInit {
  user: User | null = null;
  loading = false;
  deleting = false;

  constructor(
    private readonly userService: UserService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toastService: ToastService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadUser(parseInt(id));
    }
  }

  private loadUser(id: number) {
    this.loading = true;
    this.userService.getUserById(id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (user) => {
          this.user = user;
        },
        error: (error) => {
          console.error('Erro ao carregar usuário:', error);
          this.router.navigate(['/users']);
        }
      });
  }

  onConfirmDelete() {
    if (this.user) {
      this.deleting = true;
      this.userService.deleteUser(this.user.id)
        .pipe(finalize(() => this.deleting = false))
        .subscribe({
          next: () => {
            this.toastService.show({
              title: 'Usuário excluído',
              description: 'Usuário excluído com sucesso!',
              variant: 'default'
            });
            this.router.navigate(['/users']);
          },
          error: (error) => {
            console.error('Erro ao excluir usuário:', error);
            this.toastService.show({
              title: 'Erro ao excluir usuário',
              description: error.message || 'Ocorreu um erro ao excluir o usuário. Tente novamente.',
              variant: 'destructive'
            });
          }
        });
    }
  }

  onCancel() {
    this.router.navigate(['/users']);
  }
}
