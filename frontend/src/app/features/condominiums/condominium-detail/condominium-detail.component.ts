import { CommonModule } from '@angular/common';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { ToastService } from '@core/services/toast.service';
import { Condominium } from '@app/shared/models/condominium.model';
import { Unit } from '@app/shared/models/unit.model';
import { CondominiumService } from '@app/core/services/condominium.service';
import { Subject, takeUntil } from 'rxjs';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { UnitService } from '@app/core/services/Unit.service';

@Component({
  selector: 'app-condominium-detail',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonComponent,
    RouterLink
  ],
  templateUrl: './condominium-detail.component.html',
  styleUrls: ['./condominium-detail.component.scss']
})
export class CondominiumDetailComponent implements OnInit, OnDestroy {
  condominiumId = 0;
  condominium: Condominium | null = null;
  units: Unit[] = [];
  isLoading = false;
  isLoadingUnits = false;
  error: string | null = null;
  unitsError: string | null = null;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private condominiumService = inject(CondominiumService);
  private unitService = inject(UnitService);
  private toastService = inject(ToastService);
  private destroy$ = new Subject<void>();
  
  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = Number(params['id']);
        if (!isNaN(id)) {
          this.condominiumId = id;
          this.loadCondominium();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCondominium(): void {
    this.isLoading = true;
    this.error = null;    
    this.condominiumService.getCondominiumById(this.condominiumId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: Condominium | null) => {
          this.condominium = data;
          this.isLoading = false;
          this.loadUnits();
        },
        error: () => {
          this.error = 'Não foi possível carregar os dados do condomínio.';
          this.toastService.show({
            title: 'Erro ao carregar condomínio',
            variant: 'destructive'
          });
          this.isLoading = false;
        }
      });
  }

  loadUnits(): void {
    this.isLoadingUnits = true;
    this.unitsError = null;
    this.unitService.getUnits(this.condominiumId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: { units: Unit[] }) => {
          this.units = data.units;
          this.isLoadingUnits = false;
        },
        error: (error) => {
          console.error('Erro ao carregar unidades:', error);
          this.unitsError = 'Não foi possível carregar as unidades.';
          this.toastService.show({
            title: 'Erro ao carregar unidades',
            variant: 'destructive'
          });
          this.isLoadingUnits = false;
        }
      });
  }

  deleteUnit(unitId: number): void {
    if (confirm('Tem certeza que deseja excluir esta unidade?')) {
      this.unitService.deleteUnit(this.condominiumId, unitId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.show({
              title: 'Unidade excluída com sucesso',
              variant: 'default'
            });
            this.loadUnits();
          },
          error: (error) => {
            console.error('Erro ao excluir unidade:', error);
            this.toastService.show({
              title: 'Erro ao excluir unidade',
              variant: 'destructive'
            });
          }
        });
    }
  }

  goBack(): void {
    this.router.navigate(['/condominiums']);
  }

  goToUnitForm(unitId: number): void {
  this.router.navigate(['/units', unitId, 'meters']); // Listagem de medidores da unidade
  }
}
