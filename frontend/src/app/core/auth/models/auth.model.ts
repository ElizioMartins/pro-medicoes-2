export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Tenant {
  id: string;
  name: string;
  logo?: string;
}

export interface AuthResponse {
  user: User;
  tenant: Tenant;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
