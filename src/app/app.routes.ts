import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { MenuCodes } from './core/constants/menu-codes';
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
        data: { menuCode: MenuCodes.Schools, permission: 'view' },
        loadComponent: () =>
          import('./features/schools/schools.component').then((m) => m.SchoolsComponent),
      },
      {
        path: 'configuration/users',
        canActivate: [permissionGuard],
        data: { menuCode: MenuCodes.Users, permission: 'view' },
        loadComponent: () =>
          import('./features/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'configuration/roles',
        canActivate: [permissionGuard],
        data: { menuCode: MenuCodes.Roles, permission: 'view' },
        loadComponent: () =>
          import('./features/roles/roles.component').then((m) => m.RolesComponent),
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
