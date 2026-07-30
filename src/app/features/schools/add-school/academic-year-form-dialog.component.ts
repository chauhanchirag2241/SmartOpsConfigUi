import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import {
  AcademicYearPayload,
  AcademicYearRow,
  AcademicYearService,
} from '../../../core/services/academic-year.service';
import { FormFieldComponent } from '../../../shared/form-controls/form-field';

export interface AcademicYearFormDialogData {
  schoolId: string;
  year?: AcademicYearRow;
}

@Component({
  selector: 'app-academic-year-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule, FormFieldComponent],
  template: `
    <div class="dialog-header">
      <div>
        <div class="dialog-title">{{ data.year ? 'Edit academic year' : 'Add academic year' }}</div>
        <div class="dialog-sub">
          {{
            data.year
              ? 'Update title and date range'
              : 'Dates must not overlap another academic year. Current year is derived from the date range.'
          }}
        </div>
      </div>
      <button type="button" class="icon-btn" [disabled]="saving" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <div class="dialog-body">
      @if (error) {
        <div class="error-banner">{{ error }}</div>
      }

      <app-form-field
        label="Title"
        type="text"
        [required]="true"
        [(ngModel)]="title"
        placeholder="e.g. 2026-27"
        (keyup.enter)="save()"
      />
      <app-form-field
        label="Start date"
        type="date"
        [required]="true"
        [(ngModel)]="startDate"
      />
      <app-form-field
        label="End date"
        type="date"
        [required]="true"
        [(ngModel)]="endDate"
      />
    </div>

    <div class="dialog-actions">
      <button type="button" class="btn-outline" [disabled]="saving" (click)="close()">
        Cancel
      </button>
      <button type="button" class="btn-primary" [disabled]="saving" (click)="save()">
        <mat-icon>save</mat-icon>
        {{ saving ? 'Saving...' : data.year ? 'Update year' : 'Add year' }}
      </button>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: min(520px, calc(100vw - 32px));
        color: var(--text-primary, #1a1a1a);
      }
      .dialog-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding: 18px 20px 14px;
        border-bottom: 1px solid var(--border-color, #e5e7eb);
      }
      .dialog-title {
        font-size: 16px;
        font-weight: 600;
      }
      .dialog-sub {
        margin-top: 3px;
        color: var(--text-secondary, #6b7280);
        font-size: 11px;
      }
      .icon-btn {
        display: inline-flex;
        padding: 3px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: var(--text-secondary, #6b7280);
        cursor: pointer;
      }
      .icon-btn:hover {
        background: #f3f4f6;
      }
      .icon-btn mat-icon {
        width: 18px;
        height: 18px;
        font-size: 18px;
      }
      .dialog-body {
        display: grid;
        gap: 13px;
        padding: 18px 20px;
      }
      .error-banner {
        border-radius: 7px;
        padding: 8px 10px;
        background: #fcebeb;
        color: #a32d2d;
        font-size: 11px;
      }
      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 12px 20px 18px;
        border-top: 1px solid var(--border-color, #e5e7eb);
      }
      .btn-primary,
      .btn-outline {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        border-radius: 7px;
        padding: 7px 14px;
        font-size: 12px;
        cursor: pointer;
      }
      .btn-primary {
        border: 0;
        background: var(--primary-color, #639922);
        color: #fff;
      }
      .btn-outline {
        border: 1px solid var(--border-color, #d1d5db);
        background: transparent;
        color: var(--text-secondary, #6b7280);
      }
      button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .btn-primary mat-icon {
        width: 15px;
        height: 15px;
        font-size: 15px;
      }
    `,
  ],
})
export class AcademicYearFormDialogComponent {
  private readonly ayService = inject(AcademicYearService);
  private readonly cdr = inject(ChangeDetectorRef);

  title = '';
  startDate = '';
  endDate = '';
  saving = false;
  error = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly data: AcademicYearFormDialogData,
    private readonly dialogRef: MatDialogRef<AcademicYearFormDialogComponent>,
  ) {
    this.title = data.year?.title ?? '';
    this.startDate = this.toDateInput(data.year?.startDate);
    this.endDate = this.toDateInput(data.year?.endDate);
  }

  close(): void {
    if (!this.saving) {
      this.dialogRef.close(false);
    }
  }

  save(): void {
    const title = this.title.trim();
    if (!title) {
      this.error = 'Title is required.';
      this.cdr.detectChanges();
      return;
    }
    if (!this.startDate || !this.endDate) {
      this.error = 'Start date and end date are required.';
      this.cdr.detectChanges();
      return;
    }
    if (this.endDate < this.startDate) {
      this.error = 'End date cannot be earlier than start date.';
      this.cdr.detectChanges();
      return;
    }

    this.error = '';
    this.saving = true;
    this.cdr.detectChanges();
    const payload: AcademicYearPayload = {
      title,
      startDate: this.startDate,
      endDate: this.endDate,
    };
    const request: Observable<unknown> = this.data.year
      ? this.ayService.updateSchoolAcademicYear(this.data.schoolId, this.data.year.id, payload)
      : this.ayService.createSchoolAcademicYear(this.data.schoolId, payload);

    request.subscribe({
      next: () => this.dialogRef.close(true),
      error: (err: unknown) => {
        this.saving = false;
        const e = err as { error?: string | { message?: string } };
        this.error =
          typeof e?.error === 'string'
            ? e.error
            : (typeof e?.error === 'object' ? e.error?.message : undefined) ||
              'Failed to save academic year';
        this.cdr.detectChanges();
      },
    });
  }

  private toDateInput(value?: string): string {
    if (!value) return '';
    return String(value).slice(0, 10);
  }
}
