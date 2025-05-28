import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ResponsiveService {
  // Usando signals para estado reativo moderno
  private isMobileState = signal<boolean>(false);
  
  // Getter para acessar o signal como readonly
  get isMobile() {
    return this.isMobileState();
  }

  constructor() {
    // Verifica o tamanho da tela inicial
    this.checkScreenSize();
    
    // Configura o listener de redimensionamento
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.checkScreenSize());
    }
    
    // Usando effect para logar mudanças no estado de responsividade (útil para debugging)
    effect(() => {
      console.debug(`Responsive state changed: isMobile = ${this.isMobileState()}`);
    });
  }

  private checkScreenSize(): void {
    const isMobile = window.innerWidth < 768;
    this.isMobileState.set(isMobile);
  }
}
