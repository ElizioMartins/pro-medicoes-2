import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Reading } from '../models/Reading';
import { ReadingPhoto } from '../models/ReadingPhoto'; // Import ReadingPhoto

@Injectable({
  providedIn: 'root'
})
export class ReadingService {

  private mockReadingPhotos: ReadingPhoto[] = []; // Mock array for photos

  private mockReadings: Reading[] = [
    {
      id: '1',
      condominiumId: '1',
      unit: 'Apto 101',
      measurementTypeId: '1',
      currentReading: '', // Initially empty for a PENDING reading
      date: new Date(2025, 4, 25), // This might be 'dueDate' or similar
      registeredBy: '', // Empty until processed
      condominiumName: 'Residencial Parque das Flores',
      measurementTypeName: 'Água',
      status: 'PENDING',
      observations: 'Medidor de difícil acesso, requer chave especial.',
      photos: []
    },
    {
      id: '2',
      condominiumId: '1',
      unit: 'Apto 203',
      measurementTypeId: '2',
      currentReading: '145 kWh',
      date: new Date(2025, 4, 24),
      registeredBy: 'Maria Santos',
      condominiumName: 'Residencial Parque das Flores',
      measurementTypeName: 'Energia',
      status: 'COMPLETED',
      observations: '',
      photos: [
        // Example of a reading that already has a photo
        { 
          id: 'photo_abc123', 
          readingId: '2', 
          filePath: 'server/path/full/photo_abc123.jpg', 
          croppedFilePath: 'server/path/cropped/photo_abc123.jpg', 
          isCropped: true 
        }
      ]
    },
    {
      id: '3',
      condominiumId: '2',
      unit: 'Bloco B Sala 10',
      measurementTypeId: '1',
      currentReading: '', 
      date: new Date(2025, 5, 1), 
      registeredBy: '', 
      condominiumName: 'Centro Comercial Alpha',
      measurementTypeName: 'Água',
      status: 'PENDING',
      observations: 'Verificar possível vazamento reportado.',
      photos: []
    },
    {
      id: '4',
      condominiumId: '1',
      unit: 'Apto 305',
      measurementTypeId: '3', // Assuming '3' is Gás
      currentReading: '', 
      date: new Date(2025, 4, 28),
      registeredBy: '', 
      condominiumName: 'Residencial Parque das Flores',
      measurementTypeName: 'Gás',
      status: 'INACCESSIBLE',
      inaccessibleReason: 'Unidade fechada',
      observations: 'Tentativas em 3 dias diferentes, sem sucesso.',
      photos: []
    }
  ];

  constructor() { }

  getReadings(): Observable<Reading[]> {
    // Simulate linking photos to readings if not already linked (for mock purposes)
    this.mockReadings.forEach(reading => {
        if (!reading.photos || reading.photos.length === 0) {
            reading.photos = this.mockReadingPhotos.filter(p => p.readingId === reading.id);
        }
    });
    return of(this.mockReadings).pipe(delay(500)); // Simulate network delay
  }

  getReadingById(id: string): Observable<Reading | undefined> {
    const reading = this.mockReadings.find(r => r.id === id);
    if (reading) {
        // Ensure photos are linked for the specific reading
        reading.photos = this.mockReadingPhotos.filter(p => p.readingId === reading.id);
    }
    return of(reading).pipe(delay(100)); // Simulate network delay
  }

  // Method to simulate saving photos and associating with a readingId
  saveReadingPhoto(readingId: string, fullImageBase64: string, croppedImageBase64: string): Observable<ReadingPhoto> {
    // In a real app, these base64 strings would be converted to Blobs/Files and POSTed
    console.log(`ReadingService: Simulating save of photo for readingId: ${readingId}`);
    
    const newPhotoId = `photo_${Math.random().toString(36).substring(2, 9)}`;
    const newPhoto: ReadingPhoto = {
      id: newPhotoId,
      readingId: readingId,
      // Storing base64 directly in mock, though backend would store files and return paths/URLs
      filePath: fullImageBase64, 
      croppedFilePath: croppedImageBase64, 
      isCropped: true 
    };
    this.mockReadingPhotos.push(newPhoto);
    
    const readingIndex = this.mockReadings.findIndex(r => r.id === readingId);
    if (readingIndex > -1) {
      if (!this.mockReadings[readingIndex].photos) {
        this.mockReadings[readingIndex].photos = [];
      }
      // Ensure no duplicate photo reference if this method is called multiple times for the same photo conceptually
      if (!this.mockReadings[readingIndex].photos!.find(p => p.id === newPhoto.id)) {
          this.mockReadings[readingIndex].photos!.push(newPhoto);
      }
    }
    return of(newPhoto).pipe(delay(500)); // Simulate network delay
  }

  updateReading(readingId: string, readingData: Partial<Reading>): Observable<Reading> {
    console.log(`ReadingService: Updating readingId ${readingId} with data:`, readingData);
    const readingIndex = this.mockReadings.findIndex(r => r.id === readingId);
    if (readingIndex > -1) {
      // Merge existing data with new data
      this.mockReadings[readingIndex] = { 
        ...this.mockReadings[readingIndex], 
        ...readingData,
        // Ensure status is updated correctly if it's part of readingData
        // And handle other specific fields like inaccessibleReason
        status: readingData.status || this.mockReadings[readingIndex].status,
        currentReading: readingData.currentReading !== undefined ? readingData.currentReading : this.mockReadings[readingIndex].currentReading,
        observations: readingData.observations !== undefined ? readingData.observations : this.mockReadings[readingIndex].observations,
        inaccessibleReason: readingData.inaccessibleReason !== undefined ? readingData.inaccessibleReason : this.mockReadings[readingIndex].inaccessibleReason,
        registeredBy: readingData.registeredBy !== undefined ? readingData.registeredBy : this.mockReadings[readingIndex].registeredBy,
        date: readingData.date || this.mockReadings[readingIndex].date // Update date if it's part of the update (e.g., completion date)
      };
      
      // If status changes from PENDING, registeredBy and date might be set
      if (readingData.status && readingData.status !== 'PENDING') {
        if (!this.mockReadings[readingIndex].registeredBy) {
          this.mockReadings[readingIndex].registeredBy = 'Operador App'; // Default registrar
        }
        // Potentially update 'date' to registration date if status is now COMPLETED/INACCESSIBLE
        // For now, we assume 'date' in readingData or existing 'date' is sufficient.
      }

      return of(this.mockReadings[readingIndex]).pipe(delay(300));
    }
    return throwError(() => new Error(`Reading with id ${readingId} not found.`));
  }

  createReading(readingData: Partial<Reading>): Observable<Reading> {
    const newId = `reading_${Math.random().toString(36).substring(2, 10)}`;
    const newReading: Reading = {
      id: newId,
      condominiumId: readingData.condominiumId || 'temp-condo-id', // Placeholder, ideally from context
      unit: readingData.unit || 'temp-unit', // Placeholder
      measurementTypeId: readingData.measurementTypeId || 'temp-type-id', // Placeholder
      currentReading: '',
      date: new Date(), // Or a specific reference date
      registeredBy: '', // Will be set on completion
      status: 'PENDING',
      observations: readingData.observations || '',
      photos: [],
      condominiumName: readingData.condominiumName || 'Temp Condo',
      measurementTypeName: readingData.measurementTypeName || 'Temp Type',
      inaccessibleReason: undefined
      // Ensure all required fields from Reading interface are initialized
    };
    this.mockReadings.unshift(newReading); // Add to the beginning of the array
    console.log('ReadingService: Created new draft reading:', newReading);
    return of(newReading).pipe(delay(200));
  }
}
