import { BaseEntity } from "./base.model";

export interface Unit extends BaseEntity {
  condominium_id: number;
  identifier: string;
  owner: string;
  meters_count: number;
  last_reading?: string;
  observations?: string;
  active: boolean;
  meters?: any[]; // Adicionado para compatibilidade com uso no código
}

export interface UnitCreate {
  identifier: string;
  owner: string;
  observations?: string;
  active?: boolean;
}

export interface UnitUpdate extends Partial<UnitCreate> {}


