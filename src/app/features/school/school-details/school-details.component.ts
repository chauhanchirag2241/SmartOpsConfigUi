import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SchoolService, School } from '../../../core/services/school.service';
import { Location, CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-school-details',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <header class="page-header" style="margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
      <button (click)="goBack()" style="background: none; border: none; cursor: pointer;">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <div class="header-info">
        <h1>School Details</h1>
      </div>
    </header>
    <div *ngIf="school" style="background: #fff; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2>{{ school.schoolName }} ({{ school.schoolCode }})</h2>
      <p><strong>Principal:</strong> {{ school.principalName }}</p>
      <p><strong>Email:</strong> {{ school.email }}</p>
      <p><strong>Phone:</strong> {{ school.phone }}</p>
      <p><strong>Address:</strong> {{ school.address }}, {{ school.city }}, {{ school.state }} {{ school.pincode }}, {{ school.country }}</p>
      <p><strong>Status:</strong> <span [style.color]="school.status ? 'green' : 'red'">{{ school.status ? 'Active' : 'Inactive' }}</span></p>
      
      <div style="margin-top: 20px;">
        <button (click)="edit()" class="btn-primary" style="margin-right: 10px;">Edit</button>
      </div>
    </div>
  `
})
export class SchoolDetailsComponent implements OnInit {
  schoolId: string | null = null;
  school: School | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private schoolService: SchoolService,
    private location: Location
  ) {}

  ngOnInit() {
    this.schoolId = this.route.snapshot.paramMap.get('id');
    if (this.schoolId) {
      this.schoolService.getSchoolById(this.schoolId).subscribe(school => {
        if (school) {
          this.school = school;
        }
      });
    }
  }

  edit() {
    if (this.schoolId) {
      this.router.navigate(['/schools/edit', this.schoolId]);
    }
  }

  goBack() {
    this.location.back();
  }
}
