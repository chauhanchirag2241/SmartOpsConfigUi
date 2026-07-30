import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';

export interface AcademicYearPayload {
  title: string;
  startDate: string;
  endDate: string;
}

export interface AcademicYearRow {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
  isActive: boolean;
  isCurrent: boolean;
}

@Injectable({ providedIn: 'root' })
export class AcademicYearService {
  private readonly api = inject(ApiService);

  getSchoolAcademicYears(
    schoolId: string,
    pageIndex = 1,
    pageSize = 50,
    searchTerm = '',
    sortColumn: string | null = null,
    sortDirection: string | null = null,
    filter = 'Active',
  ): Observable<{ items: AcademicYearRow[]; totalCount: number }> {
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

    return this.api.get(`schools/${schoolId}/academicYears`, params);
  }

  getSchoolAcademicYearById(schoolId: string, id: string): Observable<AcademicYearRow> {
    return this.api.get(`schools/${schoolId}/academicYears/${id}`);
  }

  createSchoolAcademicYear(schoolId: string, data: AcademicYearPayload): Observable<{ message: string; academicYearId: string }> {
    return this.api.post(`schools/${schoolId}/academicYears`, data);
  }

  updateSchoolAcademicYear(schoolId: string, id: string, data: AcademicYearPayload): Observable<void> {
    return this.api.put(`schools/${schoolId}/academicYears/${id}`, data);
  }

  deleteSchoolAcademicYear(schoolId: string, id: string): Observable<void> {
    return this.api.delete(`schools/${schoolId}/academicYears/${id}`);
  }

  private resolveFilter(label: string): number {
    switch (label) {
      case 'Active':
        return 1;
      case 'Inactive':
      case 'Deleted':
        return 2;
      case 'Current':
        return 3;
      case 'Upcoming':
      case 'Draft':
        return 4;
      case 'Past':
      case 'Archived':
        return 5;
      default:
        return 0;
    }
  }
}
