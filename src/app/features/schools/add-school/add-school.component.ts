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
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { DynamicFieldComponent } from '../../../common/dynamic-form/components/dynamic-field/dynamic-field.component';
import { FileUploadComponent, SelectedUploadFile } from '../../../shared/components/file-upload/file-upload.component';
import type { FormFieldConfig } from '../../../common/dynamic-form/models/form-field-config';
import { SchoolPayload, SchoolService } from '../../../core/services/school.service';

type FieldItem = { key: string; full?: boolean };
type FormCard = { tab: number; icon: string; title: string; subtitle?: string; grid: 'grid2' | 'grid3'; fields: FieldItem[] };

@Component({
  selector: 'app-add-school',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatIconModule, DynamicFieldComponent, FileUploadComponent],
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
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly finalTabIndex = 5;
  protected readonly totalTabs = 6;

  schoolForm!: FormGroup;
  currentTab = 0;
  isSaving = false;

  feeHeads: string[] = ['Tuition fee', 'Admission fee', 'Exam fee', 'Library fee', 'Sports fee'];
  discountTypes: string[] = ['Merit scholarship', 'Staff ward', 'Sibling discount', 'RTE'];
  paymentMethodOptions = ['Cash', 'UPI', 'Bank transfer / NEFT', 'Cheque', 'Card (POS)', 'Online gateway', 'DD'];
  selectedPaymentMethods = new Set(['Cash', 'UPI', 'Bank transfer / NEFT', 'Cheque']);

  branches: { id?: string; name: string; email?: string; address?: string; isHeadOffice?: boolean }[] = [];

  readonly tabs = [
    { label: 'Basic', hint: 'Step 1 of 6 — Basic information' },
    { label: 'Branding', hint: 'Step 2 of 6 — Branding & portal identity' },
    { label: 'Academic', hint: 'Step 3 of 6 — Academic configuration' },
    { label: 'Fees', hint: 'Step 4 of 6 — Fees & payment setup' },
    { label: 'Portal', hint: 'Step 5 of 6 — Portal & module settings' },
    { label: 'Branches', hint: 'Step 6 of 6 — Branches' },
  ];

  readonly footerHints = [
    'Enter school identity and contact details',
    'Configure branding and subdomain',
    'Set academic year and attendance rules',
    'Define fee heads and payment methods',
    'Enable portal modules and security',
    'Review branches before creating the school',
  ];

  readonly portalToggles = [
    { key: 'parentPortal', label: 'Parent portal', desc: 'Parents can view attendance, results, fees, notices' },
    { key: 'studentPortal', label: 'Student portal', desc: 'Students can view timetable, results, homework' },
    { key: 'onlineFeePayment', label: 'Online fee payment', desc: 'Parents can pay fees via payment gateway' },
    { key: 'noticeBoard', label: 'Notice board', desc: 'Publish announcements visible to parents and students' },
    { key: 'homeworkModule', label: 'Homework module', desc: 'Teachers can assign and track homework' },
    { key: 'libraryModule', label: 'Library module', desc: 'Book catalog, issue/return tracking' },
    { key: 'transportModule', label: 'Transport module', desc: 'Bus routes, GPS tracking, driver management' },
    { key: 'canteenModule', label: 'Canteen module', desc: 'Meal plans, wallet, order tracking' },
    { key: 'smsNotifications', label: 'SMS notifications', desc: 'Attendance, fee dues, exam results via SMS' },
    { key: 'emailNotifications', label: 'Email notifications', desc: 'Detailed reports and notices via email' },
    { key: 'pushNotifications', label: 'Push notifications (app)', desc: 'Mobile app push alerts' },
    { key: 'whatsappNotifications', label: 'WhatsApp notifications', desc: 'Automated WhatsApp messages via API' },
    { key: 'twoFactorAuth', label: 'Two-factor authentication', desc: 'Require 2FA for admin and principal roles' },
    { key: 'ipWhitelist', label: 'IP whitelist', desc: 'Restrict admin access to specific IP addresses' },
    { key: 'branchDataIsolation', label: 'Branch-wise data isolation', desc: 'Each branch has its own student, staff and fee data' },
    { key: 'sharedFeeStructure', label: 'Shared fee structure across branches', desc: 'All branches use same fee heads and amounts' },
    { key: 'centralAdminView', label: 'Central admin can view all branches', desc: 'Super admin sees consolidated reports' },
  ];

  readonly configs: Record<string, FormFieldConfig> = {
    name: { type: 'input', controlName: 'name', label: 'School name', placeholder: 'e.g. Delhi Public School', validations: [{ name: 'required', message: 'Required', validator: Validators.required }] },
    schoolCode: { type: 'input', controlName: 'schoolCode', label: 'School code', placeholder: 'e.g. DPS-001', validations: [{ name: 'required', message: 'Required', validator: Validators.required }] },
    registrationNumber: { type: 'input', controlName: 'registrationNumber', label: 'Registration number', placeholder: 'Govt. registration no.' },
    affiliatedBoard: { type: 'select', controlName: 'affiliatedBoard', label: 'Affiliated board', options: this.boardOptions(), validations: [{ name: 'required', message: 'Required', validator: Validators.required }] },
    schoolType: { type: 'select', controlName: 'schoolType', label: 'School type', options: this.schoolTypeOptions(), validations: [{ name: 'required', message: 'Required', validator: Validators.required }] },
    establishedYear: { type: 'input', inputType: 'number', controlName: 'establishedYear', label: 'Established year', placeholder: 'e.g. 1985' },
    aboutSchool: { type: 'textarea', controlName: 'aboutSchool', label: 'About school', placeholder: 'Brief description...' },
    streetAddress: { type: 'input', controlName: 'streetAddress', label: 'Street address', placeholder: 'Building, street, area', validations: [{ name: 'required', message: 'Required', validator: Validators.required }] },
    city: { type: 'input', controlName: 'city', label: 'City', placeholder: 'e.g. Ahmedabad', validations: [{ name: 'required', message: 'Required', validator: Validators.required }] },
    state: { type: 'select', controlName: 'state', label: 'State', options: this.stateOptions(), validations: [{ name: 'required', message: 'Required', validator: Validators.required }] },
    pincode: { type: 'input', controlName: 'pincode', label: 'Pincode', placeholder: '6-digit pincode', validations: [{ name: 'required', message: 'Required', validator: Validators.required }] },
    country: { type: 'input', controlName: 'country', label: 'Country', disabled: true, defaultValue: 'India' },
    timezone: { type: 'select', controlName: 'timezone', label: 'Timezone', options: [{ label: 'IST (UTC+5:30)', value: 'IST' }, { label: 'UTC', value: 'UTC' }] },
    googleMapsLink: { type: 'input', controlName: 'googleMapsLink', label: 'Google Maps link', placeholder: 'maps.google.com/...' },
    latitude: { type: 'input', inputType: 'number', controlName: 'latitude', label: 'Latitude', placeholder: 'e.g. 23.0225' },
    longitude: { type: 'input', inputType: 'number', controlName: 'longitude', label: 'Longitude', placeholder: 'e.g. 72.5714' },
    primaryPhone: { type: 'input', inputType: 'tel', controlName: 'primaryPhone', label: 'Primary phone', placeholder: '10-digit', validations: [{ name: 'required', message: 'Required', validator: Validators.required }] },
    alternatePhone: { type: 'input', inputType: 'tel', controlName: 'alternatePhone', label: 'Alternate phone', placeholder: '10-digit' },
    fax: { type: 'input', controlName: 'fax', label: 'Fax', placeholder: 'Fax number' },
    primaryEmail: { type: 'input', inputType: 'email', controlName: 'primaryEmail', label: 'Primary email', placeholder: 'info@school.com', validations: [{ name: 'required', message: 'Required', validator: Validators.required }, { name: 'email', message: 'Invalid email', validator: Validators.email }] },
    principalEmail: { type: 'input', inputType: 'email', controlName: 'principalEmail', label: 'Principal email', placeholder: 'principal@school.com' },
    website: { type: 'input', controlName: 'website', label: 'Website', placeholder: 'https://www.school.com' },
    tagline: { type: 'input', controlName: 'tagline', label: 'School tagline / motto', placeholder: 'e.g. Excellence in Education' },
    shortName: { type: 'input', controlName: 'shortName', label: 'Short name', placeholder: 'e.g. DPS' },
    subdomain: { type: 'input', controlName: 'subdomain', label: 'School subdomain', placeholder: 'dps-ahmedabad', validations: [{ name: 'required', message: 'Required', validator: Validators.required }] },
    customDomain: { type: 'input', controlName: 'customDomain', label: 'Custom domain (optional)', placeholder: 'school.com' },
    sslCertificate: { type: 'select', controlName: 'sslCertificate', label: 'SSL certificate', options: [{ label: "Auto (Let's Encrypt)", value: 'auto' }, { label: 'Custom SSL', value: 'custom' }] },
    academicYearFormat: { type: 'select', controlName: 'academicYearFormat', label: 'Academic year format', options: [{ label: 'April – March (2025-26)', value: 'april-march' }, { label: 'June – May (2025-26)', value: 'june-may' }, { label: 'January – December (2026)', value: 'jan-dec' }, { label: 'Custom', value: 'custom' }] },
    currentAcademicYear: { type: 'select', controlName: 'currentAcademicYear', label: 'Current academic year', options: [{ label: '2025-26', value: '2025-26' }, { label: '2026-27', value: '2026-27' }] },
    gradingSystem: { type: 'select', controlName: 'gradingSystem', label: 'Grading system', options: [{ label: 'Marks (0-100)', value: 'marks' }, { label: 'Grade (A-F)', value: 'grade' }, { label: 'CGPA (0-10)', value: 'cgpa' }] },
    passingPercentage: { type: 'input', inputType: 'number', controlName: 'passingPercentage', label: 'Passing percentage', placeholder: '33' },
    workingDaysPerWeek: { type: 'select', controlName: 'workingDaysPerWeek', label: 'Working days/week', options: [{ label: '5 days (Mon–Fri)', value: '5' }, { label: '6 days (Mon–Sat)', value: '6' }] },
    schoolTiming: { type: 'input', controlName: 'schoolTiming', label: 'School timing', placeholder: 'e.g. 8:00 AM – 2:30 PM' },
    classesFrom: { type: 'select', controlName: 'classesFrom', label: 'Classes offered (from)', options: [{ label: 'Nursery', value: 'Nursery' }, { label: 'Class 1', value: 'Class 1' }, { label: 'Class 6', value: 'Class 6' }] },
    classesTo: { type: 'select', controlName: 'classesTo', label: 'Classes offered (to)', options: [{ label: 'Class 10', value: 'Class 10' }, { label: 'Class 12', value: 'Class 12' }] },
    sectionsPerClass: { type: 'input', inputType: 'number', controlName: 'sectionsPerClass', label: 'Sections per class', placeholder: '3' },
    sectionNaming: { type: 'select', controlName: 'sectionNaming', label: 'Section naming', options: [{ label: 'Alphabetical (A, B, C...)', value: 'alpha' }, { label: 'Numerical (1, 2, 3...)', value: 'numeric' }] },
    maxStudentsPerSection: { type: 'input', inputType: 'number', controlName: 'maxStudentsPerSection', label: 'Max students per section', placeholder: '40' },
    admissionNumberFormat: { type: 'input', controlName: 'admissionNumberFormat', label: 'Admission number format', placeholder: 'ADM-{YEAR}-{SEQ}' },
    attendanceType: { type: 'select', controlName: 'attendanceType', label: 'Attendance type', options: [{ label: 'Daily', value: 'daily' }, { label: 'Period-wise', value: 'period' }, { label: 'Both', value: 'both' }] },
    minimumAttendancePercent: { type: 'input', inputType: 'number', controlName: 'minimumAttendancePercent', label: 'Minimum attendance %', placeholder: '75' },
    lateMarkAfterMinutes: { type: 'input', inputType: 'number', controlName: 'lateMarkAfterMinutes', label: 'Late mark after (mins)', placeholder: '15' },
    currency: { type: 'select', controlName: 'currency', label: 'Currency', options: [{ label: 'INR (₹)', value: 'INR' }, { label: 'USD ($)', value: 'USD' }] },
    paymentCycle: { type: 'select', controlName: 'paymentCycle', label: 'Payment cycle', options: [{ label: 'Annual', value: 'annual' }, { label: 'Quarterly', value: 'quarterly' }, { label: 'Monthly', value: 'monthly' }] },
    feeDueDay: { type: 'input', inputType: 'number', controlName: 'feeDueDay', label: 'Due date (day of month)', placeholder: '10' },
    lateFeeType: { type: 'select', controlName: 'lateFeeType', label: 'Late fee type', options: [{ label: 'Fixed amount', value: 'fixed' }, { label: 'Percentage per day', value: 'percent' }, { label: 'None', value: 'none' }] },
    lateFeeValue: { type: 'input', inputType: 'number', controlName: 'lateFeeValue', label: 'Late fee value', placeholder: '50' },
    gracePeriodDays: { type: 'input', inputType: 'number', controlName: 'gracePeriodDays', label: 'Grace period (days)', placeholder: '5' },
    schemaName: { type: 'input', controlName: 'schemaName', label: 'Schema name (auto)', disabled: true },
    storagePlan: { type: 'select', controlName: 'storagePlan', label: 'Storage plan', options: [{ label: 'Starter (5 GB)', value: 'starter' }, { label: 'Standard (20 GB)', value: 'standard' }, { label: 'Professional (100 GB)', value: 'pro' }] },
    dataRegion: { type: 'select', controlName: 'dataRegion', label: 'Data region', options: [{ label: 'India (Mumbai)', value: 'in-mumbai' }, { label: 'Singapore', value: 'sg' }] },
    sessionTimeoutMinutes: { type: 'input', inputType: 'number', controlName: 'sessionTimeoutMinutes', label: 'Session timeout (mins)', placeholder: '60' },
    passwordPolicy: { type: 'select', controlName: 'passwordPolicy', label: 'Password policy', options: [{ label: 'Standard (8+ chars)', value: 'standard' }, { label: 'Strong (12+ chars)', value: 'strong' }] },
    loginAttemptsBeforeLock: { type: 'input', inputType: 'number', controlName: 'loginAttemptsBeforeLock', label: 'Login attempts before lock', placeholder: '5' },
  };

  readonly formCards: FormCard[] = [
    { tab: 0, icon: 'apartment', title: 'School identity', grid: 'grid2', fields: [
      { key: 'name' }, { key: 'schoolCode' }, { key: 'registrationNumber' }, { key: 'affiliatedBoard' },
      { key: 'schoolType' }, { key: 'establishedYear' }, { key: 'aboutSchool', full: true },
    ]},
    { tab: 0, icon: 'location_on', title: 'Address & location', grid: 'grid3', fields: [
      { key: 'streetAddress', full: true }, { key: 'city' }, { key: 'state' }, { key: 'pincode' },
      { key: 'country' }, { key: 'timezone' }, { key: 'googleMapsLink' }, { key: 'latitude' }, { key: 'longitude' },
    ]},
    { tab: 0, icon: 'phone', title: 'Contact details', grid: 'grid3', fields: [
      { key: 'primaryPhone' }, { key: 'alternatePhone' }, { key: 'fax' },
      { key: 'primaryEmail' }, { key: 'principalEmail' }, { key: 'website' },
    ]},
    { tab: 1, icon: 'palette', title: 'Brand colors', subtitle: 'Colors used in portal, reports, and certificates', grid: 'grid2', fields: [] },
    { tab: 2, icon: 'calendar_month', title: 'Academic year', grid: 'grid3', fields: [
      { key: 'academicYearFormat' }, { key: 'currentAcademicYear' }, { key: 'gradingSystem' },
      { key: 'passingPercentage' }, { key: 'workingDaysPerWeek' }, { key: 'schoolTiming' },
    ]},
    { tab: 2, icon: 'school', title: 'Classes & sections', grid: 'grid3', fields: [
      { key: 'classesFrom' }, { key: 'classesTo' }, { key: 'sectionsPerClass' },
      { key: 'sectionNaming' }, { key: 'maxStudentsPerSection' }, { key: 'admissionNumberFormat' },
    ]},
    { tab: 2, icon: 'how_to_reg', title: 'Attendance settings', grid: 'grid3', fields: [
      { key: 'attendanceType' }, { key: 'minimumAttendancePercent' }, { key: 'lateMarkAfterMinutes' },
    ]},
    { tab: 3, icon: 'payments', title: 'Fee configuration', grid: 'grid3', fields: [
      { key: 'currency' }, { key: 'paymentCycle' }, { key: 'feeDueDay' },
      { key: 'lateFeeType' }, { key: 'lateFeeValue' }, { key: 'gracePeriodDays' },
    ]},
    { tab: 4, icon: 'storage', title: 'Database & tenant', grid: 'grid3', fields: [
      { key: 'schemaName' }, { key: 'storagePlan' }, { key: 'dataRegion' },
    ]},
    { tab: 4, icon: 'lock', title: 'Security settings', grid: 'grid3', fields: [
      { key: 'sessionTimeoutMinutes' }, { key: 'passwordPolicy' }, { key: 'loginAttemptsBeforeLock' },
    ]},
  ];

  ngOnInit(): void {
    this.buildForm();
    this.schoolForm.get('name')?.valueChanges.subscribe(() => this.onNameInput());
    if (this.schoolId) {
      this.loadSchool(this.schoolId);
    } else {
      this.branches = [];
    }
  }

  get pageTitle(): string {
    if (this.mode === 'edit') return 'Edit school';
    if (this.mode === 'view') return 'View school';
    return 'Create new school';
  }

  get pageSubtitle(): string {
    return this.mode === 'add' ? 'Multi-branch school setup — all tabs required' : 'School configuration';
  }

  get progressWidthPercent(): number {
    return ((this.currentTab + 1) / this.totalTabs) * 100;
  }

  get cardsForCurrentTab(): FormCard[] {
    return this.formCards.filter((c) => c.tab === this.currentTab);
  }

  get headOfficeName(): string {
    const name = this.schoolForm?.get('name')?.value;
    return name ? `${name} — Main Campus` : 'Main Campus';
  }

  trackFormCard(_index: number, card: FormCard): string {
    return `${card.tab}-${card.title}`;
  }

  goTab(index: number): void {
    this.currentTab = index;
  }

  nextTab(): void {
    if (this.currentTab === this.finalTabIndex) {
      this.saveSchool();
      return;
    }
    this.currentTab++;
  }

  prevTab(): void {
    if (this.currentTab > 0) {
      this.currentTab--;
    }
  }

  onNameInput(): void {
    const name = (this.schoolForm.get('name')?.value as string) ?? '';
    const sub = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    this.schoolForm.patchValue({
      subdomain: sub,
      schemaName: sub ? `school_${sub.replace(/-/g, '_')}` : '',
    }, { emitEvent: false });
  }

  togglePaymentMethod(method: string): void {
    if (this.mode === 'view') return;
    if (this.selectedPaymentMethods.has(method)) {
      this.selectedPaymentMethods.delete(method);
    } else {
      this.selectedPaymentMethods.add(method);
    }
  }

  isPaymentMethodSelected(method: string): boolean {
    return this.selectedPaymentMethods.has(method);
  }

  getPortalValue(key: string): boolean {
    return !!this.schoolForm.get(key)?.value;
  }

  togglePortal(key: string): void {
    if (this.mode === 'view') return;
    const control = this.schoolForm.get(key);
    if (control) {
      control.setValue(!control.value);
    }
  }

  addFeeHead(): void {
    this.feeHeads.push('');
  }

  removeFeeHead(index: number): void {
    if (this.feeHeads.length > 1) {
      this.feeHeads.splice(index, 1);
    }
  }

  addDiscountType(): void {
    this.discountTypes.push('');
  }

  removeDiscountType(index: number): void {
    if (this.discountTypes.length > 1) {
      this.discountTypes.splice(index, 1);
    }
  }

  addBranch(): void {
    this.branches.push({ name: '', email: '', address: '' });
  }

  onLogoSelected(file: SelectedUploadFile): void {
    if (file.previewUrl) {
      this.schoolForm.patchValue({ logoUrl: file.previewUrl });
    }
  }

  onFaviconSelected(file: SelectedUploadFile): void {
    if (file.previewUrl) {
      this.schoolForm.patchValue({ faviconUrl: file.previewUrl });
    }
  }

  removeBranch(index: number): void {
    this.branches.splice(index, 1);
  }

  saveSchool(): void {
    if (this.mode === 'view') {
      this.cancel.emit();
      return;
    }

    if (this.schoolForm.invalid) {
      this.schoolForm.markAllAsTouched();
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000, panelClass: 'snack-error' });
      return;
    }

    this.isSaving = true;
    const raw = this.schoolForm.getRawValue();
    const portalSettings: Record<string, boolean> = {};
    for (const t of this.portalToggles) {
      portalSettings[t.key] = !!raw[t.key];
    }

    const payload: SchoolPayload = {
      name: raw.name,
      subdomain: raw.subdomain,
      schoolCode: raw.schoolCode,
      registrationNumber: raw.registrationNumber,
      affiliatedBoard: raw.affiliatedBoard,
      schoolType: raw.schoolType,
      establishedYear: raw.establishedYear ? Number(raw.establishedYear) : null,
      aboutSchool: raw.aboutSchool,
      streetAddress: raw.streetAddress,
      city: raw.city,
      state: raw.state,
      pincode: raw.pincode,
      country: raw.country ?? 'India',
      timezone: raw.timezone,
      googleMapsLink: raw.googleMapsLink,
      latitude: raw.latitude ? Number(raw.latitude) : null,
      longitude: raw.longitude ? Number(raw.longitude) : null,
      primaryPhone: raw.primaryPhone,
      alternatePhone: raw.alternatePhone,
      fax: raw.fax,
      primaryEmail: raw.primaryEmail,
      principalEmail: raw.principalEmail,
      website: raw.website,
      tagline: raw.tagline,
      shortName: raw.shortName,
      primaryColor: raw.primaryColor || '#639922',
      secondaryColor: raw.secondaryColor,
      accentColor: raw.accentColor,
      textOnPrimary: raw.textOnPrimary,
      customDomain: raw.customDomain,
      sslCertificate: raw.sslCertificate,
      academicYearFormat: raw.academicYearFormat,
      currentAcademicYear: raw.currentAcademicYear,
      gradingSystem: raw.gradingSystem,
      passingPercentage: raw.passingPercentage ? Number(raw.passingPercentage) : null,
      workingDaysPerWeek: raw.workingDaysPerWeek,
      schoolTiming: raw.schoolTiming,
      classesFrom: raw.classesFrom,
      classesTo: raw.classesTo,
      sectionsPerClass: raw.sectionsPerClass ? Number(raw.sectionsPerClass) : null,
      sectionNaming: raw.sectionNaming,
      maxStudentsPerSection: raw.maxStudentsPerSection ? Number(raw.maxStudentsPerSection) : null,
      admissionNumberFormat: raw.admissionNumberFormat,
      attendanceType: raw.attendanceType,
      minimumAttendancePercent: raw.minimumAttendancePercent ? Number(raw.minimumAttendancePercent) : null,
      lateMarkAfterMinutes: raw.lateMarkAfterMinutes ? Number(raw.lateMarkAfterMinutes) : null,
      autoNotifyParentsOnAbsence: !!raw.autoNotifyParentsOnAbsence,
      allowBackdatedAttendance: !!raw.allowBackdatedAttendance,
      currency: raw.currency,
      paymentCycle: raw.paymentCycle,
      feeDueDay: raw.feeDueDay ? Number(raw.feeDueDay) : null,
      lateFeeType: raw.lateFeeType,
      lateFeeValue: raw.lateFeeValue ? Number(raw.lateFeeValue) : null,
      gracePeriodDays: raw.gracePeriodDays ? Number(raw.gracePeriodDays) : null,
      feeHeads: this.feeHeads.filter(Boolean),
      discountTypes: this.discountTypes.filter(Boolean),
      paymentMethods: [...this.selectedPaymentMethods],
      portalSettings,
      schemaName: raw.schemaName,
      storagePlan: raw.storagePlan,
      dataRegion: raw.dataRegion,
      sessionTimeoutMinutes: raw.sessionTimeoutMinutes ? Number(raw.sessionTimeoutMinutes) : null,
      passwordPolicy: raw.passwordPolicy,
      loginAttemptsBeforeLock: raw.loginAttemptsBeforeLock ? Number(raw.loginAttemptsBeforeLock) : null,
      twoFactorEnabled: !!raw.twoFactorAuth,
      ipWhitelistEnabled: !!raw.ipWhitelist,
      branchDataIsolation: !!raw.branchDataIsolation,
      sharedFeeStructure: !!raw.sharedFeeStructure,
      centralAdminViewAllBranches: !!raw.centralAdminView,
      branches: this.branches.filter((b) => b.name?.trim()).map((b) => ({
        id: b.id,
        name: b.name,
        email: b.email,
        address: b.address,
        isHeadOffice: b.isHeadOffice,
      })),
    };

    const entityPayload = this.toEntityPayload(payload);
    const onDone = () => {
      this.isSaving = false;
      this.cdr.detectChanges();
    };
    const onSuccess = () => {
      this.snackBar.open(`School ${this.mode === 'edit' ? 'updated' : 'created'} successfully`, 'Close', {
        duration: 3000,
        panelClass: 'snack-success',
      });
      this.saved.emit();
    };
    const onError = () => {
      this.snackBar.open('Failed to save school', 'Close', { duration: 3000, panelClass: 'snack-error' });
    };

    if (this.mode === 'edit' && this.schoolId) {
      this.schoolService.updateSchool(this.schoolId, entityPayload).subscribe({
        next: () => {
          onSuccess();
          onDone();
        },
        error: () => {
          onError();
          onDone();
        },
      });
    } else {
      this.schoolService.createSchool(payload).subscribe({
        next: () => {
          onSuccess();
          onDone();
        },
        error: () => {
          onError();
          onDone();
        },
      });
    }
  }

  private buildForm(): void {
    this.schoolForm = this.fb.group({
      name: ['', Validators.required],
      schoolCode: ['', Validators.required],
      registrationNumber: [''],
      affiliatedBoard: ['', Validators.required],
      schoolType: ['', Validators.required],
      establishedYear: [''],
      aboutSchool: [''],
      streetAddress: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      pincode: ['', Validators.required],
      country: [{ value: 'India', disabled: true }],
      timezone: ['IST'],
      googleMapsLink: [''],
      latitude: [''],
      longitude: [''],
      primaryPhone: ['', Validators.required],
      alternatePhone: [''],
      fax: [''],
      primaryEmail: ['', [Validators.required, Validators.email]],
      principalEmail: [''],
      website: [''],
      tagline: [''],
      shortName: [''],
      logoUrl: [''],
      faviconUrl: [''],
      primaryColor: ['#639922'],
      secondaryColor: ['#3B6D11'],
      accentColor: ['#EAF3DE'],
      textOnPrimary: ['#ffffff'],
      subdomain: ['', Validators.required],
      customDomain: [''],
      sslCertificate: ['auto'],
      academicYearFormat: ['april-march'],
      currentAcademicYear: ['2025-26'],
      gradingSystem: ['marks'],
      passingPercentage: [33],
      workingDaysPerWeek: ['5'],
      schoolTiming: [''],
      classesFrom: ['Nursery'],
      classesTo: ['Class 12'],
      sectionsPerClass: [3],
      sectionNaming: ['alpha'],
      maxStudentsPerSection: [40],
      admissionNumberFormat: ['ADM-{YEAR}-{SEQ}'],
      attendanceType: ['daily'],
      minimumAttendancePercent: [75],
      lateMarkAfterMinutes: [15],
      autoNotifyParentsOnAbsence: [true],
      allowBackdatedAttendance: [false],
      currency: ['INR'],
      paymentCycle: ['annual'],
      feeDueDay: [10],
      lateFeeType: ['fixed'],
      lateFeeValue: [50],
      gracePeriodDays: [5],
      schemaName: [{ value: '', disabled: true }],
      storagePlan: ['starter'],
      dataRegion: ['in-mumbai'],
      sessionTimeoutMinutes: [60],
      passwordPolicy: ['standard'],
      loginAttemptsBeforeLock: [5],
      parentPortal: [true],
      studentPortal: [true],
      onlineFeePayment: [false],
      noticeBoard: [true],
      homeworkModule: [true],
      libraryModule: [true],
      transportModule: [false],
      canteenModule: [false],
      smsNotifications: [true],
      emailNotifications: [true],
      pushNotifications: [true],
      whatsappNotifications: [false],
      twoFactorAuth: [false],
      ipWhitelist: [false],
      branchDataIsolation: [true],
      sharedFeeStructure: [false],
      centralAdminView: [true],
    });
  }

  private loadSchool(id: string): void {
    this.schoolService.getSchoolById(id).subscribe({
      next: (data) => this.patchForm(data),
      error: () => this.snackBar.open('Failed to load school', 'Close', { duration: 3000 }),
    });
  }

  private patchForm(data: Record<string, unknown>): void {
    const portal = this.parseJson<Record<string, boolean>>(data['portalSettingsJson'] as string);
    this.schoolForm.patchValue({
      ...data,
      parentPortal: portal?.['parentPortal'] ?? true,
      studentPortal: portal?.['studentPortal'] ?? true,
      onlineFeePayment: portal?.['onlineFeePayment'] ?? false,
      noticeBoard: portal?.['noticeBoard'] ?? true,
      homeworkModule: portal?.['homeworkModule'] ?? true,
      libraryModule: portal?.['libraryModule'] ?? true,
      transportModule: portal?.['transportModule'] ?? false,
      canteenModule: portal?.['canteenModule'] ?? false,
      smsNotifications: portal?.['smsNotifications'] ?? true,
      emailNotifications: portal?.['emailNotifications'] ?? true,
      pushNotifications: portal?.['pushNotifications'] ?? true,
      whatsappNotifications: portal?.['whatsappNotifications'] ?? false,
      twoFactorAuth: data['twoFactorEnabled'] ?? false,
      ipWhitelist: data['ipWhitelistEnabled'] ?? false,
      centralAdminView: data['centralAdminViewAllBranches'] ?? true,
    });

    this.feeHeads = this.parseJson<string[]>(data['feeHeadsJson'] as string) ?? this.feeHeads;
    this.discountTypes = this.parseJson<string[]>(data['discountTypesJson'] as string) ?? this.discountTypes;
    const methods = this.parseJson<string[]>(data['paymentMethodsJson'] as string);
    if (methods?.length) {
      this.selectedPaymentMethods = new Set(methods);
    }

    const branchList = data['branches'] as { id?: string; name: string; email?: string; address?: string; isHeadOffice?: boolean }[] | undefined;
    this.branches = (branchList ?? []).filter((b) => !b.isHeadOffice);

    if (this.mode === 'view') {
      this.schoolForm.disable();
    }
    this.cdr.detectChanges();
  }

  private parseJson<T>(value: string | null | undefined): T | null {
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  private boardOptions() {
    return ['CBSE', 'ICSE', 'GSEB', 'State Board', 'IB', 'IGCSE'].map((v) => ({ label: v, value: v }));
  }

  private schoolTypeOptions() {
    return ['Government', 'Private', 'Semi-government', 'Trust-based', 'International'].map((v) => ({ label: v, value: v }));
  }

  private stateOptions() {
    return ['Gujarat', 'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Rajasthan', 'UP'].map((v) => ({ label: v, value: v }));
  }

  private toEntityPayload(payload: SchoolPayload): Record<string, unknown> {
    return {
      ...payload,
      id: this.schoolId,
      feeHeadsJson: JSON.stringify(payload.feeHeads ?? []),
      discountTypesJson: JSON.stringify(payload.discountTypes ?? []),
      paymentMethodsJson: JSON.stringify(payload.paymentMethods ?? []),
      portalSettingsJson: JSON.stringify(payload.portalSettings ?? {}),
      branches: [
        {
          name: `${payload.name} — Main Campus`,
          isHeadOffice: true,
        },
        ...(payload.branches ?? []),
      ],
    };
  }
}
