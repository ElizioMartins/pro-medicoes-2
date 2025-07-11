import { BaseEntity } from "./base.model";

export interface MeasurementType extends BaseEntity {
  name: string;
  unit: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MeasurementTypeCreate {
  name: string;
  unit: string;
  active?: boolean;
}


