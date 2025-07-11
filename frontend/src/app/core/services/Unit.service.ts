import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Unit, UnitCreate, UnitUpdate } from '@app/shared/models/unit.model';

interface UnitListResponse {
  units: Unit[];
  total: number;
  skip: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class UnitService {
  private readonly apiUrl = `${environment.apiUrl}/api`;

  constructor(private readonly http: HttpClient) {}

  getUnits(condominiumId: number, skip = 0, limit = 100): Observable<UnitListResponse> {
    return this.http.get<UnitListResponse>(`${this.apiUrl}/condominiums/${condominiumId}/units?skip=${skip}&limit=${limit}`);
  }

  getUnitById(unitId: number): Observable<Unit> {
    return this.http.get<Unit>(`${this.apiUrl}/units/${unitId}`);
  }

  createUnit(condominiumId: number, unit: UnitCreate): Observable<Unit> {
    return this.http.post<Unit>(`${this.apiUrl}/condominiums/${condominiumId}/units`, unit);
  }

  updateUnit(condominiumId: number, unitId: number, unit: UnitUpdate): Observable<Unit> {
    return this.http.put<Unit>(`${this.apiUrl}/condominiums/${condominiumId}/units/${unitId}`, unit);
  }

  deleteUnit(condominiumId: number, unitId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/condominiums/${condominiumId}/units/${unitId}`);
  }
}
