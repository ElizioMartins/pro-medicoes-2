import { CommonModule } from '@angular/common';
import { HeaderComponent } from '@shared/components/layout/header/header.component';
import { FooterComponent } from '@shared/components/layout/footer/footer.component';
import { ToastContainerComponent } from '@shared/components/ui/toast-container/toast-container.component';
import { UserService } from '@core/services/user.service';
import { UnitService } from '@core/services/unit.service';
import { MeasurementTypeService } from '@core/services/measurementtype.service';
import { CondominiumService } from './core/services/condominium.service';
import { MeterService } from './core/services/meter.service';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    ToastContainerComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent  {  
  private readonly userService = inject(UserService);
  private readonly condominiumService = inject(CondominiumService);
  private readonly unitService = inject(UnitService);
  private readonly meterService = inject(MeterService);
  private readonly measurementTypeService = inject(MeasurementTypeService);
  

  shouldShowHeader(): boolean {
    // Lógica para determinar quando mostrar o header
    // Pode ser expandida para verificar rotas específicas
    return true;
  }

  shouldShowFooter(): boolean {
    // Lógica para determinar quando mostrar o footer
    // Pode ser expandida para verificar rotas específicas
    return true;
  }
}
