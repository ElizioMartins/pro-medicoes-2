import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { MeasurementType } from '../models/MeasurementType';

@Injectable({
  providedIn: 'root'
})
export class MeasurementTypeService {
  private readonly mockMeasurementTypes: MeasurementType[] = [
    { id: 1, name: 'Água', unit: 'm³' },
    { id: 2, name: 'Energia', unit: 'kWh' },
    { id: 3, name: 'Gás', unit: 'm³' }
  ];

  constructor() { }

  getMeasurementTypes(): Observable<MeasurementType[]> {
    return of(this.mockMeasurementTypes).pipe(delay(500)); // Simulate network delay
  }

  addMeasurementType(newTypeData: Omit<MeasurementType, 'id'>): Observable<MeasurementType> {
    if (!newTypeData.name || !newTypeData.unit) {
      return throwError(() => new Error('Nome e unidade são obrigatórios.'));
    }
    const newId = Math.max(...this.mockMeasurementTypes.map(t => t.id)) + 1;
    const newMeasurementType: MeasurementType = { 
      ...newTypeData, 
      id: newId
    };
    this.mockMeasurementTypes.push(newMeasurementType);
    return of(newMeasurementType).pipe(delay(300)); // Simulate network delay
  }

  getMeasurementTypeById(id: number): Observable<MeasurementType | undefined> {
    const type = this.mockMeasurementTypes.find(t => t.id === id);
    return of(type).pipe(delay(300));
  }

  updateMeasurementType(id: number, typeData: Partial<MeasurementType>): Observable<MeasurementType> {
    const index = this.mockMeasurementTypes.findIndex(t => t.id === id);
    if (index === -1) {
      return throwError(() => new Error('Tipo de medição não encontrado.'));
    }
    this.mockMeasurementTypes[index] = {
      ...this.mockMeasurementTypes[index],
      ...typeData
    };
    return of(this.mockMeasurementTypes[index]).pipe(delay(300));
  }

  deleteMeasurementType(id: number): Observable<boolean> {
    const index = this.mockMeasurementTypes.findIndex(t => t.id === id);
    if (index === -1) {
      return of(false).pipe(delay(300));
    }
    this.mockMeasurementTypes.splice(index, 1);
    return of(true).pipe(delay(300));
  }
}
