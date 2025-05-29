export interface Reading {
  id: string;
  condominiumId: string;
  unit: string; // Assuming unit is a string identifier for now, could be a separate model later
  measurementTypeId: string;
  value: string; // Value can be string to accommodate units like '12.5 m³'
  date: Date;
  registeredBy: string;
  // Optional: Add properties for related objects if needed for display
  condominiumName?: string;
  measurementTypeName?: string;
}
