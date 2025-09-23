import { Meter, MeterCreate } from '../../shared/models/meter.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedResponse,ApiResponse} from '../../shared/models/api-response.model';
import { Reading } from '../../shared/models/reading.model';
import { environment } from '@environments/environment';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MeterService {
  /**
   * Busca um medidor pelo ID
   */
  getMeterById(meter_id: number): Observable<Meter> {
    return this.http.get<Meter>(`${this.apiUrl}/${meter_id}`);
  }
  /**
   * Cria um novo medidor
   */
  private readonly apiUrl = `${environment.apiUrl}/api/meters`;
  
 
 private readonly http = inject(HttpClient);
  
  createMeter(meter: MeterCreate): Observable<ApiResponse<Meter>> {
    return this.http.post<ApiResponse<Meter>>(`${this.apiUrl}`, meter);
  }
  getMeters(meter_id: number): Observable<Meter[]> {
    return this.http.get<Meter[]>(`${this.apiUrl}/${meter_id}`);
  }

  getByUnit(unitId: number): Observable<PaginatedResponse<Meter>> {
    return this.http.get<PaginatedResponse<Meter>>(`${this.apiUrl}/unit/${unitId}`);
  }

  getReadingsHistory(meter_id: number, limit = 10): Observable<Reading[]> {
    return this.http.get<Reading[]>(`${this.apiUrl}/${meter_id}/readings-history?limit=${limit}`);
  }

  getStatistics(meter_id: number): Observable<Meter> {
    return this.http.get<Meter>(`${this.apiUrl}/${meter_id}/statistics`);
  }

  updateMeter(meter_id: number, meter: MeterCreate): Observable<Meter> {
    return this.http.put<Meter>(`${this.apiUrl}/${meter_id}`, meter);
  }

  deleteMeter(meter_id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${meter_id}`);
  }
}

