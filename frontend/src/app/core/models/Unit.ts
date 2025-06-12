import { Meter } from "./Meter";

export interface Unit {
  id: number;
  condominiumId: number;
  identifier: string;
  owner: string;
  metersCount: number;
  lastReading: Date | null;
  observations?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  
  // Relacionamentos
  condominium?: any;
  meters?: Meter[];
}
