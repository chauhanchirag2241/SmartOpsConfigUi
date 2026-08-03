import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MenuCodes } from '../../core/constants/menu-codes';
import {
  JobDefinitionDto,
  JobMasterService,
} from '../../core/services/job-master.service';
import { NotificationService } from '../../core/services/notification.service';
import { PermissionService } from '../../core/services/permission.service';
import { finalize } from 'rxjs/operators';

interface JobRow extends JobDefinitionDto {
  editingCron: string;
  saving: boolean;
}

@Component({
  selector: 'app-job-master',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './job-master.component.html',
  styleUrl: './job-master.component.css',
})
export class JobMasterComponent implements OnInit {
  private readonly service = inject(JobMasterService);
  private readonly permissionService = inject(PermissionService);
  private readonly snackBar = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  hangfireEnabled = true;
  hangfireSaving = false;
  jobs: JobRow[] = [];

  get canEdit(): boolean {
    return this.permissionService.canEdit(MenuCodes.JobMaster);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.service
      .getMaster()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (res) => {
          this.hangfireEnabled = !!res?.hangfireEnabled;
          const list = Array.isArray(res?.jobs) ? res.jobs : [];
          this.jobs = list.map((j) => ({
            ...j,
            editingCron: j.cronExpression,
            saving: false,
          }));
        },
        error: () => {
          this.jobs = [];
          this.snackBar.open('Failed to load jobs', 'Close', {
            duration: 3000,
            panelClass: 'snack-error',
          });
        },
      });
  }

  onHangfireToggle(enabled: boolean): void {
    if (!this.canEdit || this.hangfireSaving) return;
    this.hangfireSaving = true;
    this.service
      .updateHangfire({ isEnabled: enabled })
      .pipe(
        finalize(() => {
          this.hangfireSaving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (res) => {
          this.hangfireEnabled = res?.isEnabled ?? enabled;
          this.snackBar.open(
            this.hangfireEnabled ? 'Hangfire enabled' : 'Hangfire disabled',
            'Close',
            { duration: 3000, panelClass: 'snack-success' },
          );
        },
        error: () => {
          this.snackBar.open('Failed to update Hangfire setting', 'Close', {
            duration: 3000,
            panelClass: 'snack-error',
          });
        },
      });
  }

  saveJob(row: JobRow): void {
    if (!this.canEdit || row.saving) return;
    const cron = (row.editingCron ?? '').trim();
    if (!cron) {
      this.snackBar.open('Cron expression is required', 'Close', {
        duration: 3000,
        panelClass: 'snack-error',
      });
      return;
    }

    row.saving = true;
    this.service
      .updateJob(row.id, {
        cronExpression: cron,
        isEnabled: row.isEnabled,
        timeZoneId: row.timeZoneId,
      })
      .pipe(
        finalize(() => {
          row.saving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (updated) => {
          row.cronExpression = updated?.cronExpression ?? cron;
          row.editingCron = row.cronExpression;
          row.isEnabled = updated?.isEnabled ?? row.isEnabled;
          row.timeZoneId = updated?.timeZoneId ?? row.timeZoneId;
          this.snackBar.open('Job updated — Hangfire synced', 'Close', {
            duration: 3000,
            panelClass: 'snack-success',
          });
        },
        error: () => {
          this.snackBar.open('Failed to update job', 'Close', {
            duration: 3000,
            panelClass: 'snack-error',
          });
        },
      });
  }

  onJobEnabledChange(row: JobRow): void {
    if (!this.canEdit) return;
    this.saveJob(row);
  }
}
