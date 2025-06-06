export interface Reading {
  id: string;
  condominiumId: string;
  unit: string; 
  measurementTypeId: string;
  currentReading: string; // Value read from the meter, can be string for '12.5 m³' or if inaccessible
  date: Date; // Could be due date for PENDING, or registration date for COMPLETED
  registeredBy?: string; // Who registered/completed it
  
  status: 'PENDING' | 'COMPLETED' | 'INACCESSIBLE';
  inaccessibleReason?: string; // e.g., 'Unidade fechada', 'Morador negou acesso'
  observations?: string;
  
  photos?: ReadingPhoto[];

  // Optional: Add properties for related objects if needed for display
  condominiumName?: string;
  measurementTypeName?: string;
}
import { ReadingPhoto } from './ReadingPhoto';
