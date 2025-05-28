import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-measurement-types',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="measurement-types-container">
      <h1>Tipos de Medição</h1>
      <p>Esta página está em desenvolvimento.</p>
    </div>
  `,
  styles: [`
    .measurement-types-container {
      padding: 1.5rem;
    }
  `]
})
export class MeasurementTypesComponent {
}
