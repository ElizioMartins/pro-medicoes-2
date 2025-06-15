import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../../shared/models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export abstract class BaseApiService<T, TCreate, TUpdate> {
  protected abstract endpoint: string;

  constructor(protected http: HttpClient) {}

  protected get baseUrl(): string {
    return `${environment.apiUrl}${this.endpoint}`;
  }

  getAll(params?: any): Observable<PaginatedResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get<PaginatedResponse<T>>(this.baseUrl, { params: httpParams });
  }

  getById(id: number): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/${id}`);
  }

  create(item: TCreate): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(this.baseUrl, item);
  }

  update(id: number, item: TUpdate): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}/${id}`, item);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}


