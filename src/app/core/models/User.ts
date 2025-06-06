export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Reader' | 'User';
  status: 'Active' | 'Inactive' | 'Pending';
  lastAccess: Date;
  initials: string;
  avatarColor: string;
}
