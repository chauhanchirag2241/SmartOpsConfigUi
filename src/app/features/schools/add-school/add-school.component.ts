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
import { BranchFormDialogComponent } from './branch-form-dialog.component';

type FieldItem = { key: string; full?: boolean };
type FormCard = { icon: string; title: string; subtitle?: string; grid: 'grid2' | 'grid3'; fields: FieldItem[] };

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
  private readonly snackBar = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);

  schoolForm!: FormGroup;
  currentTab = 0;
  isSaving = false;

  branches: SchoolBranch[] = [];
  branchRows: Record<string, unknown>[] = [];
  loadingBranches = false;

  branchTableConfig: DataTableConfig = {
    header: {
      title: 'Branches',
      subtitle:
        'Main Campus is created with the school. Branch saves are independent and never remove existing campuses.',
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
        { key: 'timezone' },
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
        { key: 'fax' },
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
    timezone: {
      type: 'select',
      controlName: 'timezone',
      label: 'Timezone',
      options: [
        { label: 'IST (UTC+5:30)', value: 'Asia/Kolkata' },
        { label: 'UTC', value: 'UTC' },
      ],
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
    fax: { type: 'input', controlName: 'fax', label: 'Fax', placeholder: 'Optional' },
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
      : 'Update basic details or manage branches';
  }

  get showTabs(): boolean {
    return this.mode === 'edit' || this.mode === 'view';
  }

  get tabs(): { label: string; hint: string }[] {
    if (!this.showTabs) {
      return [{ label: 'Basic', hint: 'School basic details' }];
    }
    return [
      { label: 'Basic', hint: 'School basic details' },
      { label: 'Branches', hint: 'Campuses / branches for this school' },
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
    }
    this.buildForm();
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
        error: () => {
          this.isSaving = false;
          this.snackBar.open('Failed to create school', 'Close', {
            duration: 3000,
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
      timezone: ['Asia/Kolkata'],
      googleMapsLink: [''],
      latitude: [''],
      longitude: [''],
      primaryPhone: ['', Validators.required],
      alternatePhone: [''],
      fax: [''],
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
          timezone: data['timezone'] ?? 'Asia/Kolkata',
          googleMapsLink: data['googleMapsLink'] ?? '',
          latitude: data['latitude'] ?? '',
          longitude: data['longitude'] ?? '',
          primaryPhone: data['primaryPhone'] ?? '',
          alternatePhone: data['alternatePhone'] ?? '',
          fax: data['fax'] ?? '',
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
      timezone: raw.timezone || null,
      googleMapsLink: raw.googleMapsLink || null,
      latitude: raw.latitude !== '' && raw.latitude != null ? Number(raw.latitude) : null,
      longitude: raw.longitude !== '' && raw.longitude != null ? Number(raw.longitude) : null,
      primaryPhone: raw.primaryPhone || null,
      alternatePhone: raw.alternatePhone || null,
      fax: raw.fax || null,
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
