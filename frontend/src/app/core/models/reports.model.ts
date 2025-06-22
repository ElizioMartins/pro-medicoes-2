
export interface ConsumptionData {
  period: string;
  consumption: number;
  cost?: number;
  unit: string;
}

export interface MeterStatistics {
  meter_id: number;
  meter_info: Partial<Meter>;
  total_readings: number;
  last_reading: string;
  average_consumption: number;
  consumption_trend: 'up' | 'down' | 'stable';
  anomalies_detected: number;
}

export interface CondominiumReport {
  condominium: Condominium;
  period: {
    start_date: string;
    end_date: string;
  };
  total_consumption: number;
  total_cost: number;
  units_data: UnitConsumptionData[];
  charts_data: ChartData[];
}

export interface UnitConsumptionData {
  unit: Unit;
  meters: MeterStatistics[];
  total_consumption: number;
  consumption_by_type: { [key: string]: number };
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: any[];
  labels: string[];
  colors?: string[];
}


