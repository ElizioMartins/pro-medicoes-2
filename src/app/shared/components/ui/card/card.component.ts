import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card" [class.elevated]="elevated">
      <div *ngIf="title || subtitle" class="card-header">
        <h3 *ngIf="title" class="card-title">{{ title }}</h3>
        <p *ngIf="subtitle" class="card-subtitle">{{ subtitle }}</p>
      </div>
      <div class="card-content">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .card {
      background-color: white;
      border-radius: 0.5rem;
      border: 1px solid #e5e7eb;
      overflow: hidden;
    }
    
    .card.elevated {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    .card-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .card-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
    }
    
    .card-subtitle {
      margin: 0.25rem 0 0;
      font-size: 0.875rem;
      color: #6b7280;
    }
    
    .card-content {
      padding: 1.5rem;
    }
  `]
})
export class CardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() elevated = false;
}
