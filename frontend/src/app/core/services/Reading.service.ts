import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';
import { Reading } from '../models/Reading';
import { ReadingPhoto } from '../models/ReadingPhoto';
import { Meter } from '../models/Meter';
import { MeterService } from './Meter.service';

@Injectable({
  providedIn: 'root'
})
export class ReadingService {
  private mockReadingPhotos: ReadingPhoto[] = [];
  private mockReadings: Reading[] = [
    {
      id: 1,
      meter_id: 1,
      currentReading: '',
      date: new Date(2025, 4, 25),
      status: 'PENDING',
      observations: 'Medidor de difícil acesso, requer chave especial.',
      photos: [],
      // meter: {
      //   id: 1,
      //   unitId: 101,
      //   measurementTypeId: 1,
      //   serialNumber: 'W12345678',
      //   active: true,
      //   measurementType: { id: 1, name: 'Água', unit: 'm³'},
      //   unit: { 
      //     id: 101,
      //     identifier: 'Apto 101', 
      //     owner: 'João Silva', 
      //     condominiumId: 1,
      //     metersCount: 1,
      //     lastReading: new Date(2025, 4, 25)
      //   }
      // }
    },
    {
      id: 2, 
      meter_id: 2,
      currentReading: '145',
      date: new Date(2025, 4, 24),
      registeredBy: 1,
      status: 'COMPLETED',
      observations: '',
      photos: [
        { 
          id: 'photo_abc123',
          readingId: 2,
          filePath: 'server/path/full/photo_abc123.jpg',
          croppedFilePath: 'server/path/cropped/photo_abc123.jpg',
          isCropped: true,
          timestamp: new Date()
        }
      ],
      // meter: {
      //   id: 2,
      //   unitId: 102,
      //   measurementTypeId: 2,
      //   serialNumber: 'E87654321',
      //   active: true,
      //   measurementType: { id: 2, name: 'Energia', unit: 'kWh'},
      //   unit: { 
      //     id: 102,
      //     identifier: 'Apto 102', 
      //     owner: 'Maria Oliveira', 
      //     condominiumId: 1,
      //     metersCount: 2,
      //     lastReading: new Date(2025, 4, 24)
      //   }
      // }
    },
    {
      id: 3,
      meter_id: 3,
      currentReading: '',
      date: new Date(2025, 4, 28),
      status: 'INACCESSIBLE',
      inaccessibleReason: 'Unidade fechada',
      observations: 'Tentativas em 3 dias diferentes, sem sucesso.',
      photos: [],
      // meter: {
      //   id: 3,
      //   unitId: 102,
      //   measurementTypeId: 3,
      //   serialNumber: 'G34567890',
      //   active: true,
      //   measurementType: { id: 3, name: 'Gás', unit: 'm³' },
      //   unit: { 
      //     id: 102,
      //     identifier: 'Apto 102', 
      //     owner: 'Maria Oliveira', 
      //     condominiumId: 1,
      //     metersCount: 2,
      //     lastReading: new Date(2025, 4, 28)
      //   }
      // }
    }
  ];

  constructor(private meterService: MeterService) { }

  getReadings(): Observable<Reading[]> {
    return of(this.mockReadings).pipe(delay(300));
  }

  getReadingById(id: number): Observable<Reading | undefined> {
    const reading = this.mockReadings.find(r => r.id === id);
    return of(reading).pipe(delay(300));
  }

  updateReading(id: number, readingData: Partial<Reading>): Observable<Reading> {
    const index = this.mockReadings.findIndex(r => r.id === id);
    if (index === -1) {
      return throwError(() => new Error('Leitura não encontrada'));
    }

    const updatedReading = {
      ...this.mockReadings[index],
      ...readingData,
      date: new Date() // Atualiza a data ao modificar
    };

    this.mockReadings[index] = updatedReading;
    return of(updatedReading).pipe(delay(300));
  } 
  
  createReading(readingData: Reading): Observable<Reading> {
    return this.meterService.getMeterById(readingData.meter_id!).pipe(
      switchMap(meter => {
        if (!meter) {
          return throwError(() => new Error('Medidor não encontrado'));
        }

        const newId = Math.max(...this.mockReadings.map(r => r.id)) + 1;
        const newReading: Reading = {
          id: newId,
          meter_id: readingData.meter_id!,
          currentReading: '',
          date: new Date(),
          status: 'PENDING',
          observations: readingData.observations || '',
          photos: [],
        };

        this.mockReadings.push(newReading);
        return of(newReading).pipe(delay(300));
      })
    );
  }

  // Método para adicionar a unidade de medida ao currentReading
  private formatReadingWithUnit(reading: string, meter: Meter): string {
    if (!meter.measurementType) return reading;
    return `${reading} ${meter.measurementType.unit}`;
  }

  // Método para simular o salvamento de fotos
  saveReadingPhoto(readingId: number, fullImageBase64: string, croppedImageBase64: string): Observable<ReadingPhoto> {
    console.log(`ReadingService: Simulando salvamento de foto para readingId: ${readingId}`);
    
    const newPhotoId = `photo_${Math.random().toString(36).substring(2, 9)}`;
    const newPhoto: ReadingPhoto = {
      id: newPhotoId,
      readingId: readingId,
      filePath: `server/path/full/${newPhotoId}.jpg`,
      croppedFilePath: `server/path/cropped/${newPhotoId}.jpg`,
      isCropped: true,
      timestamp: new Date()
    };

    this.mockReadingPhotos.push(newPhoto);
    
    const readingIndex = this.mockReadings.findIndex(r => r.id === readingId);
    if (readingIndex > -1) {
      if (!this.mockReadings[readingIndex].photos) {
        this.mockReadings[readingIndex].photos = [];
      }
      // Garante que não haja foto duplicada
      if (!this.mockReadings[readingIndex].photos!.find(p => p.id === newPhoto.id)) {
        this.mockReadings[readingIndex].photos!.push(newPhoto);
      }
    }
    
    return of(newPhoto).pipe(delay(500));
  }
}
