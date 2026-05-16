import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DynamicTableComponent } from '../../../common/dynamic-table/components/dynamic-table/dynamic-table.component';
import { DataTableConfig, DataTableAction } from '../../../common/dynamic-table/models/table-config.interface';
import { SchoolService, School } from '../../../core/services/school.service';

@Component({
  selector: 'app-school-list',
  standalone: true,
  imports: [DynamicTableComponent, MatSnackBarModule],
  template: `<app-dynamic-table [config]="tableConfig" [serverSide]="true" [data]="schools" [totalRecords]="totalSchools" (pageChange)="onPageChange($event)" (actionClicked)="onActionClicked($event)" (addButtonClicked)="onAddButtonClicked()"></app-dynamic-table>`,
})
export class SchoolListComponent implements OnInit {
  schools: any[] = [];
  totalSchools = 0;

  constructor(
    private schoolService: SchoolService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadSchools();
  }

  loadSchools(pageIndex = 1, pageSize = 10, searchQuery = '', sortColumn = '', sortDirection = '', filter = 'All') {
    this.schoolService.getSchools(pageIndex, pageSize, searchQuery, sortColumn, sortDirection, filter).subscribe(res => {
      this.schools = res.items;
      this.totalSchools = res.totalCount;
      this.cdr.detectChanges();
    });
  }

  onPageChange(event: any) {
    this.loadSchools(event.pageIndex, event.pageSize, event.searchQuery, event.sortColumn, event.sortDirection, event.currentFilter);
  }

  onActionClicked(event: { action: DataTableAction; row: Record<string, unknown>; rowIndex: number; }) {
    if (event.action.label === 'Edit') {
      this.router.navigate(['/schools/edit', event.row['id']]);
    } else if (event.action.label === 'Details') {
      this.router.navigate(['/schools/details', event.row['id']]);
    }
  }

  onAddButtonClicked() {
    this.router.navigate(['/schools/add']);
  }

  tableConfig: DataTableConfig = {
    header: {
      title: 'Schools',
      subtitle: 'Manage system configuration for schools',
      showAddButton: true,
      addButtonText: 'Add School'
    },
    columns: [
      { key: 'schoolName', label: 'School Name', sortable: true },
      { key: 'schoolCode', label: 'Code', sortable: true },
      { key: 'principalName', label: 'Principal', sortable: true },
      { key: 'city', label: 'City' },
      {
        key: 'status',
        label: 'Status',
        cellType: 'badge',
        badgeMap: {
          'true': { cssClass: 'b-green', label: 'Active' },
          'false': { cssClass: 'b-red', label: 'Inactive' },
        },
      }
    ],
    filters: [
      { label: 'All', icon: 'list', value: 'All' },
      { label: 'Active', icon: 'check_circle', value: 'Active' },
      { label: 'Inactive', icon: 'cancel', value: 'Inactive' }
    ],
    actions: [
      { label: 'Details', icon: 'visibility' },
      { label: 'Edit', icon: 'edit' },
      { label: 'Delete', icon: 'delete', danger: true, separatorBefore: true }
    ],
    searchPlaceholder: 'Search schools by name or code...',
    searchKeys: ['schoolName', 'schoolCode']
  };
}
