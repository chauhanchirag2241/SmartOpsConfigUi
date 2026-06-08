import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

function isAuthApiUrl(url: string): boolean {
  return url.includes('/auth/login') || url.includes('/auth/refresh');
}

function isOnLoginPage(router: Router): boolean {
  return router.url.includes('/auth/login');
}

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) {
        return throwError(() => err);
      }

      if ((err.status === 401 || err.status === 403) && !isAuthApiUrl(req.url)) {
        if (isOnLoginPage(router)) {
          auth.ensureValidSessionOrClear();
          return throwError(() => err);
        }

        auth.expireSession();
        return EMPTY;
      }

      return throwError(() => err);
    }),
  );
};
