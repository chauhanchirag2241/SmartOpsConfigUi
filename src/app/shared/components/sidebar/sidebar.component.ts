import { Component, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  section?: string;
  badge?: string;
  danger?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [MatIconModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  @Output() toggle = new EventEmitter<void>();

  onToggle(): void {
    this.toggle.emit();
  }

  trackNavItem(index: number, item: NavItem): string {
    return `${item.route}-${index}`;
  }

  readonly navItems: NavItem[] = [
    { section: 'Overview', label: 'Dashboard', icon: 'grid_view', route: '/dashboard' },
    { section: 'Configuration Management', label: 'Schools', icon: 'school', route: '/schools' },
    { label: 'Configuration', icon: 'settings_applications', route: '/configuration' },
    { label: 'Masters', icon: 'category', route: '/masters' },
    { section: 'System', label: 'Settings', icon: 'settings', route: '/settings' },
  ];
}
