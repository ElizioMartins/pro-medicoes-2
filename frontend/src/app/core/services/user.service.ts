import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '@app/shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private readonly http: HttpClient) {}

  getUsers(page: number = 1, pageSize: number = 10): Observable<{ users: User[], total: number }> {
    const params = { page: page.toString(), pageSize: pageSize.toString() };
    return this.http.get<{ users: User[], total: number }>(`${this.apiUrl}`, { params });
  }  searchUsers(
    searchTerm: string, 
    role: string = 'all', 
    page: number = 1, 
    pageSize: number = 10
  ): Observable<{ users: User[], total: number }> {
    const params = { 
      searchTerm, 
      role,
      page: page.toString(),
      pageSize: pageSize.toString()
    };
    return this.http.get<{ users: User[], total: number }>(`${this.apiUrl}/search`, { params });
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}`, user);
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }
}
