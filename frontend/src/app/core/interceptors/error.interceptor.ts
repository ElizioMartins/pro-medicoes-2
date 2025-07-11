import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let apiError: ApiError;
      if (error.error instanceof ErrorEvent) {
        apiError = {
          message: 'Erro de conexão. Verifique sua internet.',
          code: 'CLIENT_ERROR'
        };
      } else {
        apiError = {
          message: error.error?.message || 'Erro interno do servidor',
          code: error.error?.code || `HTTP_${error.status}`,
          details: error.error?.details
        };
      }
      notificationService.showError(apiError.message);
      return throwError(() => apiError);
    })
  );
};


