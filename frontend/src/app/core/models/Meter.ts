import { Unit } from './Unit';
import { MeasurementType } from './MeasurementType';
import { Reading } from './Reading';

export interface Meter {
  id: number;
  unitId: number;
  measurementTypeId: number;
  serialNumber?: string;
  active: boolean;
  lastReadingDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  
  // Relacionamentos
  unit?: Unit;
  measurementType?: MeasurementType;
  readings?: Reading[];
}

