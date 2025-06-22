import { Injectable } from '@angular/core';
import { Condominium, CondominiumCreate, CondominiumUpdate } from '../../shared/models/condominium.model';
import { BaseApiService } from './base-api.service';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { PaginatedResponse } from '../../shared/models/api-response.model';
import { Unit } from '../../shared/models/unit.model';

@Injectable({
  providedIn: 'root'
})
export class CondominiumService extends BaseApiService<Condominium, CondominiumCreate, CondominiumUpdate> {
  protected endpoint = '/api/condominiums';

  constructor(http: HttpClient) {
    super(http);
  }

  getUnits(condominiumId: number): Observable<PaginatedResponse<Unit>> {
    return this.http.get<PaginatedResponse<Unit>>(`${this.baseUrl}/${condominiumId}/units`);
  }

  getStatistics(condominiumId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${condominiumId}/statistics`);
  }

  getCondominiumById(condominiumId: number): Observable<Condominium> {
    return this.http.get<Condominium>(`${this.baseUrl}/${condominiumId}`)
      .pipe(
        map(condominium => ({
          ...condominium,
          id: Number(condominiumId) // Garante que o ID é um número
        }))
      );
  }
   createCondominium(condominium: Partial<Condominium>): Observable<Condominium> {
    return this.http.post<Condominium>(this.baseUrl, condominium)
      .pipe(
        map(condominium => ({
          ...condominium,
          id: Number(condominium.id) // Garante que o ID é um número
        }))
      );
  }

  updateCondominium(condominiumId: number, condominium: Partial<Condominium>): Observable<Condominium> {
    return this.http.put<Condominium>(`${this.baseUrl}/${condominiumId}`, condominium)
      .pipe(
        map(condominium => ({
          ...condominium,
          id: Number(condominium.id) // Garante que o ID é um número
        }))
      );
  }

  deleteCondominium(condominiumId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${condominiumId}`);
  }
}


