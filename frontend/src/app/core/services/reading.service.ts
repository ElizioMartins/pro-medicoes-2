import { Injectable } from '@angular/core';
import { Reading, ReadingCreate, ReadingUpdate } from '../../shared/models/reading.model';
import { BaseApiService } from './base-api.service';
import { Observable } from 'rxjs';
import { DetectionResponse } from '../../shared/models/detection.model';
import { PaginatedResponse, ApiResponse } from '../../shared/models/api-response.model';
import { ReadingPhoto } from '../../shared/models/reading-photo.model';
import { environment } from '@environments/environment';

export interface PhotoUploadResponse {
  data: {
    id: number;
    reading_id: number;
    file_path: string;
    cropped_file_path?: string;
    is_cropped: boolean;
    created_at: string;
  };
  message: string;
  main_file: string;
  cropped_file?: string;
  detection?: {
    number_detected: string;
    confidence: number;
    box: [number, number, number, number];
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReadingService extends BaseApiService<Reading, ReadingCreate, ReadingUpdate> {
  protected endpoint = '/api/readings';

  getReadingsFiltered(params: {
    meter_id?: number;
    condominium_id?: number;
    unit_id?: number;
    measurement_type_id?: number;
    reference_month?: string;
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

  override create(reading: ReadingCreate): Observable<ApiResponse<Reading>> {
    console.log('[DEBUG] Creating reading for meter:', reading.meter_id);
    // Usar a URL correta no router de readings
    return this.http.post<ApiResponse<Reading>>(`${environment.apiUrl}/api/readings/meters/${reading.meter_id}/readings`, reading);
  }

  detectFromImage(file: File, meterId?: number): Observable<DetectionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (meterId) {
      formData.append('meter_id', meterId.toString());
    }
    return this.http.post<DetectionResponse>('/api/detect', formData);
  }

  getByMeter(meterId: number, params?: Record<string, string | number>): Observable<PaginatedResponse<Reading>> {
    return this.http.get<PaginatedResponse<Reading>>(`${environment.apiUrl}/api/readings/meters/${meterId}/readings`, { params });
  }

  uploadPhoto(readingId: number, file: File): Observable<ApiResponse<ReadingPhoto>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<ReadingPhoto>>(`${environment.apiUrl}/api/readings/${readingId}/photos/upload`, formData);
  }

  getReadingById(id: number): Observable<Reading> {
    return this.http.get<Reading>(`${this.baseUrl}/${id}`);
  }

  updateReading(id: number, reading: Partial<Reading>): Observable<ApiResponse<Reading>> {
    return this.http.put<ApiResponse<Reading>>(`${this.baseUrl}/${id}`, reading);
  }

  saveReadingPhoto(readingId: number, photoData: FormData): Observable<PhotoUploadResponse> {
    return this.http.post<PhotoUploadResponse>(`${environment.apiUrl}/api/readings/${readingId}/photos/upload`, photoData);
  }

  override getAll(): Observable<PaginatedResponse<Reading>> {
    return this.http.get<PaginatedResponse<Reading>>(`${this.baseUrl}`);
  }

  getAllReadings(): Observable<Reading[]> {
    return this.http.get<Reading[]>(`${this.baseUrl}/all`);
  }
}


