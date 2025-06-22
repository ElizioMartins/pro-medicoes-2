import { Injectable } from '@angular/core';
import { Condominium, CondominiumCreate, CondominiumUpdate } from '../../shared/models/condominium.model';
import { BaseApiService } from './base-api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
}


