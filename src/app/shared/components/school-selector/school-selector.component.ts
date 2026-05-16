import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SchoolFilter } from '../../enums/table-filters.enum';
import { SchoolContextService, SelectedSchool } from '../../../core/services/school-context.service';
import { SchoolService } from '../../../core/services/school.service';

@Component({
  selector: 'app-school-selector',
  standalone: true,
  imports: [FormsModule, MatIconModule],
  templateUrl: './school-selector.component.html',
  styleUrl: './school-selector.component.css',
})
export class SchoolSelectorComponent implements OnInit {
  private readonly schoolService = inject(SchoolService);
  private readonly schoolContext = inject(SchoolContextService);

  schools: SelectedSchool[] = [];
  selectedId = '';
  loading = true;

  ngOnInit(): void {
    this.selectedId = this.schoolContext.selectedSchool?.id ?? '';
    this.schoolService
      .getSchools(1, 200, '', null, null, SchoolFilter.Active)
      .subscribe({
        next: (res) => {
          this.schools = (res.items ?? []).map((s) => ({
            id: String(s['id'] ?? ''),
            name: String(s['name'] ?? 'School'),
            subdomain: String(s['subdomain'] ?? ''),
          })).filter((s) => s.id && s.subdomain);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  onSchoolChange(): void {
    const school = this.schools.find((s) => s.id === this.selectedId) ?? null;
    this.schoolContext.selectSchool(school);
  }
}
