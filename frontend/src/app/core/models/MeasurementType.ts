export interface MeasurementType {
  id: number;
  name: string;
  unit: string; // e.g., 'm³', 'kWh', 'kg'
  description?: string;
  active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}
