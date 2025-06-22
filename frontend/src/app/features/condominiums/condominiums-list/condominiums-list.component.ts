import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { RouterLink } from '@angular/router';
import { Condominium } from "../../shared/models/condominium.model";
import { CondominiumService } from '../../core/services/condominium.service';
import { ToastService } from '@core/services/toast.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-condominiums-list',
  standalone: true,
  imports: [
    CommonModule,
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

  constructor(
    private readonly condominiumService: CondominiumService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadCondominiums();
  }

  loadCondominiums(): void {
    this.isLoading = true;
    this.error = null;

    this.condominiumService.getCondominiums()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (data) => {
          this.condominiums = data;
        },
        error: (error) => {
          this.error = 'Não foi possível carregar os condomínios. Por favor, tente novamente.';
          this.toastService.show({
            title: 'Erro ao carregar condomínios',
            variant: 'destructive'
          });
          console.error('Erro ao carregar condomínios:', error);
        }
      });
  }
}
