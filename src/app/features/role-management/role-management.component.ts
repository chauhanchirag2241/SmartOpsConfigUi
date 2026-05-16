import { Component, OnInit, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { PermissionDto, RoleDto, RoleService } from '../../core/services/role.service';
import { SchoolContextService } from '../../core/services/school-context.service';
import { SchoolUserDto, UserService } from '../../core/services/user.service';
import { SchoolSelectorComponent } from '../../shared/components/school-selector/school-selector.component';

interface RoleCategory {
  label: string;
  roleId?: string;
  selected?: boolean;
}

interface Permission {
  name: string;
  key: string;
  enabled: boolean;
}

interface PermissionGroup {
  name: string;
  open: boolean;
  permissions: Permission[];
}

interface RoleModule {
  label: string;
  icon: string;
  groups: PermissionGroup[];
}

interface RoleUserRow {
  id: string;
  username: string;
  email: string;
  assigned: boolean;
}

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [MatIconModule, SchoolSelectorComponent],
  templateUrl: './role-management.component.html',
  styleUrl: './role-management.component.css',
})
export class RoleManagementComponent implements OnInit {
  private readonly roleService = inject(RoleService);
  private readonly userService = inject(UserService);
  private readonly schoolContext = inject(SchoolContextService);

  activeTab: 'info' | 'permissions' | 'users' = 'permissions';
  activeModuleIndex = 0;
  isDark = false;
  loading = true;
  saving = false;
  errorMessage = '';

  roleCategories: RoleCategory[] = [];
  allPermissions: PermissionDto[] = [];
  selectedRole: RoleDto | null = null;

  roleUserRows: RoleUserRow[] = [];
  loadingUsers = false;

  readonly modules: RoleModule[] = [
    { label: 'Students', icon: 'groups', groups: [] },
    { label: 'Attendance', icon: 'how_to_reg', groups: [] },
    { label: 'Fees', icon: 'payments', groups: [] },
    { label: 'Exams', icon: 'workspace_premium', groups: [] },
    { label: 'Teachers', icon: 'co_present', groups: [] },
    { label: 'HR & Admin', icon: 'settings', groups: [] },
  ];

  ngOnInit(): void {
    this.loadRolesAndPermissions();
    this.schoolContext.selectedSchool$.subscribe(() => {
      if (this.activeTab === 'users' && this.selectedRole) {
        this.loadRoleUsers();
      }
    });
  }

  get tabSubtitle(): string {
    if (this.activeTab === 'info') return 'Basic role setup';
    if (this.activeTab === 'users') return 'Assign users to this role';
    return 'Menu-wise permissions';
  }

  get progressWidth(): number {
    if (this.activeTab === 'info') return 33;
    if (this.activeTab === 'permissions') return 66;
    return 100;
  }

  get activeModule(): RoleModule {
    return this.modules[this.activeModuleIndex];
  }

  get totalEnabledPermissions(): number {
    return this.modules.reduce((sum, module) => sum + this.enabledCount(module), 0);
  }

  get needsSchool(): boolean {
    return this.activeTab === 'users';
  }

  get schoolReady(): boolean {
    return this.schoolContext.hasSchool;
  }

  get assignedUserCount(): number {
    return this.roleUserRows.filter((r) => r.assigned).length;
  }

  setTab(tab: 'info' | 'permissions' | 'users'): void {
    this.activeTab = tab;
    if (tab === 'users' && this.selectedRole && this.schoolReady) {
      this.loadRoleUsers();
    }
  }

  selectCategory(category: RoleCategory): void {
    this.roleCategories.forEach((item) => (item.selected = item === category));
    if (category.roleId) {
      this.roleService.getRole(category.roleId).subscribe({
        next: (role) => {
          this.applyRolePermissions(role);
          if (this.activeTab === 'users' && this.schoolReady) {
            this.loadRoleUsers();
          }
        },
        error: () => (this.errorMessage = 'Failed to load role.'),
      });
    }
  }

  selectModule(index: number): void {
    this.activeModuleIndex = index;
  }

  toggleGroup(group: PermissionGroup): void {
    group.open = !group.open;
  }

  togglePermission(permission: Permission): void {
    permission.enabled = !permission.enabled;
  }

  toggleRoleUser(row: RoleUserRow): void {
    row.assigned = !row.assigned;
  }

  selectAllActiveModule(): void {
    const shouldEnable = this.enabledCount(this.activeModule) !== this.permissionCount(this.activeModule);
    this.activeModule.groups.forEach((group) =>
      group.permissions.forEach((permission) => (permission.enabled = shouldEnable)),
    );
  }

  savePermissions(): void {
    if (!this.selectedRole) return;

    const permissionNames = this.modules
      .flatMap((m) => m.groups)
      .flatMap((g) => g.permissions)
      .filter((p) => p.enabled)
      .map((p) => p.key);

    this.saving = true;
    this.roleService.updateRolePermissions(this.selectedRole.id, permissionNames).subscribe({
      next: () => {
        this.saving = false;
        this.selectedRole = { ...this.selectedRole!, permissions: permissionNames };
      },
      error: () => {
        this.saving = false;
        this.errorMessage = 'Failed to save permissions.';
      },
    });
  }

  saveRoleUsers(): void {
    if (!this.selectedRole || !this.schoolReady) return;

    const userIds = this.roleUserRows.filter((r) => r.assigned).map((r) => r.id);
    this.saving = true;
    this.roleService.assignUsersToRole(this.selectedRole.id, userIds).subscribe({
      next: () => {
        this.saving = false;
      },
      error: () => {
        this.saving = false;
        this.errorMessage = 'Failed to save user assignments.';
      },
    });
  }

  enabledCount(module: RoleModule): number {
    return module.groups.reduce(
      (sum, group) => sum + group.permissions.filter((permission) => permission.enabled).length,
      0,
    );
  }

  permissionCount(module: RoleModule): number {
    return module.groups.reduce((sum, group) => sum + group.permissions.length, 0);
  }

  enabledGroupCount(group: PermissionGroup): number {
    return group.permissions.filter((permission) => permission.enabled).length;
  }

  trackModule(index: number, module: RoleModule): string {
    return `${index}-${module.label}`;
  }

  trackPermissionGroup(index: number, group: PermissionGroup): string {
    return `${this.activeModuleIndex}-${index}-${group.name}`;
  }

  private loadRolesAndPermissions(): void {
    this.loading = true;
    forkJoin({
      roles: this.roleService.getRoles(),
      permissions: this.roleService.getPermissions(),
    }).subscribe({
      next: ({ roles, permissions }) => {
        this.allPermissions = permissions;
        this.roleCategories = roles.map((r, index) => ({
          label: r.name,
          roleId: r.id,
          selected: index === 0,
        }));
        this.buildPermissionModules(permissions);
        const first = roles[0];
        if (first) {
          this.selectRoleById(first.id, first);
        }
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load roles and permissions.';
        this.loading = false;
      },
    });
  }

  private loadRoleUsers(): void {
    if (!this.selectedRole) return;

    this.loadingUsers = true;
    forkJoin({
      allUsers: this.userService.getUsers(),
      roleUsers: this.roleService.getUsersInRole(this.selectedRole.id),
    }).subscribe({
      next: ({ allUsers, roleUsers }) => {
        const assignedIds = new Set(roleUsers.map((u) => u.id));
        this.roleUserRows = allUsers.map((u) => this.toRoleUserRow(u, assignedIds.has(u.id)));
        this.loadingUsers = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load users for role.';
        this.loadingUsers = false;
      },
    });
  }

  private toRoleUserRow(user: SchoolUserDto, assigned: boolean): RoleUserRow {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      assigned,
    };
  }

  private selectRoleById(id: string, role?: RoleDto): void {
    if (role) {
      this.applyRolePermissions(role);
      return;
    }
    this.roleService.getRole(id).subscribe({
      next: (r) => this.applyRolePermissions(r),
    });
  }

  private applyRolePermissions(role: RoleDto): void {
    this.selectedRole = role;
    const enabledSet = new Set(role.permissions ?? []);
    this.modules.forEach((module) => {
      module.groups.forEach((group) => {
        group.permissions.forEach((p) => {
          p.enabled = enabledSet.has(p.key);
        });
      });
    });
  }

  private buildPermissionModules(permissions: PermissionDto[]): void {
    const prefixMap: Record<string, number> = {
      student: 0,
      attendance: 1,
      fees: 2,
      exam: 2,
      exams: 2,
      teacher: 4,
      hr: 5,
      admin: 5,
      class: 5,
      subject: 5,
      academicyear: 5,
      roles: 5,
      settings: 5,
      reports: 5,
    };

    this.modules.forEach((m) => (m.groups = []));

    for (const perm of permissions) {
      const prefix = perm.name.split('.')[0] ?? 'other';
      const moduleIndex = prefixMap[prefix] ?? 5;
      const module = this.modules[moduleIndex];
      let group = module.groups.find((g) => g.name === 'Permissions');
      if (!group) {
        group = { name: 'Permissions', open: true, permissions: [] };
        module.groups.push(group);
      }
      group.permissions.push({
        name: perm.description ?? perm.name,
        key: perm.name,
        enabled: false,
      });
    }
  }
}
