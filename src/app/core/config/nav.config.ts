export interface NavItemConfig {
  label: string;
  icon: string;
  route: string;
  section?: string;
  permission?: string;
  badge?: string;
  danger?: boolean;
}

export const NAV_ITEMS: NavItemConfig[] = [
  { section: 'Overview', label: 'Dashboard', icon: 'grid_view', route: '/dashboard' },
  {
    section: 'Configuration Management',
    label: 'Schools',
    icon: 'school',
    route: '/configuration/schools',
    permission: 'admin.full',
  },
  {
    label: 'Users',
    icon: 'group',
    route: '/configuration/users',
    permission: 'hr.read',
  },
  {
    label: 'Roles',
    icon: 'admin_panel_settings',
    route: '/configuration/roles',
    permission: 'roles.manage',
  },
];
