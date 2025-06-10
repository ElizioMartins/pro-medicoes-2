export interface Meter {
  id: string;
  unitId: string;
  measurementTypeId: string;
  serialNumber?: string; // Número de série do medidor
  // Adicionar outros campos relevantes conforme necessário

  // Opcional: Incluir objetos relacionados para facilitar o acesso no frontend
  unit?: Unit; // Relacionamento com a Unidade
  measurementType?: MeasurementType; // Relacionamento com o Tipo de Medição
}

import { Unit } from './Unit';
import { MeasurementType } from './MeasurementType';
