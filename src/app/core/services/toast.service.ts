import { Injectable, signal } from '@angular/core';

export interface ToastProps {
  id?: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'destructive' | 'warning';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  // Usando signals para estado reativo moderno
  private toasts = signal<ToastProps[]>([]);
  
  // Getter para acessar o signal como readonly
  get currentToasts() {
    return this.toasts();
  }

  show(toast: ToastProps): void {
    const id = crypto.randomUUID();
    const newToast = {
      id,
      ...toast,
      variant: toast.variant || 'default',
      duration: toast.duration || 5000
    };
    
    // Atualiza o signal com um novo array contendo o toast adicional
    this.toasts.update(current => [...current, newToast]);
    
    // Remove o toast após a duração especificada
    setTimeout(() => {
      this.dismiss(id);
    }, newToast.duration);
  }

  dismiss(id: string): void {
    // Atualiza o signal removendo o toast com o ID especificado
    this.toasts.update(current => current.filter(toast => toast.id !== id));
  }
}
