import { BaseEntity } from "./base.model";
import { UserRole } from "./enums";

export interface User extends BaseEntity {
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  active: boolean;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  active?: boolean;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  role?: UserRole;
  active?: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}


