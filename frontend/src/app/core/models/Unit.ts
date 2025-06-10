import { Meter } from './Meter';

export interface Unit {
  id: number;
  identifier: string;
  owner: string;
  condominiumId: number;
  metersCount: number;
  lastReading: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  meters?: Meter[]; // Novo relacionamento com Meters
}
