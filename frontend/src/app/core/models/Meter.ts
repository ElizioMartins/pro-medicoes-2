export interface Meter {
  id: number;
  unitId: number; // Alterado de string para number para compatibilidade com Unit
  measurementTypeId: number; // Alterado de string para number para compatibilidade com MeasurementType
  serialNumber?: string; // Número de série do medidor  
  unit: Unit; // Relacionamento com a Unidade
  measurementType?: MeasurementType; // Relacionamento com o Tipo de Medição
  active: boolean; // Indica se o medidor está ativo
  reading: Reading[]; // Leituras associadas ao medidor
  lastReading?: Date; // Data da última leitura registrada
}

import { Unit } from './Unit';
import { MeasurementType } from './MeasurementType';import { Reading } from './Reading';

