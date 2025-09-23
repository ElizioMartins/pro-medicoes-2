import { CommonModule } from '@angular/common';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { AuthService } from '@core/services/auth.service';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  // Dados simulados para demonstração
  condominiumsCount = 12;
  unitsCount = 248;
  readingsCount = 1543;
  usersCount = 35;
  
  recentReadings = [
    { unit: 'Apto 101', type: 'Água', value: '12.5 m³', date: new Date(2025, 4, 25) },
    { unit: 'Apto 203', type: 'Energia', value: '145 kWh', date: new Date(2025, 4, 24) },
    { unit: 'Apto 305', type: 'Gás', value: '22.3 m³', date: new Date(2025, 4, 23) },
    { unit: 'Apto 402', type: 'Água', value: '18.7 m³', date: new Date(2025, 4, 22) },
    { unit: 'Apto 501', type: 'Energia', value: '210 kWh', date: new Date(2025, 4, 21) }
  ];
  
  private router = inject(Router);
  private authService = inject(AuthService);

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
