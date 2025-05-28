import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      [type]="type" 
      [disabled]="disabled" 
      [class]="buttonClasses"
      (click)="onClick($event)">
      <span *ngIf="isLoading" class="spinner"></span>
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.375rem;
      font-weight: 500;
      padding: 0.5rem 1rem;
      transition: all 0.2s ease;
      cursor: pointer;
      outline: none;
      border: 1px solid transparent;
    }
    
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .btn-primary {
      background-color: #2563eb;
      color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
      background-color: #1d4ed8;
    }
    
    .btn-secondary {
      background-color: #6b7280;
      color: white;
    }
    
    .btn-secondary:hover:not(:disabled) {
      background-color: #4b5563;
    }
    
    .btn-danger {
      background-color: #dc2626;
      color: white;
    }
    
    .btn-danger:hover:not(:disabled) {
      background-color: #b91c1c;
    }
    
    .btn-outline {
      background-color: transparent;
      border-color: #d1d5db;
      color: #374151;
    }
    
    .btn-outline:hover:not(:disabled) {
      background-color: #f3f4f6;
    }
    
    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
    }
    
    .btn-lg {
      padding: 0.75rem 1.5rem;
      font-size: 1.125rem;
    }
    
    .btn-block {
      width: 100%;
    }
    
    .spinner {
      display: inline-block;
      width: 1rem;
      height: 1rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
      margin-right: 0.5rem;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: 'primary' | 'secondary' | 'danger' | 'outline' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() disabled = false;
  @Input() isLoading = false;
  @Input() block = false;

  get buttonClasses(): string {
    return `btn-${this.variant} btn-${this.size} ${this.block ? 'btn-block' : ''}`;
  }

  onClick(event: Event): void {
    if (this.disabled || this.isLoading) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
