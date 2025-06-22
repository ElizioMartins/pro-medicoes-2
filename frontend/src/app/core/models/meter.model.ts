
export interface Meter extends BaseEntity {
  unit_id: number;
  measurement_type_id: number;
  serial_number?: string;
  active: boolean;
  last_reading_date?: string;
  measurement_type?: MeasurementType;
}

export interface MeterCreate {
  unit_id: number;
  measurement_type_id: number;
  serial_number?: string;
  active?: boolean;
}

export interface MeterUpdate {
  serial_number?: string;
  active?: boolean;
}


