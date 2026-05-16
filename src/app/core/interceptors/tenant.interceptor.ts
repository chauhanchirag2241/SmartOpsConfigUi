import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SchoolContextService } from '../services/school-context.service';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const schoolContext = inject(SchoolContextService);
  const subdomain = schoolContext.selectedSchool?.subdomain;

  if (!subdomain) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { 'X-Tenant-ID': subdomain },
    }),
  );
};
