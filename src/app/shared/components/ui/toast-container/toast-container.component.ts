import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toastService.currentToasts" 
           class="toast" 
           [class]="'toast-' + toast.variant">
        <div class="toast-header">
          <h4 class="toast-title">{{ toast.title }}</h4>
          <button class="toast-close" (click)="dismissToast(toast.id!)">×</button>
        </div>
        <div *ngIf="toast.description" class="toast-body">
          {{ toast.description }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      z-index: 1000;
      max-width: 350px;
    }
    
    .toast {
      padding: 1rem;
      border-radius: 0.375rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      animation: slideIn 0.3s ease-out;
    }
    
    .toast-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    
    .toast-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
    }
    
    .toast-close {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }
    
    .toast-body {
      font-size: 0.875rem;
    }
    
    .toast-default {
      background-color: white;
      border-left: 4px solid #6b7280;
      color: #1f2937;
    }
    
    .toast-success {
      background-color: #ecfdf5;
      border-left: 4px solid #10b981;
      color: #064e3b;
    }
    
    .toast-destructive {
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
      color: #7f1d1d;
    }
    
    .toast-warning {
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
      color: #78350f;
    }
    
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class ToastContainerComponent {
  constructor(public toastService: ToastService) {}
  
  dismissToast(id: string): void {
    this.toastService.dismiss(id);
  }
}
