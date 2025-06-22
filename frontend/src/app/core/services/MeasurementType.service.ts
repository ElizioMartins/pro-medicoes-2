import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { MeasurementType } from '@app/shared/models/measurement-type.model';

@Injectable({
  providedIn: 'root'
})
export class MeasurementTypeService {
  private readonly baseUrl = `${environment.apiUrl}/measurement-types`;

  constructor(private http: HttpClient) { }

  getMeasurementTypes(): Observable<MeasurementType[]> {
    return this.http.get<MeasurementType[]>(this.baseUrl).pipe(
      catchError(error => {
        console.error('Erro ao buscar tipos de medição:', error);
        return throwError(() => error);
      })
    );
  }

  addMeasurementType(newTypeData: Omit<MeasurementType, 'id'>): Observable<MeasurementType> {
    if (!newTypeData.name || !newTypeData.unit) {
      return throwError(() => new Error('Nome e unidade são obrigatórios.'));
    }
    return this.http.post<MeasurementType>(this.baseUrl, newTypeData).pipe(
      catchError(error => {
        console.error('Erro ao adicionar tipo de medição:', error);
        return throwError(() => error);
      })
    );
  }

  getMeasurementTypeById(id: number): Observable<MeasurementType> {
    return this.http.get<MeasurementType>(`${this.baseUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Erro ao buscar tipo de medição:', error);
        return throwError(() => error);
      })
    );
  }

  updateMeasurementType(id: number, typeData: Partial<MeasurementType>): Observable<MeasurementType> {
    return this.http.put<MeasurementType>(`${this.baseUrl}/${id}`, typeData).pipe(
      catchError(error => {
        console.error('Erro ao atualizar tipo de medição:', error);
        return throwError(() => error);
      })
    );
  }

  deleteMeasurementType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Erro ao excluir tipo de medição:', error);
        return throwError(() => error);
      })
    );
  }
}
