import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { SchoolFilter } from '../../shared/enums/table-filters.enum';

export interface SchoolBranch {
  id?: string;
  name: string;
  email?: string;
  address?: string;
  isHeadOffice?: boolean;
}

export interface SchoolPayload {
  name: string;
  subdomain: string;
  schoolCode: string;
  registrationNumber?: string;
  affiliatedBoard?: string;
  schoolType?: string;
  establishedYear?: number | null;
  aboutSchool?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  timezone?: string;
  googleMapsLink?: string;
  latitude?: number | null;
  longitude?: number | null;
  primaryPhone?: string;
  alternatePhone?: string;
  fax?: string;
  primaryEmail?: string;
  principalEmail?: string;
  website?: string;
  logoUrl?: string;
  faviconUrl?: string;
  tagline?: string;
  shortName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  textOnPrimary?: string;
  customDomain?: string;
  sslCertificate?: string;
  academicYearFormat?: string;
  currentAcademicYear?: string;
  gradingSystem?: string;
  passingPercentage?: number | null;
  workingDaysPerWeek?: string;
  schoolTiming?: string;
  classesFrom?: string;
  classesTo?: string;
  sectionsPerClass?: number | null;
  sectionNaming?: string;
  maxStudentsPerSection?: number | null;
  admissionNumberFormat?: string;
  attendanceType?: string;
  minimumAttendancePercent?: number | null;
  lateMarkAfterMinutes?: number | null;
  autoNotifyParentsOnAbsence?: boolean;
  allowBackdatedAttendance?: boolean;
  currency?: string;
  paymentCycle?: string;
  feeDueDay?: number | null;
  lateFeeType?: string;
  lateFeeValue?: number | null;
  gracePeriodDays?: number | null;
  feeHeads?: string[];
  discountTypes?: string[];
  paymentMethods?: string[];
  portalSettings?: Record<string, boolean>;
  schemaName?: string;
  storagePlan?: string;
  dataRegion?: string;
  sessionTimeoutMinutes?: number | null;
  passwordPolicy?: string;
  loginAttemptsBeforeLock?: number | null;
  twoFactorEnabled?: boolean;
  ipWhitelistEnabled?: boolean;
  branchDataIsolation?: boolean;
  sharedFeeStructure?: boolean;
  centralAdminViewAllBranches?: boolean;
  branches?: SchoolBranch[];
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

  updateSchool(id: string, payload: Record<string, unknown>): Observable<void> {
    return this.api.put(`schools/${id}`, payload);
  }

  deleteSchool(id: string): Observable<void> {
    return this.api.delete(`schools/${id}`);
  }
}
