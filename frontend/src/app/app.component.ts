import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '@shared/components/layout/header/header.component';
import { FooterComponent } from '@shared/components/layout/footer/footer.component';
import { ToastContainerComponent } from '@shared/components/ui/toast-container/toast-container.component';
import { UserService } from '@core/services/user.service';
import { CondominiumService } from '@core/services/Condominium.service';
import { UnitService } from '@core/services/Unit.service';
import { MeterService } from '@core/services/Meter.service';
import { MeasurementTypeService } from '@core/services/MeasurementType.service';
import { initializeDatabase } from './database-init';

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
export class AppComponent implements OnInit {  constructor(
    private readonly userService: UserService,
    private readonly condominiumService: CondominiumService,
    private readonly unitService: UnitService,
    private readonly meterService: MeterService,
    private readonly measurementTypeService: MeasurementTypeService
  ) {}
  async ngOnInit() {
    await initializeDatabase(
      this.userService,
      this.condominiumService,
      this.unitService,
      this.meterService,
      this.measurementTypeService
    );
  }

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
