import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
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
        path: 'schools',
        loadComponent: () =>
          import('./features/school/school-list/school-list.component').then((m) => m.SchoolListComponent),
      },
      {
        path: 'schools/add',
        loadComponent: () =>
          import('./features/school/school-add-edit/school-add-edit.component').then((m) => m.SchoolAddEditComponent),
      },
      {
        path: 'schools/edit/:id',
        loadComponent: () =>
          import('./features/school/school-add-edit/school-add-edit.component').then((m) => m.SchoolAddEditComponent),
      },
      {
        path: 'schools/details/:id',
        loadComponent: () =>
          import('./features/school/school-details/school-details.component').then((m) => m.SchoolDetailsComponent),
      }
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
