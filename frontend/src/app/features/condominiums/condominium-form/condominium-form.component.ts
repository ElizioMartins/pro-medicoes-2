import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { ToastService } from '@core/services/toast.service';
import { cnpjValidator } from '@core/validators/cnpj.validator';
import { CondominiumService } from '@app/core/services/condominium.service';

@Component({
  selector: 'app-condominium-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    ButtonComponent,
    InputComponent
  ],
  template: `
    <div class="container mx-auto p-6">
      <app-card [elevated]="true">
        <h1 class="text-2xl font-semibold mb-6">{{ isEditMode ? 'Editar' : 'Novo' }} Condomínio</h1>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-group">
              <app-input
                label="Nome"
                type="text"
                formControlName="name"
                [error]="!!(form.get('name')?.errors && form.get('name')?.touched)"
                errorMessage="Nome é obrigatório"
              />
            </div>

            <div class="form-group">
              <app-input
                label="CNPJ"
                type="text"
                formControlName="cnpj"
                [error]="!!(form.get('cnpj')?.errors && form.get('cnpj')?.touched)"
                errorMessage="CNPJ inválido"
                mask="00.000.000/0000-00"
              />
            </div>

            <div class="form-group">
              <app-input
                label="Endereço"
                type="text"
                formControlName="address"
                [error]="!!(form.get('address')?.errors && form.get('address')?.touched)"
                errorMessage="Endereço é obrigatório"
              />
            </div>

            <div class="form-group">
              <app-input
                label="Responsável"
                type="text"
                formControlName="manager"
                [error]="!!(form.get('manager')?.errors && form.get('manager')?.touched)"
                errorMessage="Responsável é obrigatório"
              />
            </div>

            <div class="form-group">
              <app-input
                label="Telefone"
                type="text"
                formControlName="phone"
                [error]="!!(form.get('phone')?.errors && form.get('phone')?.touched)"
                errorMessage="Telefone é obrigatório"
                mask="(00) 00000-0000"
              />
            </div>

            <div class="form-group">
              <app-input
                label="Email"
                type="email"
                formControlName="email"
                [error]="!!(form.get('email')?.errors && form.get('email')?.touched)"
                errorMessage="Email inválido"
              />
            </div>
          </div>

          <div class="flex justify-end space-x-2 mt-6">
            <app-button
              type="button"
              variant="outline"
              (click)="goBack()"
            >
              Cancelar
            </app-button>
            <app-button
              type="submit"
              [disabled]="form.invalid || isLoading"
            >
              {{ isEditMode ? 'Atualizar' : 'Cadastrar' }}
            </app-button>
          </div>
        </form>
      </app-card>
    </div>
  `
})
export class CondominiumFormComponent implements OnInit {
  form: FormGroup;
  isLoading = false;
  isEditMode = false;
  condominiumId?: number;

  constructor(
    private fb: FormBuilder,
    private condominiumService: CondominiumService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      cnpj: ['', [Validators.required, cnpjValidator()]],
      address: ['', [Validators.required]],
      manager: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      unitsCount: [0],
      metersCount: [0],
      readingsCount: [0],
      reportsCount: [0]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.condominiumId = Number(id);
      this.loadCondominium();
    }
  }

  loadCondominium(): void {
    if (this.condominiumId) {
      this.isLoading = true;
      this.condominiumService.getCondominiumById(this.condominiumId)
        .subscribe({
          next: (condominium: { [key: string]: any; }) => {
            this.form.patchValue(condominium);
            this.isLoading = false;
          },
          error: () => {
            this.toastService.show({
              title: 'Erro ao carregar dados do condomínio',
              variant: 'destructive'
            });
            this.isLoading = false;
          }
        });
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.isLoading = true;
      const condominium = this.form.value;

      const request = this.isEditMode && this.condominiumId
        ? this.condominiumService.updateCondominium(this.condominiumId, condominium)
        : this.condominiumService.createCondominium(condominium);

      request.subscribe({
        next: () => {
          this.toastService.show({
            title: `Condomínio ${this.isEditMode ? 'atualizado' : 'cadastrado'} com sucesso!`,
            variant: 'default'
          });
          this.router.navigate(['/condominiums']);
        },
        error: (error) => {
          this.toastService.show({
            title: `Erro ao ${this.isEditMode ? 'atualizar' : 'cadastrar'} condomínio`,
            description: error.error?.detail || 'Tente novamente mais tarde',
            variant: 'destructive'
          });
          this.isLoading = false;
        }
      });
    }
  }

  goBack(): void {
    window.history.back();
  }
}
