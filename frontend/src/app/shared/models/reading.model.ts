import { BaseEntity } from "./base.model";
import { ReadingStatus } from "./enums";
import { ReadingPhoto } from "./reading-photo.model";

// Interfaces específicas para Reading com informações aninhadas
export interface ReadingMeter {
  id: number;
  serial_number?: string;
  unit_id: number;
  measurement_type_id: number;
  unit?: {
    id: number;
    number: string;
    condominium_id: number;
    condominium?: {
      id: number;
      name: string;
    };
  };
  measurement_type?: {
    id: number;
    name: string;
    unit: string;
  };
}

export interface Reading extends BaseEntity {
  meter_id: number;
  current_reading: string;
  date: string;
  reference_month: string; // Formato YYYY-MM
  registered_by?: number;
  status: ReadingStatus;
  inaccessible_reason?: string;
  observations?: string;
  photos: ReadingPhoto[];
  meter?: ReadingMeter;
}

export interface ReadingCreate {
  meter_id: number;
  current_reading: string;
  reference_month: string; // Formato YYYY-MM
  status: ReadingStatus;
  inaccessible_reason?: string;
  observations?: string;
  photos?: ReadingPhoto[];
}

export interface ReadingUpdate {
  current_reading?: string;
  reference_month?: string; // Formato YYYY-MM
  status?: ReadingStatus;
  inaccessible_reason?: string;
  observations?: string;
}


