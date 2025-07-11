import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { RouterLink } from '@angular/router';
import { UnitService } from '@core/services/Unit.service';

import { ToastService } from '@core/services/toast.service';
import { Condominium } from '@app/shared/models/condominium.model';
import { Unit } from '@app/shared/models/unit.model';
import { CondominiumService } from '@app/core/services/condominium.service';

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
export class CondominiumDetailComponent implements OnInit {
  condominiumId: number = 0;
  condominium: Condominium | null = null;
  units: Unit[] = [];
  isLoading = false;
  isLoadingUnits = false;
  error: string | null = null;
  unitsError: string | null = null;
    constructor(
    private route: ActivatedRoute,
    private condominiumService: CondominiumService,
    private unitService: UnitService,
    private toastService: ToastService
  ) {}
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = Number(params['id']);
      if (!isNaN(id)) {
        this.condominiumId = id;
        this.loadCondominium();
      }
    });
  }
    loadCondominium(): void {
    this.isLoading = true;
    this.error = null;
    
    this.condominiumService.getCondominiumById(this.condominiumId)
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
      .subscribe({
        next: (data) => {
          this.units = data;
          this.isLoadingUnits = false;
        },
        error: (error) => {
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
    window.history.back();
  }
}
