
export interface Condominium extends BaseEntity {
  name: string;
  address: string;
  cnpj: string;
  manager: string;
  phone: string;
  email: string;
  units_count: number;
  meters_count: number;
  readings_count: number;
  reports_count: number;
}

export interface CondominiumCreate {
  name: string;
  address: string;
  cnpj: string;
  manager: string;
  phone: string;
  email: string;
}

export interface CondominiumUpdate extends Partial<CondominiumCreate> {}


