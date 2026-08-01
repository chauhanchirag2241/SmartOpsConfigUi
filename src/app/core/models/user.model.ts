export type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'Admin' | 'Accountant' | 'SmartOpsAdmin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roles?: string[];
  roleId?: string;
  token?: string;
}
