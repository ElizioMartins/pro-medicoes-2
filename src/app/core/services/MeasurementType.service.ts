import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { MeasurementType } from '../models/MeasurementType';

@Injectable({
  providedIn: 'root'
})
export class MeasurementTypeService {
  private mockMeasurementTypes: MeasurementType[] = [
    { id: '1', name: 'Água', unit: 'm³' },
    { id: '2', name: 'Energia', unit: 'kWh' },
    { id: '3', name: 'Gás', unit: 'm³' }
  ];

  constructor() { }

  getMeasurementTypes(): Observable<MeasurementType[]> {
    return of(this.mockMeasurementTypes).pipe(delay(500)); // Simulate network delay
  }

  addMeasurementType(newTypeData: Omit<MeasurementType, 'id'>): Observable<MeasurementType> {
    if (!newTypeData.name || !newTypeData.unit) {
      return throwError(() => new Error('Nome e unidade são obrigatórios.'));
    }
    const newId = (this.mockMeasurementTypes.length + 1).toString();
    const newMeasurementType: MeasurementType = { ...newTypeData, id: newId };
    this.mockMeasurementTypes.push(newMeasurementType);
    return of(newMeasurementType).pipe(delay(300)); // Simulate network delay
  }
}
