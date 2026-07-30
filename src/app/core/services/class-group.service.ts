import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';

export interface ClassGroupPayload {
  branchId: string;
  className: string;
  description?: string | null;
}

export interface ClassGroupRow {
  id: string;
  branchId: string;
  branchName: string;
  className: string;
  description?: string | null;
  status: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class ClassGroupService {
  private readonly api = inject(ApiService);

  getSchoolClassGroups(
    schoolId: string,
    pageIndex = 1,
    pageSize = 50,
    searchTerm = '',
    sortColumn: string | null = null,
    sortDirection: string | null = null,
    filter = 'Active',
  ): Observable<{ items: ClassGroupRow[]; totalCount: number }> {
    let params = new HttpParams()
      .set('pageIndex', pageIndex.toString())
      .set('pageSize', pageSize.toString())
      .set('filter', this.resolveFilter(filter).toString());

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }
    if (sortColumn) {
      params = params.set('sortColumn', sortColumn);
    }
    if (sortDirection) {
      params = params.set('sortDirection', sortDirection);
    }

    return this.api.get(`schools/${schoolId}/classGroups`, params);
  }

  createSchoolClassGroup(
    schoolId: string,
    data: ClassGroupPayload,
  ): Observable<{ message: string; classGroupId: string }> {
    return this.api.post(`schools/${schoolId}/classGroups`, data);
  }

  updateSchoolClassGroup(schoolId: string, id: string, data: ClassGroupPayload): Observable<void> {
    return this.api.put(`schools/${schoolId}/classGroups/${id}`, data);
  }

  deleteSchoolClassGroup(schoolId: string, id: string): Observable<void> {
    return this.api.delete(`schools/${schoolId}/classGroups/${id}`);
  }

  private resolveFilter(label: string): number {
    switch (label) {
      case 'Active':
        return 1;
      case 'Inactive':
      case 'Deleted':
        return 2;
      default:
        return 0;
    }
  }
}
