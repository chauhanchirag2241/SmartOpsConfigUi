import { Component, inject } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

interface DashboardStat {
  label: string;
  value: string;
  icon: string;
  trend: string;
  trendDirection: 'up' | 'down';
}

interface AttendanceItem {
  label: string;
  value: string;
  color: string;
}

interface EnrollmentItem {
  month: string;
  value: number;
}

interface ActivityItem {
  initials: string;
  name: string;
  detail: string;
  badge: string;
  tone: 'good' | 'alert' | 'warn';
}

interface AlertItem {
  icon: string;
  title: string;
  subtitle: string;
  tone: 'danger' | 'warning' | 'success';
}

interface FeeItem {
  className: string;
  students: number;
  collected: string;
  total: string;
  percent: number;
  pending: string;
}

interface QuickAction {
  icon: string;
  label: string;
  route?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule, NgFor, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly auth = inject(AuthService);
  readonly stats: DashboardStat[] = [
    { label: 'Total students', value: '248', icon: 'groups', trend: '+12', trendDirection: 'up' },
    { label: 'Present today', value: '221', icon: 'how_to_reg', trend: '89%', trendDirection: 'up' },
  ];

  readonly attendance: AttendanceItem[] = [
    { label: 'Present', value: '221', color: '#639922' },
    { label: 'Absent', value: '18', color: '#e24b4a' },
    { label: 'Leave', value: '9', color: '#ef9f27' },
    { label: 'Holiday', value: '0', color: '#d7ddcf' },
  ];

  readonly enrollments: EnrollmentItem[] = [
    { month: 'Apr', value: 22 },
    { month: 'May', value: 18 },
    { month: 'Jun', value: 15 },
    { month: 'Jul', value: 12 },
    { month: 'Aug', value: 8 },
    { month: 'Sep', value: 6 },
    { month: 'Oct', value: 5 },
    { month: 'Nov', value: 7 },
    { month: 'Dec', value: 4 },
    { month: 'Jan', value: 10 },
    { month: 'Feb', value: 14 },
    { month: 'Mar', value: 19 },
  ];

  readonly activities: ActivityItem[] = [
    { initials: 'RP', name: 'Rahul Patel', detail: 'Admitted - Class 10A', badge: 'New', tone: 'good' },
    { initials: 'KD', name: 'Kriti Dave', detail: 'Fee paid - Rs 12,000', badge: 'Paid', tone: 'good' },
    { initials: 'AS', name: 'Arjun Shah', detail: 'Absent - no reason', badge: 'Alert', tone: 'alert' },
    { initials: 'PM', name: 'Priya Modi', detail: 'TC issued - Class 9B', badge: 'TC', tone: 'warn' },
    { initials: 'VJ', name: 'Vivek Joshi', detail: 'Fee overdue - 30 days', badge: 'Due', tone: 'alert' },
  ];

  readonly alerts: AlertItem[] = [
    { icon: 'payments', title: '32 fees overdue', subtitle: 'Action needed', tone: 'danger' },
    { icon: 'person_off', title: '18 absent today', subtitle: 'No reason given', tone: 'warning' },
    { icon: 'workspace_premium', title: 'Exam in 5 days', subtitle: 'Class 10 - final term', tone: 'success' },
  ];

  readonly fees: FeeItem[] = [
    { className: 'Class 10A', students: 42, collected: 'Rs 4.8L', total: 'Rs 5.6L', percent: 86, pending: 'Rs 80K' },
    { className: 'Class 9B', students: 38, collected: 'Rs 3.9L', total: 'Rs 5.1L', percent: 76, pending: 'Rs 1.2L' },
    { className: 'Class 8C', students: 44, collected: 'Rs 4.1L', total: 'Rs 4.8L', percent: 85, pending: 'Rs 70K' },
    { className: 'Class 7A', students: 36, collected: 'Rs 2.8L', total: 'Rs 4.2L', percent: 67, pending: 'Rs 1.4L' },
  ];

  readonly quickActions: QuickAction[] = [
    { icon: 'person_add', label: 'Add student', route: '/students' },
    { icon: 'how_to_reg', label: 'Mark attendance', route: '/attendance' },
    { icon: 'payments', label: 'Collect fees' },
    { icon: 'event_note', label: 'Exam schedule' },
  ];

  enrollmentHeight(value: number): number {
    const max = Math.max(...this.enrollments.map((item) => item.value));
    return Math.max(8, Math.round((value / max) * 76));
  }
}
