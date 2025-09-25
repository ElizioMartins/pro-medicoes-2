import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChartData {
  label: string;
  value: number;
  percentage: number;
  color?: string;
}

@Component({
  selector: 'app-simple-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <div class="chart-header" *ngIf="title">
        <h3>{{ title }}</h3>
      </div>
      <div class="chart-bars">
        <div class="chart-item" *ngFor="let item of data; index as i">
          <div class="chart-label">{{ item.label }}</div>
          <div class="chart-bar-container">
            <div 
              class="chart-bar" 
              [style.width.%]="item.percentage"
              [style.background-color]="item.color || getColor(i)">
            </div>
            <span class="chart-value">{{ item.value }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chart-container {
      width: 100%;
    }

    .chart-header {
      margin-bottom: 1rem;
    }

    .chart-header h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #374151;
    }

    .chart-bars {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .chart-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .chart-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .chart-bar-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      height: 24px;
    }

    .chart-bar {
      height: 100%;
      border-radius: 4px;
      min-width: 2px;
      transition: width 0.3s ease;
    }

    .chart-value {
      font-size: 0.875rem;
      font-weight: 500;
      color: #6b7280;
      min-width: 40px;
    }
  `]
})
export class SimpleChartComponent {
  @Input() data: ChartData[] = [];
  @Input() title?: string;

  private colors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
  ];

  getColor(index: number): string {
    return this.colors[index % this.colors.length];
  }
}