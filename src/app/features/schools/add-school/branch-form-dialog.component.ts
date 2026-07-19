import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {
  SchoolBranch,
  SchoolService,
} from '../../../core/services/school.service';

export interface BranchFormDialogData {
  schoolId: string;
  branch?: SchoolBranch;
}

@Component({
  selector: 'app-branch-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule],
  template: `
    <div class="dialog-header">
      <div>
        <div class="dialog-title">{{ data.branch ? 'Edit branch' : 'Add branch' }}</div>
        <div class="dialog-sub">
          {{ data.branch ? 'Update campus details' : 'Create a new campus for this school' }}
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

      <div class="field">
        <label>Branch name <span class="req">*</span></label>
        <input
          type="text"
          [(ngModel)]="name"
          placeholder="e.g. West Campus"
          autofocus
          (keyup.enter)="save()"
        />
      </div>
      <div class="field">
        <label>Email</label>
        <input type="email" [(ngModel)]="email" placeholder="branch@school.com" />
      </div>
      <div class="field">
        <label>Address</label>
        <textarea
          [(ngModel)]="address"
          rows="3"
          placeholder="Campus address"
        ></textarea>
      </div>
    </div>

    <div class="dialog-actions">
      <button type="button" class="btn-outline" [disabled]="saving" (click)="close()">
        Cancel
      </button>
      <button type="button" class="btn-primary" [disabled]="saving" (click)="save()">
        <mat-icon>save</mat-icon>
        {{ saving ? 'Saving...' : data.branch ? 'Update branch' : 'Add branch' }}
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
      .field {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .field label {
        color: var(--text-secondary, #6b7280);
        font-size: 11px;
        font-weight: 500;
      }
      .field input,
      .field textarea {
        box-sizing: border-box;
        width: 100%;
        border: 1px solid var(--border-color, #d1d5db);
        border-radius: 7px;
        padding: 8px 10px;
        background: var(--input-bg, #fff);
        color: inherit;
        font: inherit;
        font-size: 12px;
        outline: none;
      }
      .field input:focus,
      .field textarea:focus {
        border-color: var(--primary-color, #639922);
      }
      .field textarea {
        resize: vertical;
      }
      .req {
        color: #a32d2d;
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
export class BranchFormDialogComponent {
  private readonly schoolService = inject(SchoolService);

  name = '';
  email = '';
  address = '';
  saving = false;
  error = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly data: BranchFormDialogData,
    private readonly dialogRef: MatDialogRef<BranchFormDialogComponent>,
  ) {
    this.name = data.branch?.name ?? '';
    this.email = data.branch?.email ?? '';
    this.address = data.branch?.address ?? '';
  }

  close(): void {
    if (!this.saving) {
      this.dialogRef.close(false);
    }
  }

  save(): void {
    if (!this.name.trim()) {
      this.error = 'Branch name is required.';
      return;
    }

    this.error = '';
    this.saving = true;
    const payload = {
      name: this.name.trim(),
      email: this.email.trim() || null,
      address: this.address.trim() || null,
    };
    const request = this.data.branch
      ? this.schoolService.updateBranch(
          this.data.schoolId,
          this.data.branch.id,
          payload,
        )
      : this.schoolService.addBranch(this.data.schoolId, payload);

    request.subscribe({
      next: (branch) => this.dialogRef.close(branch),
      error: (err) => {
        this.saving = false;
        this.error = typeof err?.error === 'string' ? err.error : 'Failed to save branch';
      },
    });
  }
}
