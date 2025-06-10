export interface Condominium {
  id: number;
  name: string;
  address: string;
  cnpj: string;
  manager: string;
  phone: string;
  email: string;
  unitsCount: number;
  metersCount: number;
  readingsCount: number;
  reportsCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}
