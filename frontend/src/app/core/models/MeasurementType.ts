export interface MeasurementType {
  id: number;
  name: string;
  unit: string; // e.g., 'm³', 'kWh', 'kg'
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;    
}
