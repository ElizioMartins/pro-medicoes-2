import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { RouterLink } from '@angular/router';
import { MeasurementTypesComponent } from '@features/measurement-types/measurement-types.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonComponent, RouterLink, MeasurementTypesComponent],
  template: `
    <div class="p-4">
      <h1 class="page-title">Configurações</h1>
      
      <div class="settings-content">
        <div class="settings-section">
          <app-measurement-types></app-measurement-types>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-title {
      font-size: 1.875rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1.5rem;
    }

    .settings-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .settings-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  `]
})
export class SettingsComponent {}
