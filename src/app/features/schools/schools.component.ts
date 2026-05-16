import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AddSchoolComponent } from './add-school/add-school.component';
import { SchoolService } from '../../core/services/school.service';
import { DynamicTableComponent } from '../../common/dynamic-table/components/dynamic-table';
import { DeleteConfirmDialogComponent } from '../../shared/components/delete-confirm-dialog/delete-confirm-dialog.component';
import { SchoolFilter } from '../../shared/enums/table-filters.enum';
import type {
  DataTableAction,
  DataTableBulkAction,
  DataTableConfig,
  DataTableFilter,
} from '../../common/dynamic-table/components/dynamic-table';

@Component({
  selector: 'app-schools',
  standalone: true,
  imports: [DynamicTableComponent, MatIconModule, MatSnackBarModule, MatDialogModule, AddSchoolComponent],
  templateUrl: './schools.component.html',
  styleUrl: './schools.component.css',
})
export class SchoolsComponent implements OnInit {
  private readonly snackBar = inject(MatSnackBar);
  private readonly schoolService = inject(SchoolService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);

  showAddForm = false;
  formMode: 'add' | 'edit' | 'view' = 'add';
  selectedSchoolId?: string;
  totalSchools = 0;
  currentFilter: SchoolFilter = SchoolFilter.Active;
  schools: Record<string, unknown>[] = [];

  tableConfig: DataTableConfig = {
    header: {
      title: 'Schools',
      subtitle: 'Manage school configuration and onboarding',
      showAddButton: true,
      addButtonText: 'Add school',
      addButtonIcon: 'add',
      addButtonClass: 'btn-primary',
    },
    columns: [
      {
        key: 'school',
        label: 'School',
        sortable: true,
        cellType: 'avatar',
        toggleable: false,
        avatarConfig: {
          nameKey: 'name',
          subtitleKey: 'primaryEmail',
        },
      },
      { key: 'schoolCode', label: 'Code', sortable: true },
      { key: 'subdomain', label: 'Subdomain', sortable: true },
      { key: 'city', label: 'City', sortable: true },
      { key: 'affiliatedBoard', label: 'Board' },
      {
        key: 'isActive',
        label: 'Status',
        cellType: 'badge',
        badgeMap: {
          true: { cssClass: 'b-green', label: 'Active' },
          false: { cssClass: 'b-red', label: 'Inactive' },
        },
      },
    ],
    filters: [
      { label: 'All', icon: 'list', value: SchoolFilter.All.toString() },
      { label: 'Active', icon: 'check_circle', value: SchoolFilter.Active.toString() },
      { label: 'Inactive', icon: 'cancel', value: SchoolFilter.Inactive.toString() },
    ],
    actions: [
      { label: 'View details', icon: 'visibility', iconColor: '#639922' },
      { label: 'Edit school', icon: 'edit', iconColor: '#1E40AF' },
      { label: 'Open portal', icon: 'open_in_new', iconColor: '#6b7280' },
      { label: 'Delete school', icon: 'delete', danger: true, separatorBefore: true },
    ],
    bulkActions: [
      { label: 'Export', icon: 'download' },
      { label: 'Delete', icon: 'delete', danger: true },
    ],
    searchPlaceholder: 'Search by name, code, subdomain...',
    searchKeys: ['name', 'schoolCode', 'subdomain', 'city', 'primaryEmail'],
    itemLabel: 'schools',
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50],
  };

  ngOnInit(): void {
    this.loadSchools();
  }

  loadSchools(
    pageIndex = 1,
    pageSize = 10,
    searchQuery = '',
    sortColumn: string | null = null,
    sortDirection: string | null = null,
    filter: SchoolFilter = this.currentFilter
  ): void {
    this.schoolService.getSchools(pageIndex, pageSize, searchQuery, sortColumn, sortDirection, filter).subscribe({
      next: (res) => {
        this.schools = (res?.items ?? []).map((row) => ({
          ...row,
          school: row['name'],
        }));
        this.totalSchools = res?.totalCount ?? 0;
        this.cdr.detectChanges();
      },
      error: () => {
        this.snackBar.open('Failed to load schools', 'Close', { duration: 3000, panelClass: 'snack-error' });
      },
    });
  }

  schoolRowClass = (row: Record<string, unknown>): string =>
    row['isActive'] === false ? 'row-inactive' : '';

  openAddForm(): void {
    this.formMode = 'add';
    this.selectedSchoolId = undefined;
    this.showAddForm = true;
  }

  closeAddForm(): void {
    this.showAddForm = false;
  }

  onSchoolSaved(): void {
    this.showAddForm = false;
    this.loadSchools();
  }

  onPageChange(event: {
    pageIndex: number;
    pageSize: number;
    searchQuery: string;
    sortColumn: string | null;
    sortDirection: string | null;
    currentFilter: string | null;
  }): void {
    const filterValue = event.currentFilter
      ? (Number(event.currentFilter) as SchoolFilter)
      : this.currentFilter;
    this.loadSchools(event.pageIndex, event.pageSize, event.searchQuery, event.sortColumn, event.sortDirection, filterValue);
  }

  onFilterChanged(filter: DataTableFilter | null): void {
    this.currentFilter = filter ? (Number(filter.value) as SchoolFilter) : SchoolFilter.All;
  }

  onActionClicked(event: {
    action: DataTableAction;
    row: Record<string, unknown>;
    rowIndex: number;
  }): void {
    const id = event.row['id'] as string;

    if (event.action.label === 'View details') {
      this.formMode = 'view';
      this.selectedSchoolId = id;
      this.showAddForm = true;
    } else if (event.action.label === 'Edit school') {
      this.formMode = 'edit';
      this.selectedSchoolId = id;
      this.showAddForm = true;
    } else if (event.action.label === 'Delete school') {
      const dialogRef = this.dialog.open(DeleteConfirmDialogComponent, {
        data: {
          title: 'Delete school?',
          description: 'This will deactivate the school and its branch configuration.',
          recordName: event.row['name'] as string,
          recordMeta: `${event.row['schoolCode']} · ${event.row['subdomain']}`,
          initials: this.getInitials(event.row['name'] as string),
          warningMessage: 'Associated tenant data will remain until manually purged.',
        },
        panelClass: 'erp-dialog',
        disableClose: true,
      });

      dialogRef.afterClosed().subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.schoolService.deleteSchool(id).subscribe({
            next: () => {
              this.snackBar.open('School deleted successfully', 'Close', { duration: 3000, panelClass: 'snack-success' });
              this.loadSchools();
            },
            error: () => this.snackBar.open('Failed to delete school', 'Close', { duration: 3000, panelClass: 'snack-error' }),
          });
        }
      });
    } else if (event.action.label === 'Open portal') {
      const subdomain = event.row['subdomain'] as string;
      window.open(`https://${subdomain}.smartops.app`, '_blank');
    }
  }

  onExportClicked(): void {
    this.snackBar.open('Exporting school data...', 'Close', { duration: 3000, panelClass: 'snack-success' });
  }

  onAddButtonClicked(): void {
    this.openAddForm();
  }

  onBulkActionClicked(event: {
    action: DataTableBulkAction;
    selectedRows: Record<string, unknown>[];
  }): void {
    this.snackBar.open(`${event.action.label} → ${event.selectedRows.length} school(s)`, 'Close', {
      duration: 3000,
      panelClass: 'snack-info',
    });
  }

  private getInitials(name: string): string {
    if (!name) return 'SC';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  }
}
