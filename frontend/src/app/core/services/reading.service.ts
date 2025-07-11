import { Injectable } from '@angular/core';
import { Reading, ReadingCreate, ReadingUpdate } from '../../shared/models/reading.model';
import { BaseApiService } from './base-api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DetectionResponse } from '../../shared/models/detection.model';
import { PaginatedResponse, ApiResponse } from '../../shared/models/api-response.model';
import { ReadingPhoto } from '../../shared/models/reading-photo.model';

@Injectable({
  providedIn: 'root'
})
export class ReadingService extends BaseApiService<Reading, ReadingCreate, ReadingUpdate> {
  protected endpoint = '/api/readings';

  constructor(http: HttpClient) {
    super(http);
  }

  detectFromImage(file: File, meterId?: number): Observable<DetectionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (meterId) {
      formData.append('meter_id', meterId.toString());
    }
    return this.http.post<DetectionResponse>('/api/detect', formData);
  }

  getByMeter(meterId: number, params?: any): Observable<PaginatedResponse<Reading>> {
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


