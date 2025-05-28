import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { User, Tenant, AuthResponse, LoginRequest } from '../models/auth.model';
import { environment } from '@environments/environment';
import { Router } from '@angular/router';
import { ToastService } from '@core/services/toast.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Usando signals para estado reativo moderno
  private currentUser = signal<User | null>(null);
  private currentTenant = signal<Tenant | null>(null);
  private isLoading = signal<boolean>(false);

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastService: ToastService
  ) {}

  // Getters para acessar os signals
  get user() {
    return this.currentUser();
  }

  get tenant() {
    return this.currentTenant();
  }

  get loading() {
    return this.isLoading();
  }

  get isAuthenticated(): boolean {
    return !!this.currentUser();
  }

  // Método para inicializar a autenticação (chamado no APP_INITIALIZER)
  initializeAuth(): Promise<boolean> {
    return new Promise((resolve) => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        resolve(false);
        return;
      }
      
      this.isLoading.set(true);
      
      this.http.get<AuthResponse>(`${environment.apiUrl}/auth/me`)
        .pipe(
          tap(response => {
            this.currentUser.set(response.user);
            this.currentTenant.set(response.tenant);
          }),
          catchError(() => {
            this.clearSession();
            return of(null);
          })
        )
        .subscribe({
          next: () => {
            this.isLoading.set(false);
            resolve(true);
          },
          error: () => {
            this.isLoading.set(false);
            resolve(false);
          }
        });
    });
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.isLoading.set(true);
    
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          this.setSession(response);
          this.currentUser.set(response.user);
          this.currentTenant.set(response.tenant);
        }),
        catchError(error => {
          this.toastService.show({
            title: 'Erro ao fazer login',
            description: error.error?.message || 'Credenciais inválidas',
            variant: 'destructive'
          });
          return throwError(() => new Error(error.error?.message || 'Credenciais inválidas'));
        }),
        tap({
          finalize: () => this.isLoading.set(false)
        })
      );
  }

  logout(): Observable<void> {
    this.isLoading.set(true);
    
    return this.http.post<void>(`${environment.apiUrl}/auth/logout`, {})
      .pipe(
        tap(() => {
          this.clearSession();
          this.router.navigate(['/auth/login']);
        }),
        catchError(error => {
          // Even if the API call fails, we still want to clear the local session
          this.clearSession();
          this.router.navigate(['/auth/login']);
          
          this.toastService.show({
            title: 'Erro ao fazer logout',
            description: 'Não foi possível completar o logout no servidor',
            variant: 'warning'
          });
          
          return throwError(() => new Error(error.error?.message || 'Não foi possível completar o logout'));
        }),
        tap({
          finalize: () => this.isLoading.set(false)
        })
      );
  }

  private setSession(authResult: AuthResponse): void {
    localStorage.setItem('token', authResult.token);
  }

  private clearSession(): void {
    localStorage.removeItem('token');
    this.currentUser.set(null);
    this.currentTenant.set(null);
  }
}
