import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MeasurementType {
  id: number;
  name: string;
  unit: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MeasurementTypeCreate {
  name: string;
  unit: string;
  active?: boolean;
}

export interface MeasurementTypeUpdate {
  name?: string;
  unit?: string;
  active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MeasurementTypeService {
  private readonly apiUrl = `${environment.apiUrl}/api/measurement-types`;

  constructor(private readonly http: HttpClient) {}

  getMeasurementTypes(): Observable<MeasurementType[]> {
    return this.http.get<MeasurementType[]>(this.apiUrl);
  }

  getMeasurementTypeById(id: number): Observable<MeasurementType> {
    return this.http.get<MeasurementType>(`${this.apiUrl}/${id}`);
  }

  createMeasurementType(measurementType: MeasurementTypeCreate): Observable<MeasurementType> {
    return this.http.post<MeasurementType>(this.apiUrl, measurementType);
  }

  updateMeasurementType(id: number, measurementType: MeasurementTypeUpdate): Observable<MeasurementType> {
    return this.http.put<MeasurementType>(`${this.apiUrl}/${id}`, measurementType);
  }

  deleteMeasurementType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
