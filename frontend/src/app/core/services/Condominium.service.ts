import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Condominium } from '../models/Condominium';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CondominiumService {
  private readonly apiUrl = `${environment.apiUrl}/condominiums`;
  constructor(private readonly http: HttpClient) {}

  getCondominiums(): Observable<Condominium[]> {
    return this.http.get<Condominium[]>(this.apiUrl)
      .pipe(
        map(condominiums => condominiums.map(c => ({
          ...c,
          id: Number(c.id) // Garante que o ID é um número
        })))
      );
  }

  getCondominiumById(id: number): Observable<Condominium> {
    return this.http.get<Condominium>(`${this.apiUrl}/${id}`)
      .pipe(
        map(condominium => ({
          ...condominium,
          id: Number(condominium.id) // Garante que o ID é um número
        }))
      );
  }

  createCondominium(condominium: Partial<Condominium>): Observable<Condominium> {
    return this.http.post<Condominium>(this.apiUrl, condominium)
      .pipe(
        map(condominium => ({
          ...condominium,
          id: Number(condominium.id) // Garante que o ID é um número
        }))
      );
  }

  updateCondominium(id: number, condominium: Partial<Condominium>): Observable<Condominium> {
    return this.http.put<Condominium>(`${this.apiUrl}/${id}`, condominium)
      .pipe(
        map(condominium => ({
          ...condominium,
          id: Number(condominium.id) // Garante que o ID é um número
        }))
      );
  }

  deleteCondominium(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
