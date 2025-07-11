import { Injectable } from '@angular/core';
import { Meter, MeterCreate, MeterUpdate } from '../../shared/models/meter.model';
import { BaseApiService } from './base-api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedResponse, ApiResponse } from '../../shared/models/api-response.model';
import { Reading } from '../../shared/models/reading.model';

@Injectable({
  providedIn: 'root'
})
export class MeterService extends BaseApiService<Meter, MeterCreate, MeterUpdate> {
  protected endpoint = '/api/meters';

  constructor(http: HttpClient) {
    super(http);
  }

  getMeters(): Observable<Meter[]> {
    return this.http.get<Meter[]>('/api/meters');
  }

  getByUnit(unitId: number): Observable<PaginatedResponse<Meter>> {
    return this.http.get<PaginatedResponse<Meter>>(`${this.baseUrl}/unit/${unitId}`);
  }

  getReadingsHistory(meterId: number, limit: number = 10): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${meterId}/readings-history?limit=${limit}`);
  }

  getStatistics(meterId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${meterId}/statistics`);
  }
}

