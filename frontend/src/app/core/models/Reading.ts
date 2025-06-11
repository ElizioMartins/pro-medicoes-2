export interface Reading {
  id: number;
  meter_id: number;
  currentReading: string; // Value read from the meter, can be string for '12.5 m³' or if inaccessible
  date: Date; // Could be due date for PENDING, or registration date for COMPLETED
  registeredBy?: number; // ID do usuário que registrou a leitura
  
  status: 'PENDING' | 'COMPLETED' | 'INACCESSIBLE';
  inaccessibleReason?: string; // e.g., 'Unidade fechada', 'Morador negou acesso'
  observations?: string;
  
  photos?: ReadingPhoto[];

  // Relacionamentos
  meter: Meter; // Inclui acesso a unit e measurementType através do meter
}

import { ReadingPhoto } from './ReadingPhoto';
import { Meter } from './Meter';
