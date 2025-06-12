export type UserRole = 'Admin' | 'Manager' | 'Reader' | 'User';
export type UserStatus = 'Active' | 'Inactive' | 'Pending' | 'Suspended';

export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  password: string;
  status: UserStatus;
  active: boolean;
  lastAccess: Date | null;
  initials: string;
  avatarColor: string;
  createdAt?: Date;
  updatedAt?: Date;
}



