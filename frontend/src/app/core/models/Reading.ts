export interface Reading {
  id: string;
  meter_id: string; // Nova chave para relacionar com o medidor
  currentReading: string; // Value read from the meter, can be string for '12.5 m³' or if inaccessible
  date: Date; // Could be due date for PENDING, or registration date for COMPLETED
  registeredBy?: string; // Who registered/completed it
  
  status: 'PENDING' | 'COMPLETED' | 'INACCESSIBLE';
  inaccessibleReason?: string; // e.g., 'Unidade fechada', 'Morador negou acesso'
  observations?: string;
  
  photos?: ReadingPhoto[];

  // Objeto completo do medidor (para facilitar o acesso às informações relacionadas)
  meter?: Meter;

  // Mantemos estes campos para retrocompatibilidade com o código existente
  // Mais tarde, podemos atualizar os componentes para usar meter.unit e meter.measurementType
  condominiumId?: string;
  unit?: string;
  measurementTypeId?: string;
  condominiumName?: string;
  measurementTypeName?: string;
}
import { ReadingPhoto } from './ReadingPhoto';
import { Meter } from './Meter';
