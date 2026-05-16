import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

import { DynamicFieldComponent } from '../dynamic-field/dynamic-field.component';
import { FormFieldConfig } from '../../models/form-field-config';

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [DynamicFieldComponent, MatButtonModule, ReactiveFormsModule],
  templateUrl: './dynamic-form.component.html',
})
export class DynamicFormComponent implements OnInit, OnChanges {
  @Input() config: FormFieldConfig[] = [];
  @Input() initialData: any = null;
  @Input() submitLabel = 'Submit';
  @Output() readonly formSubmit = new EventEmitter<Record<string, unknown>>();
  @Output() readonly formCancel = new EventEmitter<void>();

  form!: FormGroup;
  private readonly fb = inject(FormBuilder);

  ngOnInit(): void {
    const group: Record<string, unknown[]> = {};
    this.config.forEach((field) => {
      const validators = field.validations?.map((item) => item.validator) ?? [];
      const value = this.initialData && this.initialData[field.controlName] !== undefined ? this.initialData[field.controlName] : (field.defaultValue ?? '');
      group[field.controlName] = [{ value: value, disabled: field.disabled ?? false }, validators];
    });
    this.form = this.fb.group(group);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialData'] && !changes['initialData'].firstChange && this.form) {
       this.form.patchValue(this.initialData);
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.formSubmit.emit(this.form.getRawValue() as Record<string, unknown>);
      return;
    }
    this.form.markAllAsTouched();
  }

  onCancel(): void {
    this.formCancel.emit();
  }
}
