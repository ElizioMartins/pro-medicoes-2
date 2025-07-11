import { BaseEntity } from "./base.model";

export interface Unit extends BaseEntity {
  condominium_id: number;
  number: string;
  owner: string;
  meters_count: number;
  last_reading?: string;
  observations?: string;
  active: boolean;
  meters?: unknown[]; // Para compatibilidade com uso no código
}

export interface UnitCreate {
  number: string;
  owner: string;
  observations?: string;
  active?: boolean;
}

export type UnitUpdate = Partial<UnitCreate>;


