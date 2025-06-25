import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Unit } from '@app/shared/models/unit.model';

@Injectable({
  providedIn: 'root'
})
export class UnitService {
  private readonly apiUrl = `${environment.apiUrl}/condominiums`;

  constructor(private readonly http: HttpClient) {}

  getUnits(condominiumId: number): Observable<Unit[]> {
    return this.http.get<Unit[]>(`${this.apiUrl}/${condominiumId}/units`)
      .pipe(
        map(units => units.map(unit => ({
          ...unit,
          id: Number(unit.id),
          lastReading: unit.lastReading ? new Date(unit.lastReading) : null,
          createdAt: unit.createdAt ? new Date(unit.createdAt) : undefined,
          updatedAt: unit.updatedAt ? new Date(unit.updatedAt) : undefined
        })))
      );
  }

  getUnitById(condominiumId: number, unitId: number): Observable<Unit> {
    return this.http.get<Unit>(`${this.apiUrl}/${condominiumId}/units/${unitId}`)
      .pipe(
        map(unit => ({
          ...unit,
          id: Number(unit.id),
          lastReading: unit.lastReading ? new Date(unit.lastReading) : null,
          createdAt: unit.createdAt ? new Date(unit.createdAt) : undefined,
          updatedAt: unit.updatedAt ? new Date(unit.updatedAt) : undefined
        }))
      );
  }

  createUnit(condominiumId: number, unit: Partial<Unit>): Observable<Unit> {
    return this.http.post<Unit>(`${this.apiUrl}/${condominiumId}/units`, unit)
      .pipe(
        map(unit => ({
          ...unit,
          id: Number(unit.id),
          lastReading: unit.lastReading ? new Date(unit.lastReading) : null,
          createdAt: unit.createdAt ? new Date(unit.createdAt) : undefined,
          updatedAt: unit.updatedAt ? new Date(unit.updatedAt) : undefined
        }))
      );
  }

  updateUnit(condominiumId: number, unitId: number, unit: Partial<Unit>): Observable<Unit> {
    return this.http.put<Unit>(`${this.apiUrl}/${condominiumId}/units/${unitId}`, unit)
      .pipe(
        map(unit => ({
          ...unit,
          id: Number(unit.id),
          lastReading: unit.lastReading ? new Date(unit.lastReading) : null,
          createdAt: unit.createdAt ? new Date(unit.createdAt) : undefined,
          updatedAt: unit.updatedAt ? new Date(unit.updatedAt) : undefined
        }))
      );
  }

  deleteUnit(condominiumId: number, unitId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${condominiumId}/units/${unitId}`);
  }
}
