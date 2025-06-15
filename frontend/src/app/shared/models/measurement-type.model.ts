
export interface MeasurementType extends BaseEntity {
  name: string;
  unit: string;
  active: boolean;
}

export interface MeasurementTypeCreate {
  name: string;
  unit: string;
  active?: boolean;
}


