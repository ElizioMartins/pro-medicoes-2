import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Reading } from '../models/Reading';

@Injectable({
  providedIn: 'root'
})
export class ReadingService {

  constructor() { }

  getReadings(): Observable<Reading[]> {
    // Mock data for now, replace with actual API call
    const mockReadings: Reading[] = [
      {
        id: '1',
        condominiumId: '1',
        unit: 'Apto 101',
        measurementTypeId: '1',
        value: '12.5 m³',
        date: new Date(2025, 4, 25),
        registeredBy: 'João Silva',
        condominiumName: 'Residencial Parque das Flores',
        measurementTypeName: 'Água'
      },
      {
        id: '2',
        condominiumId: '1',
        unit: 'Apto 203',
        measurementTypeId: '2',
        value: '145 kWh',
        date: new Date(2025, 4, 24),
        registeredBy: 'Maria Santos',
        condominiumName: 'Residencial Parque das Flores',
        measurementTypeName: 'Energia'
      }
    ];
    return of(mockReadings);
  }
}
