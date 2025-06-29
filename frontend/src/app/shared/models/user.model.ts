import { BaseEntity } from './base.model';
import { UserRole } from './enums';

export interface User extends BaseEntity {
  username: string;
  email: string;
  name: string;
  role: UserRole;
  status: string; // Active, Inactive, Pending, Suspended
  active: boolean;
  lastAccess?: string; // ISO string
  initials?: string;
  avatarColor?: string;
}

export interface UserCreate {
  username: string;
  email: string;
  name: string;
  password: string; // Password is required for creation
  role: UserRole;
  status?: string;
  active?: boolean;
}

export interface UserUpdate {
  username?: string;
  email?: string;
  name?: string;
  password?: string; // Password is optional for update
  role?: UserRole;
  status?: string;
  active?: boolean;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}


