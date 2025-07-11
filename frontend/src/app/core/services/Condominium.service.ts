import { Injectable } from '@angular/core';
import { Condominium, CondominiumCreate, CondominiumUpdate } from '../../shared/models/condominium.model';
import { BaseApiService } from './base-api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '../../shared/models/api-response.model';
import { Unit } from '../../shared/models/unit.model';
import { environment } from '../../../environments/environment';

interface CondominiumStatistics {
  unitsCount: number;
  metersCount: number;
  readingsCount: number;
  reportsCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class CondominiumService extends BaseApiService<Condominium, CondominiumCreate, CondominiumUpdate> {
  protected endpoint = '/api/condominiums';
  private readonly apiUrl = `${environment.apiUrl}/api/condominiums`;

  constructor(http: HttpClient) {
    super(http);
  }

  // Método para listar condomínios com paginação e filtros
  getCondominiums(skip = 0, limit = 100, search?: string): Observable<{condominiums: Condominium[], total: number, skip: number, limit: number}> {
    const params: Record<string, string> = { skip: skip.toString(), limit: limit.toString() };
    if (search) {
      params['search'] = search;
    }
    return this.http.get<{condominiums: Condominium[], total: number, skip: number, limit: number}>(this.apiUrl, { params });
  }

  // Método para buscar condomínio por ID
  getCondominiumById(condominiumId: number): Observable<Condominium> {
    return this.http.get<Condominium>(`${this.apiUrl}/${condominiumId}`);
  }

  // Método para criar condomínio
  createCondominium(condominium: CondominiumCreate): Observable<Condominium> {
    return this.http.post<Condominium>(this.apiUrl, condominium);
  }

  // Método para atualizar condomínio
  updateCondominium(condominiumId: number, condominium: CondominiumUpdate): Observable<Condominium> {
    return this.http.put<Condominium>(`${this.apiUrl}/${condominiumId}`, condominium);
  }

  // Método para excluir condomínio
  deleteCondominium(condominiumId: number): Observable<{message: string}> {
    return this.http.delete<{message: string}>(`${this.apiUrl}/${condominiumId}`);
  }

  // Método para obter unidades de um condomínio
  getUnits(condominiumId: number): Observable<PaginatedResponse<Unit>> {
    return this.http.get<PaginatedResponse<Unit>>(`${this.apiUrl}/${condominiumId}/units`);
  }

  // Método para obter estatísticas de um condomínio
  getStatistics(condominiumId: number): Observable<CondominiumStatistics> {
    return this.http.get<CondominiumStatistics>(`${this.apiUrl}/${condominiumId}/statistics`);
  }
}


