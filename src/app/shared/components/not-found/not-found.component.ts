import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-units',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="units-container">
      <h1>Unidades</h1>
      <p>Esta página está em desenvolvimento.</p>
    </div>
  `,
  styles: [`
    .units-container {
      padding: 1.5rem;
    }
  `]
})
export class UnitsComponent {
}
