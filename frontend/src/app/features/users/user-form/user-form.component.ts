import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '@app/core/services/user.service';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { ToastService } from '@app/core/services/toast.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    ButtonComponent,
    InputComponent
  ],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  loading = false;
  isEditing = false;
  userId: number | null = null;

  readonly roles = [
    { value: 'Admin', label: 'Administrador' },
    { value: 'Manager', label: 'Gerente' },
    { value: 'Reader', label: 'Leiturista' },
    { value: 'User', label: 'Usuário' }
  ];

  readonly statuses = [
    { value: 'Active', label: 'Ativo' },
    { value: 'Inactive', label: 'Inativo' }
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService
  ) {
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      name: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['User', [Validators.required]],
      status: ['Active', [Validators.required]],
      is_active: [1],
      initials: [''],
      avatarColor: ['#' + Math.floor(Math.random()*16777215).toString(16)]
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditing = true;
      this.userId = parseInt(id);
      this.loadUser(this.userId);
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();
    }
  }

  private loadUser(id: number) {
    this.loading = true;
    this.userService.getUserById(id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (user) => {
          this.userForm.patchValue({
            username: user.username,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            is_active: user.active,
            initials: user.initials,
            avatarColor: user.avatarColor
          });
        },
        error: (error) => {
          console.error('Erro ao carregar usuário:', error);
          // Adicionar notificação de erro
        }
      });
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.loading = true;
      const userData = this.userForm.value;
      
      // Gerar initials se não fornecido
      if (!userData.initials) {
        userData.initials = this.generateInitials(userData.name);
      }

      const request = this.isEditing && this.userId
        ? this.userService.updateUser(this.userId, userData)
        : this.userService.createUser(userData);

      request.pipe(finalize(() => this.loading = false))
        .subscribe({
          next: () => {
            this.toastService.show({ 
              title: this.isEditing ? 'Usuário atualizado' : 'Usuário criado',
              description: this.isEditing ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!',
              variant: 'default'
            });
            this.router.navigate(['/users']);
          },
          error: (error) => {
            console.error('Erro ao salvar usuário:', error);
            this.toastService.show({
              title: 'Erro ao salvar usuário',
              description: error.message || 'Ocorreu um erro ao salvar o usuário. Tente novamente.',
              variant: 'destructive'
            });
          }
        });
    }
  }

  onCancel(): void {
    this.router.navigate(['/users']);
  }

  private generateInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
