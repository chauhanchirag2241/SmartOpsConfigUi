import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface BranchDropdownItem {
  id: string;
  name: string;
  isHeadOffice: boolean;
  isDefault: boolean;
}

@Injectable({ providedIn: 'root' })
export class BranchService {
  private readonly api = inject(ApiService);

  getSchoolBranches(schoolId: string): Observable<BranchDropdownItem[]> {
    return this.api.get<BranchDropdownItem[]>(`branches/school/${schoolId}`);
  }

  getUserBranches(userId: string): Observable<BranchDropdownItem[]> {
    return this.api.get<BranchDropdownItem[]>(`branches/users/${userId}`);
  }

  setUserBranches(userId: string, branchIds: string[], defaultBranchId?: string): Observable<void> {
    return this.api.put<void>(`branches/users/${userId}`, { branchIds, defaultBranchId: defaultBranchId ?? null });
  }
}
