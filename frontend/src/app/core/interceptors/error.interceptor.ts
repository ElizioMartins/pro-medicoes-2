import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private notificationService: NotificationService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let apiError: ApiError;

        if (error.error instanceof ErrorEvent) {
          // Erro do lado do cliente
          apiError = {
            message: 'Erro de conexão. Verifique sua internet.',
            code: 'CLIENT_ERROR'
          };
        } else {
          // Erro do lado do servidor
          apiError = {
            message: error.error?.message || 'Erro interno do servidor',
            code: error.error?.code || `HTTP_${error.status}`,
            details: error.error?.details
          };
        }

        this.notificationService.showError(apiError.message);
        return throwError(() => apiError);
      })
    );
  }
}


