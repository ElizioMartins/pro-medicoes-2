import { Reading, ReadingCreate, ReadingUpdate } from '../../shared/models/reading.model';
import { BaseApiService } from './base-api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DetectionResponse } from '../../shared/models/detection.model';
import { PaginatedResponse, ApiResponse } from '../../shared/models/api-response.model';
import { ReadingPhoto } from '../../shared/models/reading-photo.model';
import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReadingService extends BaseApiService<Reading, ReadingCreate, ReadingUpdate> {
  protected endpoint = '/api/readings';

  override readonly http = inject(HttpClient);
  constructor() {
    super(inject(HttpClient));
  }

  getReadingsFiltered(params: {
    meter_id?: number;
    condominium_id?: number;
    unit_id?: number;
    measurement_type_id?: number;
    skip?: number;
    limit?: number;
  }): Observable<Reading[]> {
    // Remove parâmetros undefined/null e converte para string apenas valores válidos
    const cleanParams: Record<string, string> = {};
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== 0) {
        cleanParams[key] = value.toString();
      }
    });
    
    console.log('[DEBUG] Parâmetros enviados para API:', cleanParams);
    console.log('[DEBUG] URL completa:', this.baseUrl);
    
    return this.http.get<Reading[]>(this.baseUrl, { params: cleanParams });
  }

  detectFromImage(file: File, meterId?: number): Observable<DetectionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (meterId) {
      formData.append('meter_id', meterId.toString());
    }
    return this.http.post<DetectionResponse>('/api/detect', formData);
  }

  override create(reading: ReadingCreate): Observable<ApiResponse<Reading>> {
    // Use URL absoluta temporariamente para debug
    console.log('[DEBUG] Creating reading with URL: http://localhost:8000/api/meters/' + reading.meter_id + '/readings');
    return this.http.post<ApiResponse<Reading>>(`http://localhost:8000/api/meters/${reading.meter_id}/readings`, reading);
  }

  getByMeter(meterId: number, params?: Record<string, string | number>): Observable<PaginatedResponse<Reading>> {
    return this.http.get<PaginatedResponse<Reading>>(`/api/meters/${meterId}/readings`, { params });
  }

  uploadPhoto(readingId: number, file: File): Observable<ApiResponse<ReadingPhoto>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<ReadingPhoto>>(`${this.baseUrl}/${readingId}/photos`, formData);
  }

  getReadingById(id: number): Observable<Reading> {
    return this.http.get<Reading>(`${this.baseUrl}/${id}`);
  }

  updateReading(id: number, reading: Partial<Reading>): Observable<ApiResponse<Reading>> {
    return this.http.put<ApiResponse<Reading>>(`${this.baseUrl}/${id}`, reading);
  }

  saveReadingPhoto(readingId: number, photoData: FormData): Observable<ApiResponse<ReadingPhoto>> {
    return this.http.post<ApiResponse<ReadingPhoto>>(`${this.baseUrl}/${readingId}/photos`, photoData);
  }

  override getAll(): Observable<PaginatedResponse<Reading>> {
    return this.http.get<PaginatedResponse<Reading>>(`${this.baseUrl}`);
  }

  getAllReadings(): Observable<Reading[]> {
    return this.http.get<Reading[]>(`${this.baseUrl}/all`);
  }
}


