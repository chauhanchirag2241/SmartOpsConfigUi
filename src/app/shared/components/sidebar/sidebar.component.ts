import { Component, Output, EventEmitter, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { NAV_ITEMS, NavItemConfig } from '../../../core/config/nav.config';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [MatIconModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  @Output() toggle = new EventEmitter<void>();

  private readonly auth = inject(AuthService);

  private readonly user = toSignal(this.auth.currentUser$, { initialValue: this.auth.currentUser });

  readonly visibleNavItems = computed(() => {
    const _ = this.user();
    return NAV_ITEMS.filter((item) => this.auth.hasPermission(item.permission));
  });

  readonly displayRole = computed(() => {
    const roles = this.user()?.roles ?? [];
    return roles[0] ?? this.user()?.role ?? 'User';
  });

  readonly displayName = computed(() => this.user()?.name ?? 'User');

  readonly initials = computed(() => {
    const name = this.displayName();
    const parts = name.split(' ').filter(Boolean);
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  onToggle(): void {
    this.toggle.emit();
  }

  trackNavItem(index: number, item: NavItemConfig): string {
    return `${item.route}-${index}`;
  }
}
