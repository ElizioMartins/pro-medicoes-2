import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { CardComponent } from '@shared/components/ui/card/card.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    InputComponent,
    CardComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  isSubmitting = false;
  returnUrl: string = '/dashboard';
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    // Debug: Verificar mudanças no formulário
    this.loginForm.valueChanges.subscribe(value => {
      console.log('Form value changed:', value);
      console.log('Form valid:', this.loginForm.valid);
      console.log('Form invalid:', this.loginForm.invalid);
    });

    // Obter URL de retorno dos parâmetros da rota ou usar '/dashboard' como padrão
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  get formDebugInfo() {
    return {
      valid: this.loginForm.valid,
      invalid: this.loginForm.invalid,
      value: this.loginForm.value,
      errors: this.loginForm.errors
    };
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      // Marcar todos os campos como touched para mostrar erros
      Object.keys(this.loginForm.controls).forEach(key => {
        const control = this.loginForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    
    this.userService.login(this.loginForm.value).subscribe({
      next: () => {
        // O UserService já salva o token e usuário automaticamente
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        this.errorMessage = error.error?.detail || 'Credenciais inválidas';
        this.isSubmitting = false;
      }
    });
  }
}
