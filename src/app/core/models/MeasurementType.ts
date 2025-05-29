export interface MeasurementType {
  id: string;
  name: string;
  unit: string; // e.g., 'm³', 'kWh', 'kg'
  description?: string;
}
