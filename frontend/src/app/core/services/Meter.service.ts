import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Meter } from '@core/models/Meter';

@Injectable({
  providedIn: 'root'
})
export class MeterService {
  // Dados de exemplo (mock) para testes
  private mockMeters: Meter[] = [
    {
      id: '1',
      unitId: '101',
      measurementTypeId: '1',
      serialNumber: 'W12345678',
      measurementType: { id: 1, name: 'Água', unit: 'm³', active: true },
      unit: { 
        id: 101,
        identifier: 'Apto 101', 
        owner: 'João Silva', 
        condominiumId: 1,
        metersCount: 1,
        lastReading: new Date(2025, 4, 25)
      }
    },
    {
      id: '2',
      unitId: '102',
      measurementTypeId: '2',
      serialNumber: 'E87654321',
      measurementType: { id: 2, name: 'Energia', unit: 'kWh', active: true },
      unit: { 
        id: 102,
        identifier: 'Apto 102', 
        owner: 'Maria Oliveira', 
        condominiumId: 1,
        metersCount: 2,
        lastReading: new Date(2025, 4, 24)
      }
    },
    {
      id: '3',
      unitId: '102',
      measurementTypeId: '3',
      serialNumber: 'G34567890',
      measurementType: { id: 3, name: 'Gás', unit: 'm³', active: true },
      unit: { 
        id: 102,
        identifier: 'Apto 102', 
        owner: 'Maria Oliveira', 
        condominiumId: 1,
        metersCount: 2,
        lastReading: new Date(2025, 4, 26)
      }
    }
  ];

  constructor() { }

  getMeters(): Observable<Meter[]> {
    return of(this.mockMeters).pipe(delay(300));
  }

  getMeterById(id: string): Observable<Meter | undefined> {
    const meter = this.mockMeters.find(m => m.id === id);
    return of(meter).pipe(delay(200));
  }

  getMetersByUnitId(unitId: string): Observable<Meter[]> {
    const meters = this.mockMeters.filter(m => m.unitId === unitId);
    return of(meters).pipe(delay(300));
  }

  createMeter(meterData: Partial<Meter>): Observable<Meter> {
    const newId = `meter_${Math.random().toString(36).substring(2, 9)}`;
    const newMeter: Meter = {
      id: newId,
      unitId: meterData.unitId || '',
      measurementTypeId: meterData.measurementTypeId || '',
      serialNumber: meterData.serialNumber || '',
      // Outros campos conforme necessário
    };
    
    this.mockMeters.push(newMeter);
    return of(newMeter).pipe(delay(300));
  }

  updateMeter(id: string, meterData: Partial<Meter>): Observable<Meter> {
    const index = this.mockMeters.findIndex(m => m.id === id);
    if (index > -1) {
      this.mockMeters[index] = {
        ...this.mockMeters[index],
        ...meterData
      };
      return of(this.mockMeters[index]).pipe(delay(300));
    }
    throw new Error(`Medidor com ID ${id} não encontrado.`);
  }

  deleteMeter(id: string): Observable<boolean> {
    const index = this.mockMeters.findIndex(m => m.id === id);
    if (index > -1) {
      this.mockMeters.splice(index, 1);
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
  }
}
