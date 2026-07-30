import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../../core/services/notification.service';

import { DynamicFieldComponent } from '../../../common/dynamic-form/components/dynamic-field/dynamic-field.component';
import type { FormFieldConfig } from '../../../common/dynamic-form/models/form-field-config';
import {
  DataTableAction,
  DataTableConfig,
  DynamicTableComponent,
} from '../../../common/dynamic-table/components/dynamic-table';
import {
  SchoolBranch,
  SchoolPayload,
  SchoolService,
} from '../../../core/services/school.service';
import {
  AcademicYearRow,
  AcademicYearService,
} from '../../../core/services/academic-year.service';
import {
  ClassGroupRow,
  ClassGroupService,
} from '../../../core/services/class-group.service';
import { SettingsService } from '../../../core/services/settings.service';
import { BranchFormDialogComponent } from './branch-form-dialog.component';
import { AcademicYearFormDialogComponent } from './academic-year-form-dialog.component';
import { ClassGroupFormDialogComponent } from './class-group-form-dialog.component';
import { PageChromeDirective } from '../../../shared/directives/page-chrome.directive';

const ATTENDANCE_EMPLOYEE_TYPE_KEY = 'attendance.employee.type';

type FieldItem = { key: string; full?: boolean };
type FormCard = { icon: string; title: string; subtitle?: string; grid: 'grid2' | 'grid3'; fields: FieldItem[] };
type AttendanceEmployeeType = 'Manual' | 'Face' | 'Both';

@Component({
  selector: 'app-add-school',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatDialogModule,
    DynamicFieldComponent,
    DynamicTableComponent,
    PageChromeDirective,
  ],
  templateUrl: './add-school.component.html',
  styleUrl: './add-school.component.css',
})
export class AddSchoolComponent implements OnInit {
  @Input() mode: 'add' | 'edit' | 'view' = 'add';
  @Input() schoolId?: string;
  @Output() cancel = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly schoolService = inject(SchoolService);
  private readonly academicYearService = inject(AcademicYearService);
  private readonly classGroupService = inject(ClassGroupService);
  private readonly settingsService = inject(SettingsService);
  private readonly snackBar = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);

  schoolForm!: FormGroup;
  settingsForm!: FormGroup;
  currentTab = 0;
  isSaving = false;
  isSavingSettings = false;
  loadingSettings = false;
  settingsLoaded = false;

  branches: SchoolBranch[] = [];
  branchRows: Record<string, unknown>[] = [];
  loadingBranches = false;

  academicYears: AcademicYearRow[] = [];
  academicYearRows: Record<string, unknown>[] = [];
  loadingAcademicYears = false;

  classGroups: ClassGroupRow[] = [];
  classGroupRows: Record<string, unknown>[] = [];
  loadingClassGroups = false;

  readonly attendanceTypeConfig: FormFieldConfig = {
    type: 'select',
    controlName: 'employeeAttendanceType',
    label: 'Employee attendance type',
    options: [
      { label: 'Manual', value: 'Manual' },
      { label: 'Face Recognition', value: 'Face' },
      { label: 'Both', value: 'Both' },
    ],
  };

  branchTableConfig: DataTableConfig = {
    header: {
      title: '',
      showAddButton: true,
      addButtonText: 'Add branch',
      addButtonIcon: 'add',
      addButtonClass: 'btn-primary',
    },
    columns: [
      {
        key: 'branch',
        label: 'Branch',
        sortable: true,
        cellType: 'avatar',
        toggleable: false,
        avatarConfig: {
          nameKey: 'name',
          subtitleKey: 'emailDisplay',
        },
      },
      { key: 'addressDisplay', label: 'Address', sortable: true },
      {
        key: 'type',
        label: 'Type',
        cellType: 'badge',
        badgeMap: {
          'Main Campus': { cssClass: 'b-green', label: 'Main Campus' },
          Branch: { cssClass: 'b-gray', label: 'Branch' },
        },
      },
    ],
    actions: [
      { label: 'Edit branch', icon: 'edit', iconColor: '#1E40AF' },
      {
        label: 'Delete branch',
        icon: 'delete',
        danger: true,
        separatorBefore: true,
      },
    ],
    searchPlaceholder: 'Search branches...',
    searchKeys: ['name', 'email', 'address'],
    itemLabel: 'branches',
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50],
    selectable: false,
    showExport: false,
  };

  classGroupTableConfig: DataTableConfig = {
    header: {
      title: '',
      showAddButton: true,
      addButtonText: 'Add class group',
      addButtonIcon: 'add',
      addButtonClass: 'btn-primary',
    },
    columns: [
      { key: 'branchName', label: 'Branch', sortable: true },
      { key: 'className', label: 'Class name', sortable: true },
      { key: 'descriptionDisplay', label: 'Description', sortable: false },
      {
        key: 'status',
        label: 'Status',
        cellType: 'badge',
        badgeMap: {
          Active: { cssClass: 'b-green', label: 'Active' },
          Inactive: { cssClass: 'b-red', label: 'Inactive' },
        },
      },
    ],
    actions: [
      { label: 'Edit class group', icon: 'edit', iconColor: '#1E40AF' },
      {
        label: 'Delete class group',
        icon: 'delete',
        danger: true,
        separatorBefore: true,
      },
    ],
    searchPlaceholder: 'Search class groups...',
    searchKeys: ['branchName', 'className', 'description'],
    itemLabel: 'class groups',
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50],
    selectable: false,
    showExport: false,
  };

  academicYearTableConfig: DataTableConfig = {
    header: {
      title: '',
      showAddButton: true,
      addButtonText: 'Add year',
      addButtonIcon: 'add',
      addButtonClass: 'btn-primary',
    },
    columns: [
      { key: 'title', label: 'Title', sortable: true },
      { key: 'startDate', label: 'Start date', sortable: true, cellType: 'date' },
      { key: 'endDate', label: 'End date', sortable: true, cellType: 'date' },
      {
        key: 'status',
        label: 'Status',
        cellType: 'badge',
        badgeMap: {
          Current: { cssClass: 'b-green', label: 'Current' },
          Upcoming: { cssClass: 'b-amber', label: 'Upcoming' },
          Past: { cssClass: 'b-blue', label: 'Past' },
          Deleted: { cssClass: 'b-red', label: 'Deleted' },
        },
      },
    ],
    actions: [
      { label: 'Edit year', icon: 'edit', iconColor: '#1E40AF' },
      {
        label: 'Delete year',
        icon: 'delete',
        danger: true,
        separatorBefore: true,
      },
    ],
    searchPlaceholder: 'Search academic years...',
    searchKeys: ['title'],
    itemLabel: 'academic years',
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50],
    selectable: false,
    showExport: false,
  };

  readonly formCards: FormCard[] = [
    {
      icon: 'apartment',
      title: 'School identity',
      grid: 'grid2',
      fields: [
        { key: 'name' },
        { key: 'schoolCode' },
        { key: 'subdomain', full: true },
        { key: 'registrationNumber' },
        { key: 'affiliatedBoard' },
        { key: 'schoolType' },
        { key: 'establishedYear' },
        { key: 'aboutSchool', full: true },
      ],
    },
    {
      icon: 'location_on',
      title: 'Address & location',
      grid: 'grid2',
      fields: [
        { key: 'streetAddress', full: true },
        { key: 'city' },
        { key: 'state' },
        { key: 'pincode' },
        { key: 'country' },
        { key: 'googleMapsLink', full: true },
        { key: 'latitude' },
        { key: 'longitude' },
      ],
    },
    {
      icon: 'call',
      title: 'Contact',
      grid: 'grid2',
      fields: [
        { key: 'primaryPhone' },
        { key: 'alternatePhone' },
        { key: 'primaryEmail' },
        { key: 'principalEmail' },
        { key: 'website', full: true },
      ],
    },
  ];

  readonly configs: Record<string, FormFieldConfig> = {
    name: {
      type: 'input',
      controlName: 'name',
      label: 'School name',
      placeholder: 'e.g. Delhi Public School',
      validations: [{ name: 'required', message: 'Required', validator: Validators.required }],
    },
    schoolCode: {
      type: 'input',
      controlName: 'schoolCode',
      label: 'School code',
      placeholder: 'e.g. DPS-001',
      validations: [{ name: 'required', message: 'Required', validator: Validators.required }],
    },
    subdomain: {
      type: 'input',
      controlName: 'subdomain',
      label: 'Subdomain',
      placeholder: 'e.g. dps-ahmedabad',
      validations: [{ name: 'required', message: 'Required', validator: Validators.required }],
    },
    registrationNumber: {
      type: 'input',
      controlName: 'registrationNumber',
      label: 'Registration number',
      placeholder: 'Govt. registration no.',
    },
    affiliatedBoard: {
      type: 'select',
      controlName: 'affiliatedBoard',
      label: 'Affiliated board',
      options: this.boardOptions(),
      validations: [{ name: 'required', message: 'Required', validator: Validators.required }],
    },
    schoolType: {
      type: 'select',
      controlName: 'schoolType',
      label: 'School type',
      options: this.schoolTypeOptions(),
      validations: [{ name: 'required', message: 'Required', validator: Validators.required }],
    },
    establishedYear: {
      type: 'input',
      inputType: 'number',
      controlName: 'establishedYear',
      label: 'Established year',
      placeholder: 'e.g. 1985',
    },
    aboutSchool: {
      type: 'textarea',
      controlName: 'aboutSchool',
      label: 'About school',
      placeholder: 'Brief description...',
    },
    streetAddress: {
      type: 'input',
      controlName: 'streetAddress',
      label: 'Street address',
      placeholder: 'Building, street, area',
      validations: [{ name: 'required', message: 'Required', validator: Validators.required }],
    },
    city: {
      type: 'input',
      controlName: 'city',
      label: 'City',
      placeholder: 'e.g. Ahmedabad',
      validations: [{ name: 'required', message: 'Required', validator: Validators.required }],
    },
    state: {
      type: 'select',
      controlName: 'state',
      label: 'State',
      options: this.stateOptions(),
      validations: [{ name: 'required', message: 'Required', validator: Validators.required }],
    },
    pincode: {
      type: 'input',
      controlName: 'pincode',
      label: 'Pincode',
      placeholder: 'e.g. 380001',
      validations: [{ name: 'required', message: 'Required', validator: Validators.required }],
    },
    country: {
      type: 'input',
      controlName: 'country',
      label: 'Country',
      placeholder: 'India',
      validations: [{ name: 'required', message: 'Required', validator: Validators.required }],
    },
    googleMapsLink: {
      type: 'input',
      controlName: 'googleMapsLink',
      label: 'Google Maps link',
      placeholder: 'maps.google.com/...',
    },
    latitude: {
      type: 'input',
      inputType: 'number',
      controlName: 'latitude',
      label: 'Latitude',
      placeholder: 'e.g. 23.0225',
    },
    longitude: {
      type: 'input',
      inputType: 'number',
      controlName: 'longitude',
      label: 'Longitude',
      placeholder: 'e.g. 72.5714',
    },
    primaryPhone: {
      type: 'input',
      controlName: 'primaryPhone',
      label: 'Primary phone',
      placeholder: '+91...',
      validations: [{ name: 'required', message: 'Required', validator: Validators.required }],
    },
    alternatePhone: {
      type: 'input',
      controlName: 'alternatePhone',
      label: 'Alternate phone',
      placeholder: '+91...',
    },
    primaryEmail: {
      type: 'input',
      inputType: 'email',
      controlName: 'primaryEmail',
      label: 'Primary email',
      placeholder: 'admin@school.com',
      validations: [{ name: 'required', message: 'Required', validator: Validators.required }],
    },
    principalEmail: {
      type: 'input',
      inputType: 'email',
      controlName: 'principalEmail',
      label: 'Principal email',
      placeholder: 'principal@school.com',
    },
    website: {
      type: 'input',
      controlName: 'website',
      label: 'Website',
      placeholder: 'https://...',
    },
  };

  get pageTitle(): string {
    if (this.mode === 'edit') return 'Edit school';
    if (this.mode === 'view') return 'View school';
    return 'Create new school';
  }

  get pageSubtitle(): string {
    return this.mode === 'add'
      ? 'Enter basic school details — Main Campus is created automatically'
      : 'Update basic details, branches, or academic years';
  }

  get showTabs(): boolean {
    return this.mode === 'edit' || this.mode === 'view';
  }

  get tabs(): { label: string }[] {
    if (!this.showTabs) {
      return [{ label: 'Basic' }];
    }
    return [
      { label: 'Basic' },
      { label: 'Branches' },
      { label: 'Academic Years' },
      { label: 'Class Groups' },
      { label: 'Settings' },
    ];
  }

  ngOnInit(): void {
    if (this.mode === 'view') {
      this.branchTableConfig = {
        ...this.branchTableConfig,
        header: {
          ...this.branchTableConfig.header!,
          showAddButton: false,
        },
        actions: [],
      };
      this.academicYearTableConfig = {
        ...this.academicYearTableConfig,
        header: {
          ...this.academicYearTableConfig.header!,
          showAddButton: false,
        },
        actions: [],
      };
      this.classGroupTableConfig = {
        ...this.classGroupTableConfig,
        header: {
          ...this.classGroupTableConfig.header!,
          showAddButton: false,
        },
        actions: [],
      };
    }
    this.buildForm();
    this.buildSettingsForm();
    this.schoolForm.get('name')?.valueChanges.subscribe(() => this.onNameInput());
    if (this.schoolId) {
      this.loadSchool(this.schoolId);
    }
  }

  goTab(index: number): void {
    this.currentTab = index;
    if (index === 1 && this.schoolId) {
      this.loadBranches();
    }
    if (index === 2 && this.schoolId) {
      this.loadAcademicYears();
    }
    if (index === 3 && this.schoolId) {
      if (this.branches.length === 0) {
        this.loadBranches();
      }
      this.loadClassGroups();
    }
    if (index === 4 && this.schoolId) {
      this.loadAttendanceSettings();
    }
  }

  trackFormCard(_index: number, card: FormCard): string {
    return card.title;
  }

  onNameInput(): void {
    if (this.mode === 'edit' || this.mode === 'view') return;
    const name = (this.schoolForm.get('name')?.value as string) ?? '';
    const sub = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    this.schoolForm.patchValue(
      {
        subdomain: sub,
        schemaName: sub ? `school_${sub.replace(/-/g, '_')}` : '',
      },
      { emitEvent: false },
    );
  }

  saveSchool(): void {
    if (this.mode === 'view') return;
    if (this.schoolForm.invalid) {
      this.schoolForm.markAllAsTouched();
      this.snackBar.open('Please fill required fields', 'Close', {
        duration: 3000,
        panelClass: 'snack-error',
      });
      return;
    }

    const payload = this.buildPayload();
    this.isSaving = true;

    if (this.mode === 'edit' && this.schoolId) {
      this.schoolService.updateSchool(this.schoolId, { ...payload, id: this.schoolId }).subscribe({
        next: () => {
          this.isSaving = false;
          this.snackBar.open('School updated successfully', 'Close', {
            duration: 3000,
            panelClass: 'snack-success',
          });
          this.saved.emit();
          this.cdr.detectChanges();
        },
        error: () => {
          this.isSaving = false;
          this.snackBar.open('Failed to update school', 'Close', {
            duration: 3000,
            panelClass: 'snack-error',
          });
          this.cdr.detectChanges();
        },
      });
    } else {
      this.schoolService.createSchool(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.snackBar.open('School created successfully', 'Close', {
            duration: 3000,
            panelClass: 'snack-success',
          });
          this.saved.emit();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isSaving = false;
          const apiMessage =
            err?.error?.message || err?.error?.title || err?.message || 'Failed to create school';
          this.snackBar.open(String(apiMessage), 'Close', {
            duration: 5000,
            panelClass: 'snack-error',
          });
          this.cdr.detectChanges();
        },
      });
    }
  }

  loadBranches(): void {
    if (!this.schoolId) return;
    this.loadingBranches = true;
    this.schoolService.getBranches(this.schoolId).subscribe({
      next: (branches) => {
        this.branches = branches ?? [];
        this.branchRows = this.branches.map((branch) => ({
          ...branch,
          branch: branch.name,
          emailDisplay: branch.email || 'No email',
          addressDisplay: branch.address || '—',
          type: branch.isHeadOffice ? 'Main Campus' : 'Branch',
        }));
        this.loadingBranches = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingBranches = false;
        this.snackBar.open('Failed to load branches', 'Close', {
          duration: 3000,
          panelClass: 'snack-error',
        });
        this.cdr.detectChanges();
      },
    });
  }

  openAddBranch(): void {
    this.openBranchDialog();
  }

  openEditBranch(branch: SchoolBranch): void {
    this.openBranchDialog(branch);
  }

  onBranchTableAction(event: {
    action: DataTableAction;
    row: Record<string, unknown>;
    rowIndex: number;
  }): void {
    const branch = this.branches.find((item) => item.id === event.row['id']);
    if (!branch) return;

    if (event.action.label === 'Edit branch') {
      this.openEditBranch(branch);
      return;
    }

    if (event.action.label === 'Delete branch') {
      if (branch.isHeadOffice) {
        this.snackBar.open('Main Campus cannot be deleted', 'Close', {
          duration: 3000,
          panelClass: 'snack-error',
        });
        return;
      }
      this.deleteBranch(branch);
    }
  }

  deleteBranch(branch: SchoolBranch): void {
    if (!this.schoolId || branch.isHeadOffice) return;
    if (!confirm(`Delete branch "${branch.name}"?`)) return;

    this.schoolService.deleteBranch(this.schoolId, branch.id).subscribe({
      next: () => {
        this.snackBar.open('Branch deleted', 'Close', {
          duration: 2500,
          panelClass: 'snack-success',
        });
        this.loadBranches();
      },
      error: (err) =>
        this.snackBar.open(
          typeof err?.error === 'string' ? err.error : 'Failed to delete branch',
          'Close',
          { duration: 3500, panelClass: 'snack-error' },
        ),
    });
  }

  loadAcademicYears(): void {
    if (!this.schoolId) return;
    this.loadingAcademicYears = true;
    this.academicYearService.getSchoolAcademicYears(this.schoolId, 1, 100).subscribe({
      next: (res) => {
        this.academicYears = res?.items ?? [];
        this.academicYearRows = this.academicYears.map((year) => ({
          ...year,
          startDate: String(year.startDate ?? '').slice(0, 10),
          endDate: String(year.endDate ?? '').slice(0, 10),
        }));
        this.loadingAcademicYears = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingAcademicYears = false;
        this.snackBar.open('Failed to load academic years', 'Close', {
          duration: 3000,
          panelClass: 'snack-error',
        });
        this.cdr.detectChanges();
      },
    });
  }

  openAddAcademicYear(): void {
    this.openAcademicYearDialog();
  }

  onAcademicYearTableAction(event: {
    action: DataTableAction;
    row: Record<string, unknown>;
    rowIndex: number;
  }): void {
    const year = this.academicYears.find((item) => item.id === event.row['id']);
    if (!year) return;

    if (event.action.label === 'Edit year') {
      this.openAcademicYearDialog(year);
      return;
    }

    if (event.action.label === 'Delete year') {
      this.deleteAcademicYear(year);
    }
  }

  deleteAcademicYear(year: AcademicYearRow): void {
    if (!this.schoolId) return;
    if (year.isCurrent || year.status === 'Current') {
      this.snackBar.open('Cannot delete the current academic year', 'Close', {
        duration: 3000,
        panelClass: 'snack-error',
      });
      return;
    }
    if (!confirm(`Delete academic year "${year.title}"?`)) return;

    this.academicYearService.deleteSchoolAcademicYear(this.schoolId, year.id).subscribe({
      next: () => {
        this.snackBar.open('Academic year deleted', 'Close', {
          duration: 2500,
          panelClass: 'snack-success',
        });
        this.loadAcademicYears();
      },
      error: (err) =>
        this.snackBar.open(
          typeof err?.error === 'string' ? err.error : 'Failed to delete academic year',
          'Close',
          { duration: 3500, panelClass: 'snack-error' },
        ),
    });
  }

  loadClassGroups(): void {
    if (!this.schoolId) return;
    this.loadingClassGroups = true;
    this.classGroupService.getSchoolClassGroups(this.schoolId).subscribe({
      next: (res) => {
        this.classGroups = res?.items ?? [];
        this.classGroupRows = this.classGroups.map((group) => ({
          ...group,
          descriptionDisplay: group.description || '—',
        }));
        this.loadingClassGroups = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingClassGroups = false;
        this.snackBar.open('Failed to load class groups', 'Close', {
          duration: 3000,
          panelClass: 'snack-error',
        });
        this.cdr.detectChanges();
      },
    });
  }

  openAddClassGroup(): void {
    this.openClassGroupDialog();
  }

  onClassGroupTableAction(event: {
    action: DataTableAction;
    row: Record<string, unknown>;
    rowIndex: number;
  }): void {
    const group = this.classGroups.find((item) => item.id === event.row['id']);
    if (!group) return;

    if (event.action.label === 'Edit class group') {
      this.openClassGroupDialog(group);
      return;
    }

    if (event.action.label === 'Delete class group') {
      this.deleteClassGroup(group);
    }
  }

  deleteClassGroup(group: ClassGroupRow): void {
    if (!this.schoolId) return;
    if (!confirm(`Delete class group "${group.className}"?`)) return;

    this.classGroupService.deleteSchoolClassGroup(this.schoolId, group.id).subscribe({
      next: () => {
        this.snackBar.open('Class group deleted', 'Close', {
          duration: 2500,
          panelClass: 'snack-success',
        });
        this.loadClassGroups();
      },
      error: (err) =>
        this.snackBar.open(
          typeof err?.error === 'string' ? err.error : 'Failed to delete class group',
          'Close',
          { duration: 3500, panelClass: 'snack-error' },
        ),
    });
  }

  private openClassGroupDialog(group?: ClassGroupRow): void {
    if (!this.schoolId) return;

    const open = (branches: SchoolBranch[]) => {
      if (branches.length === 0) {
        this.snackBar.open('Add a branch before creating class groups', 'Close', {
          duration: 3000,
          panelClass: 'snack-error',
        });
        return;
      }

      const ref = this.dialog.open(ClassGroupFormDialogComponent, {
        width: '520px',
        disableClose: true,
        data: {
          schoolId: this.schoolId!,
          branches,
          group,
        },
      });

      ref.afterClosed().subscribe((saved) => {
        if (saved) {
          this.snackBar.open(group ? 'Class group updated' : 'Class group created', 'Close', {
            duration: 2500,
            panelClass: 'snack-success',
          });
          this.loadClassGroups();
        }
      });
    };

    if (this.branches.length > 0) {
      open(this.branches);
      return;
    }

    this.schoolService.getBranches(this.schoolId).subscribe({
      next: (branches) => {
        this.branches = branches ?? [];
        open(this.branches);
      },
      error: () =>
        this.snackBar.open('Failed to load branches', 'Close', {
          duration: 3000,
          panelClass: 'snack-error',
        }),
    });
  }

  loadAttendanceSettings(): void {
    if (!this.schoolId || this.settingsLoaded || this.loadingSettings) return;

    this.loadingSettings = true;
    this.settingsService.getAttendanceSettings(this.schoolId).subscribe({
      next: (rows) => {
        const map = new Map(rows.map((r) => [r.key, r.value]));
        const raw = map.get(ATTENDANCE_EMPLOYEE_TYPE_KEY) ?? 'Both';
        const value = this.normalizeAttendanceType(raw);
        this.settingsForm.patchValue({ employeeAttendanceType: value });
        this.settingsLoaded = true;
        this.loadingSettings = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.settingsForm.patchValue({ employeeAttendanceType: 'Both' });
        this.settingsLoaded = true;
        this.loadingSettings = false;
        this.snackBar.open('Failed to load attendance settings', 'Close', {
          duration: 3000,
          panelClass: 'snack-error',
        });
        this.cdr.detectChanges();
      },
    });
  }

  saveAttendanceSettings(): void {
    if (this.mode === 'view' || !this.schoolId) return;
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    const type = this.settingsForm.getRawValue().employeeAttendanceType as AttendanceEmployeeType;
    this.isSavingSettings = true;
    this.settingsService
      .saveAttendanceSettings(this.schoolId, [{ key: ATTENDANCE_EMPLOYEE_TYPE_KEY, value: type }])
      .subscribe({
        next: () => {
          this.isSavingSettings = false;
          this.snackBar.open('Settings saved', 'Close', {
            duration: 3000,
            panelClass: 'snack-success',
          });
          this.cdr.detectChanges();
        },
        error: () => {
          this.isSavingSettings = false;
          this.snackBar.open('Failed to save settings', 'Close', {
            duration: 3000,
            panelClass: 'snack-error',
          });
          this.cdr.detectChanges();
        },
      });
  }

  private normalizeAttendanceType(value: string): AttendanceEmployeeType {
    if (value === 'Manual' || value === 'Face' || value === 'Both') return value;
    return 'Both';
  }

  private buildSettingsForm(): void {
    this.settingsForm = this.fb.group({
      employeeAttendanceType: ['Both' as AttendanceEmployeeType, Validators.required],
    });
    if (this.mode === 'view') {
      this.settingsForm.disable();
    }
  }

  private openBranchDialog(branch?: SchoolBranch): void {
    if (!this.schoolId) return;

    const dialogRef = this.dialog.open(BranchFormDialogComponent, {
      data: { schoolId: this.schoolId, branch },
      panelClass: 'erp-dialog',
      disableClose: true,
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((savedBranch) => {
      if (!savedBranch) return;
      this.snackBar.open(branch ? 'Branch updated' : 'Branch added', 'Close', {
        duration: 2500,
        panelClass: 'snack-success',
      });
      this.loadBranches();
    });
  }

  private openAcademicYearDialog(year?: AcademicYearRow): void {
    if (!this.schoolId) return;

    const dialogRef = this.dialog.open(AcademicYearFormDialogComponent, {
      data: { schoolId: this.schoolId, year },
      panelClass: 'erp-dialog',
      disableClose: true,
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((saved) => {
      if (!saved) return;
      this.snackBar.open(year ? 'Academic year updated' : 'Academic year added', 'Close', {
        duration: 2500,
        panelClass: 'snack-success',
      });
      this.loadAcademicYears();
    });
  }

  private buildForm(): void {
    this.schoolForm = this.fb.group({
      name: ['', Validators.required],
      schoolCode: ['', Validators.required],
      subdomain: ['', Validators.required],
      schemaName: [''],
      registrationNumber: [''],
      affiliatedBoard: ['', Validators.required],
      schoolType: ['', Validators.required],
      establishedYear: [''],
      aboutSchool: [''],
      streetAddress: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      pincode: ['', Validators.required],
      country: ['India', Validators.required],
      googleMapsLink: [''],
      latitude: [''],
      longitude: [''],
      primaryPhone: ['', Validators.required],
      alternatePhone: [''],
      primaryEmail: ['', Validators.required],
      principalEmail: [''],
      website: [''],
    });
  }

  private loadSchool(id: string): void {
    this.schoolService.getSchoolById(id).subscribe({
      next: (data) => {
        this.schoolForm.patchValue({
          name: data['name'] ?? '',
          schoolCode: data['schoolCode'] ?? '',
          subdomain: data['subdomain'] ?? '',
          schemaName: data['schemaName'] ?? '',
          registrationNumber: data['registrationNumber'] ?? '',
          affiliatedBoard: data['affiliatedBoard'] ?? '',
          schoolType: data['schoolType'] ?? '',
          establishedYear: data['establishedYear'] ?? '',
          aboutSchool: data['aboutSchool'] ?? '',
          streetAddress: data['streetAddress'] ?? '',
          city: data['city'] ?? '',
          state: data['state'] ?? '',
          pincode: data['pincode'] ?? '',
          country: data['country'] ?? 'India',
          googleMapsLink: data['googleMapsLink'] ?? '',
          latitude: data['latitude'] ?? '',
          longitude: data['longitude'] ?? '',
          primaryPhone: data['primaryPhone'] ?? '',
          alternatePhone: data['alternatePhone'] ?? '',
          primaryEmail: data['primaryEmail'] ?? '',
          principalEmail: data['principalEmail'] ?? '',
          website: data['website'] ?? '',
        });
        if (this.mode === 'view') {
          this.schoolForm.disable();
        }
        this.loadBranches();
        this.cdr.detectChanges();
      },
      error: () =>
        this.snackBar.open('Failed to load school', 'Close', {
          duration: 3000,
          panelClass: 'snack-error',
        }),
    });
  }

  private buildPayload(): SchoolPayload {
    const raw = this.schoolForm.getRawValue();
    return {
      name: (raw.name as string).trim(),
      subdomain: (raw.subdomain as string).trim().toLowerCase(),
      schoolCode: (raw.schoolCode as string).trim(),
      registrationNumber: raw.registrationNumber || null,
      affiliatedBoard: raw.affiliatedBoard || null,
      schoolType: raw.schoolType || null,
      establishedYear: raw.establishedYear ? Number(raw.establishedYear) : null,
      aboutSchool: raw.aboutSchool || null,
      streetAddress: raw.streetAddress || null,
      city: raw.city || null,
      state: raw.state || null,
      pincode: raw.pincode || null,
      country: raw.country || 'India',
      googleMapsLink: raw.googleMapsLink || null,
      latitude: raw.latitude !== '' && raw.latitude != null ? Number(raw.latitude) : null,
      longitude: raw.longitude !== '' && raw.longitude != null ? Number(raw.longitude) : null,
      primaryPhone: raw.primaryPhone || null,
      alternatePhone: raw.alternatePhone || null,
      primaryEmail: raw.primaryEmail || null,
      principalEmail: raw.principalEmail || null,
      website: raw.website || null,
      schemaName: raw.schemaName || null,
    };
  }

  private boardOptions() {
    return ['CBSE', 'ICSE', 'GSEB', 'State Board', 'IB', 'IGCSE'].map((v) => ({
      label: v,
      value: v,
    }));
  }

  private schoolTypeOptions() {
    return ['Government', 'Private', 'Semi-government', 'Trust-based', 'International'].map(
      (v) => ({ label: v, value: v }),
    );
  }

  private stateOptions() {
    return ['Gujarat', 'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Rajasthan', 'UP'].map(
      (v) => ({ label: v, value: v }),
    );
  }
}
