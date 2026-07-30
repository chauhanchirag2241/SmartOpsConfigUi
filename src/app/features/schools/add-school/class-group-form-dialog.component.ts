import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import {
  ClassGroupPayload,
  ClassGroupRow,
  ClassGroupService,
} from '../../../core/services/class-group.service';
import { SchoolBranch } from '../../../core/services/school.service';
import { FormFieldComponent } from '../../../shared/form-controls/form-field';
import type { FormFieldOption } from '../../../shared/form-controls/form-field';

export interface ClassGroupFormDialogData {
  schoolId: string;
  branches: SchoolBranch[];
  group?: ClassGroupRow;
}

@Component({
  selector: 'app-class-group-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule, FormFieldComponent],
  template: `
    <div class="dialog-header">
      <div>
        <div class="dialog-title">{{ data.group ? 'Edit class group' : 'Add class group' }}</div>
        <div class="dialog-sub">
          {{
            data.group
              ? 'Update class name and description'
              : 'Create a class group for this school. Sections are added later in SmartOps.'
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
        label="Branch"
        type="select"
        [required]="true"
        [(ngModel)]="branchId"
        [options]="branchOptions"
        emptyOptionLabel="Select branch"
      />
      <app-form-field
        label="Class name"
        type="text"
        [required]="true"
        [(ngModel)]="className"
        placeholder="e.g. Class 1"
        (keyup.enter)="save()"
      />
      <app-form-field
        label="Description"
        type="textarea"
        [rows]="3"
        [(ngModel)]="description"
        placeholder="Optional notes"
      />
    </div>

    <div class="dialog-actions">
      <button type="button" class="btn-outline" [disabled]="saving" (click)="close()">
        Cancel
      </button>
      <button type="button" class="btn-primary" [disabled]="saving" (click)="save()">
        <mat-icon>save</mat-icon>
        {{ saving ? 'Saving...' : data.group ? 'Update group' : 'Add group' }}
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
export class ClassGroupFormDialogComponent {
  private readonly classGroupService = inject(ClassGroupService);
  private readonly cdr = inject(ChangeDetectorRef);

  branchId = '';
  className = '';
  description = '';
  saving = false;
  error = '';

  readonly branchOptions: FormFieldOption[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly data: ClassGroupFormDialogData,
    private readonly dialogRef: MatDialogRef<ClassGroupFormDialogComponent>,
  ) {
    this.branchId = data.group?.branchId ?? data.branches[0]?.id ?? '';
    this.className = data.group?.className ?? '';
    this.description = data.group?.description ?? '';
    this.branchOptions = data.branches.map((branch) => ({
      label: branch.name,
      value: branch.id,
    }));
  }

  close(): void {
    if (!this.saving) {
      this.dialogRef.close(false);
    }
  }

  save(): void {
    const className = this.className.trim();
    if (!this.branchId) {
      this.error = 'Branch is required.';
      this.cdr.detectChanges();
      return;
    }
    if (!className) {
      this.error = 'Class name is required.';
      this.cdr.detectChanges();
      return;
    }

    const payload: ClassGroupPayload = {
      branchId: this.branchId,
      className,
      description: this.description.trim() || null,
    };

    this.saving = true;
    this.error = '';
    this.cdr.detectChanges();

    const req$: Observable<unknown> = this.data.group
      ? this.classGroupService.updateSchoolClassGroup(this.data.schoolId, this.data.group.id, payload)
      : this.classGroupService.createSchoolClassGroup(this.data.schoolId, payload);

    req$.subscribe({
      next: () => {
        this.saving = false;
        this.dialogRef.close(true);
      },
      error: (err: unknown) => {
        this.saving = false;
        const e = err as { error?: string | { title?: string; message?: string }; message?: string };
        this.error =
          typeof e?.error === 'string'
            ? e.error
            : (typeof e?.error === 'object'
                ? e.error?.title || e.error?.message
                : undefined) ||
              e?.message ||
              'Failed to save class group';
        this.cdr.detectChanges();
      },
    });
  }
}
