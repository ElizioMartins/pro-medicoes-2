import { Injectable, signal } from '@angular/core';

export interface NotificationProps {
  id?: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'destructive' | 'warning';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private toasts = signal<NotificationProps[]>([]);
  
  get currentToasts() {
    return this.toasts();
  }

  private show(toast: NotificationProps): void {
    const id = crypto.randomUUID();
    const newToast = {
      id,
      ...toast,
      variant: toast.variant || 'default',
      duration: toast.duration || 5000
    };
    
    this.toasts.update(current => [...current, newToast]);
    
    setTimeout(() => {
      this.dismiss(id);
    }, newToast.duration);
  }

  showSuccess(message: string, title: string = 'Sucesso'): void {
    this.show({ title, description: message, variant: 'success' });
  }

  showError(message: string, title: string = 'Erro'): void {
    this.show({ title, description: message, variant: 'destructive' });
  }

  showWarning(message: string, title: string = 'Atenção'): void {
    this.show({ title, description: message, variant: 'warning' });
  }

  dismiss(id: string): void {
    this.toasts.update(current => current.filter(toast => toast.id !== id));
  }
}


