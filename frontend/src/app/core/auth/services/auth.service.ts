import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { User, Tenant, AuthResponse, LoginRequest } from '../models/auth.model';
import { Router } from '@angular/router';
import { ToastService } from '@core/services/toast.service';
import { environment } from '@environments/environment';

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

  // login original comentado para referência
  /*
  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.isLoading.set(true);

    // Simulação de login sem backend
    if (credentials.password === '123456') {
      const fakeResponse: AuthResponse = {
        user: {
          id: '1',
          name: 'Usuário Demo',
          email: credentials.email,
          role: 'admin'
        },
        tenant: {
          id: '1',
          name: 'Empresa Demo',
          logo: ''
        },
        token: 'fake-jwt-token'
      };

      // Simula um pequeno delay e retorna o usuário fake
      return of(fakeResponse).pipe(
        tap(response => {
          this.setSession(response);
          this.currentUser.set(response.user);
          this.currentTenant.set(response.tenant);
        }),
        tap({
          finalize: () => this.isLoading.set(false)
        })
      );
    } else {
      this.toastService.show({
        title: 'Erro ao fazer login',
        description: 'Credenciais inválidas',
        variant: 'destructive'
      });
      this.isLoading.set(false);
      return throwError(() => new Error('Credenciais inválidas'));
    }
  }
  */

  // Novo método de login fake
  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.isLoading.set(true);

    if (credentials.password === '123456') {
      const fakeResponse: AuthResponse = {
        user: {
          id: '1',
          name: 'Usuário Demo',
          email: credentials.email,
          role: 'admin'
        },
        tenant: {
          id: '1',
          name: 'Empresa Demo',
          logo: ''
        },
        token: 'fake-jwt-token'
      };
      return of(fakeResponse).pipe(
        tap(response => {
          this.setSession(response);
          this.currentUser.set(response.user);
          this.currentTenant.set(response.tenant);
        }),
        tap({
          finalize: () => this.isLoading.set(false)
        })
      );
    } else {
      this.toastService.show({
        title: 'Erro ao fazer login',
        description: 'Credenciais inválidas',
        variant: 'destructive'
      });
      this.isLoading.set(false);
      return throwError(() => new Error('Credenciais inválidas'));
    }
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
