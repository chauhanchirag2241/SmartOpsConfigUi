import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DynamicFormComponent } from '../../../common/dynamic-form/components/dynamic-form/dynamic-form.component';
import { FormFieldConfig } from '../../../common/dynamic-form/models/form-field-config';
import { SchoolService, School } from '../../../core/services/school.service';
import { Location } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-school-add-edit',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent, MatSnackBarModule, MatIconModule],
  template: `
    <header class="page-header" style="margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
      <button (click)="goBack()" style="background: none; border: none; cursor: pointer;">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <div class="header-info">
        <h1>{{ isEditMode ? 'Edit School' : 'Add New School' }}</h1>
      </div>
    </header>
    <div style="background: #fff; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <app-dynamic-form 
        [config]="formConfig" 
        [initialData]="initialData" 
        [submitLabel]="isEditMode ? 'Update' : 'Save'"
        (formSubmit)="onSubmit($event)"
        (formCancel)="goBack()">
      </app-dynamic-form>
    </div>
  `
})
export class SchoolAddEditComponent implements OnInit {
  isEditMode = false;
  schoolId: string | null = null;
  initialData: any = {};

  formConfig: FormFieldConfig[] = [
    { type: 'input', inputType: 'text', controlName: 'schoolName', label: 'School Name', validations: [{ name: 'required', validator: Validators.required, message: 'Required' }] },
    { type: 'input', inputType: 'text', controlName: 'schoolCode', label: 'School Code', validations: [{ name: 'required', validator: Validators.required, message: 'Required' }] },
    { type: 'input', inputType: 'email', controlName: 'email', label: 'Email', validations: [{ name: 'required', validator: Validators.required, message: 'Required' }] },
    { type: 'input', inputType: 'tel', controlName: 'phone', label: 'Phone', validations: [{ name: 'required', validator: Validators.required, message: 'Required' }] },
    { type: 'textarea', controlName: 'address', label: 'Address', validations: [{ name: 'required', validator: Validators.required, message: 'Required' }] },
    { type: 'input', inputType: 'text', controlName: 'city', label: 'City', validations: [{ name: 'required', validator: Validators.required, message: 'Required' }] },
    { type: 'input', inputType: 'text', controlName: 'state', label: 'State', validations: [{ name: 'required', validator: Validators.required, message: 'Required' }] },
    { type: 'input', inputType: 'text', controlName: 'country', label: 'Country', validations: [{ name: 'required', validator: Validators.required, message: 'Required' }] },
    { type: 'input', inputType: 'text', controlName: 'pincode', label: 'Pincode', validations: [{ name: 'required', validator: Validators.required, message: 'Required' }] },
    { type: 'input', inputType: 'text', controlName: 'principalName', label: 'Principal Name', validations: [{ name: 'required', validator: Validators.required, message: 'Required' }] },
    { type: 'checkbox', controlName: 'status', label: 'Is Active' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private schoolService: SchoolService,
    private snackBar: MatSnackBar,
    private location: Location
  ) {}

  ngOnInit() {
    this.schoolId = this.route.snapshot.paramMap.get('id');
    if (this.schoolId) {
      this.isEditMode = true;
      this.schoolService.getSchoolById(this.schoolId).subscribe(school => {
        if (school) {
          this.initialData = school;
        }
      });
    } else {
        this.initialData = { status: true };
    }
  }

  onSubmit(data: any) {
    console.log('Saved:', data);
    this.snackBar.open(this.isEditMode ? 'School updated' : 'School created', 'Close', { duration: 3000 });
    this.goBack();
  }

  goBack() {
    this.location.back();
  }
}
