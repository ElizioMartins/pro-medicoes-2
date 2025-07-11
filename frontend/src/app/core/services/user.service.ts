import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserCreate, UserUpdate, UserLogin } from '../../shared/models/user.model';

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/api/users`;

  constructor(private readonly http: HttpClient) {}

  login(credentials: UserLogin): Observable<LoginResponse> {
    const params = new URLSearchParams();
    params.append('username', credentials.username);
    params.append('password', credentials.password);
    
    return this.http.post<LoginResponse>(`${this.apiUrl}/login?${params.toString()}`, {})
      .pipe(
        tap(response => {
          // Salvar token no localStorage
          if (response.access_token) {
            localStorage.setItem('authToken', response.access_token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  // Métodos para verificar permissões
  canViewAllUsers(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'Admin' || user?.role === 'Manager';
  }

  canEditUsers(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'Admin' || user?.role === 'Manager';
  }

  canDeleteUsers(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'Admin' || user?.role === 'Manager';
  }

  canCreateUsers(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'Admin' || user?.role === 'Manager';
  }

  canEditUser(targetUserId: number): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;

    // Admin e Manager podem editar usuários
    if (currentUser.role === 'Admin' || currentUser.role === 'Manager') {
      return true;
    }

    // Outros usuários podem apenas editar a si mesmos
    return currentUser.id === targetUserId;
  }

  canDeleteUser(): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;

    // Apenas Admin e Manager podem excluir usuários
    return currentUser.role === 'Admin' || currentUser.role === 'Manager';
  }

  getUsers(page = 1, pageSize = 10): Observable<{ users: User[], total: number }> {
    const params = { page: page.toString(), pageSize: pageSize.toString() };
    return this.http.get<{ users: User[], total: number }>(`${this.apiUrl}`, { params });
  }

  searchUsers(
    searchTerm: string, 
    role = 'all', 
    page = 1, 
    pageSize = 10
  ): Observable<{ users: User[], total: number }> {
    const params = { 
      searchTerm, 
      role,
      page: page.toString(),
      pageSize: pageSize.toString()
    };
    return this.http.get<{ users: User[], total: number }>(`${this.apiUrl}/search`, { params });
  }

  createUser(user: UserCreate): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/`, user);
  }

  updateUser(id: number, user: UserUpdate): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }
}
