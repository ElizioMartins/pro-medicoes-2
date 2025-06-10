export interface Unit {
  id: number;
  identifier: string;
  owner: string;
  condominiumId: number;
  metersCount: number;
  lastReading: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}
