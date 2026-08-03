import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface JobDefinitionDto {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  cronExpression: string;
  timeZoneId: string;
  isEnabled: boolean;
  sortOrder?: number;
}

export interface JobsMasterResponse {
  hangfireEnabled: boolean;
  jobs: JobDefinitionDto[];
}

export interface UpdateHangfireRequest {
  isEnabled: boolean;
}

export interface UpdateJobRequest {
  cronExpression: string;
  isEnabled?: boolean;
  timeZoneId?: string;
}

@Injectable({ providedIn: 'root' })
export class JobMasterService {
  private readonly api = inject(ApiService);

  getMaster(): Observable<JobsMasterResponse> {
    return this.api.get<JobsMasterResponse>('jobs');
  }

  updateHangfire(body: UpdateHangfireRequest): Observable<{ isEnabled: boolean }> {
    return this.api.put<{ isEnabled: boolean }>('jobs/hangfire', body);
  }

  updateJob(id: string, body: UpdateJobRequest): Observable<JobDefinitionDto> {
    return this.api.put<JobDefinitionDto>(`jobs/${id}`, body);
  }
}
