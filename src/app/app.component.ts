import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './shared/components/layout/header/header.component';
import { FooterComponent } from './shared/components/layout/footer/footer.component';
import { ToastContainerComponent } from './shared/components/ui/toast-container/toast-container.component';

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
export class AppComponent {
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
