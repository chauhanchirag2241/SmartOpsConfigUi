import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'configuration/schools',
        canActivate: [permissionGuard],
        data: { permission: 'admin.full' },
        loadComponent: () =>
          import('./features/schools/schools.component').then((m) => m.SchoolsComponent),
      },
      {
        path: 'configuration/users',
        canActivate: [permissionGuard],
        data: { permission: 'hr.read' },
        loadComponent: () =>
          import('./features/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'configuration/roles',
        canActivate: [permissionGuard],
        data: { permission: 'roles.manage' },
        loadComponent: () =>
          import('./features/role-management/role-management.component').then(
            (m) => m.RoleManagementComponent,
          ),
      },
    ],
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadComponent: () => import('./auth/login/login.component').then((m) => m.LoginComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
