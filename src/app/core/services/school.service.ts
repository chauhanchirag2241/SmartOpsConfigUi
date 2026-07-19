import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { SchoolFilter } from '../../shared/enums/table-filters.enum';

export interface SchoolBranch {
  id: string;
  schoolId: string;
  name: string;
  email?: string | null;
  address?: string | null;
  isHeadOffice: boolean;
  isActive: boolean;
}

export interface SaveSchoolBranchPayload {
  name: string;
  email?: string | null;
  address?: string | null;
}

/** Basic school fields only — branding/academic/fees/portal removed. */
export interface SchoolPayload {
  id?: string;
  name: string;
  subdomain: string;
  schoolCode: string;
  registrationNumber?: string | null;
  affiliatedBoard?: string | null;
  schoolType?: string | null;
  establishedYear?: number | null;
  aboutSchool?: string | null;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string | null;
  timezone?: string | null;
  googleMapsLink?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  primaryPhone?: string | null;
  alternatePhone?: string | null;
  fax?: string | null;
  primaryEmail?: string | null;
  principalEmail?: string | null;
  website?: string | null;
  schemaName?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SchoolService {
  private readonly api = inject(ApiService);

  getSchools(
    pageIndex = 1,
    pageSize = 10,
    searchTerm = '',
    sortColumn: string | null = null,
    sortDirection: string | null = null,
    filter: SchoolFilter = SchoolFilter.Active
  ): Observable<{ items: Record<string, unknown>[]; totalCount: number }> {
    let params = new HttpParams()
      .set('pageIndex', pageIndex.toString())
      .set('pageSize', pageSize.toString())
      .set('filter', filter.toString());

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }
    if (sortColumn) {
      params = params.set('sortColumn', sortColumn);
    }
    if (sortDirection) {
      params = params.set('sortDirection', sortDirection);
    }

    return this.api.get('schools', params);
  }

  getSchoolById(id: string): Observable<Record<string, unknown>> {
    return this.api.get(`schools/${id}`);
  }

  createSchool(payload: SchoolPayload): Observable<{ message: string; schoolId: string }> {
    return this.api.post('schools', payload);
  }

  updateSchool(id: string, payload: SchoolPayload): Observable<void> {
    return this.api.put(`schools/${id}`, payload);
  }

  deleteSchool(id: string): Observable<void> {
    return this.api.delete(`schools/${id}`);
  }

  getBranches(schoolId: string): Observable<SchoolBranch[]> {
    return this.api.get(`schools/${schoolId}/branches`);
  }

  addBranch(schoolId: string, payload: SaveSchoolBranchPayload): Observable<SchoolBranch> {
    return this.api.post(`schools/${schoolId}/branches`, payload);
  }

  updateBranch(
    schoolId: string,
    branchId: string,
    payload: SaveSchoolBranchPayload
  ): Observable<SchoolBranch> {
    return this.api.put(`schools/${schoolId}/branches/${branchId}`, payload);
  }

  deleteBranch(schoolId: string, branchId: string): Observable<void> {
    return this.api.delete(`schools/${schoolId}/branches/${branchId}`);
  }
}
