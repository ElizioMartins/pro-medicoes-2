export type UserRole = 'Admin' | 'Manager' | 'Reader' | 'User';
export type UserStatus = 'Active' | 'Inactive' | 'Pending';

export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  is_active: number;
  lastAccess: Date | null;
  initials: string;
  avatarColor: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  status?: UserStatus;
  is_active?: number;
  initials?: string;
  avatarColor?: string;
}

export interface UserUpdate {
  username?: string;
  email?: string;
  password?: string;
  name?: string;
  role?: string;
  status?: string;
  is_active?: number;
  initials?: string;
  avatarColor?: string;
}
