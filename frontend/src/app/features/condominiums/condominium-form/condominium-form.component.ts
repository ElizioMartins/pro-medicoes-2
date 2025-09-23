import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { ToastService } from '@core/services/toast.service';
import { cnpjValidator } from '@core/validators/cnpj.validator';
import { CondominiumService } from '@app/core/services/condominium.service';
import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

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
  templateUrl: './condominium-form.component.html',
  styleUrls: ['./condominium-form.component.scss']
})
export class CondominiumFormComponent implements OnInit {
  form: FormGroup;
  isLoading = false;
  isEditMode = false;
  condominiumId?: number;

  private fb = inject(FormBuilder);
  private condominiumService = inject(CondominiumService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  constructor() {
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
          next: (condominium) => {
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
