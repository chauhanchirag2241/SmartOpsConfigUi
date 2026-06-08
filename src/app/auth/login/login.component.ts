import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

interface Particle {
  left: number;
  bottom: number;
  dur: string;
  delay: string;
  drift: string;
  size: number;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  loading = false;
  showPassword = false;
  errorMessage = '';
  particles: Particle[] = [];

  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  ngOnInit(): void {
    this.auth.ensureValidSessionOrClear();
    if (this.route.snapshot.queryParamMap.get('sessionExpired') === '1') {
      this.errorMessage = 'Your session expired. Please sign in again.';
    }
    this.generateParticles();
  }

  generateParticles(): void {
    for (let i = 0; i < 18; i++) {
      this.particles.push({
        left: Math.random() * 100,
        bottom: Math.random() * 30,
        dur: `${5 + Math.random() * 8}s`,
        delay: `${Math.random() * 6}s`,
        drift: `${(Math.random() - 0.5) * 80}px`,
        size: 1.5 + Math.random() * 2.5,
      });
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  private resolveLoginError(err: unknown): string {
    const body = (err as { error?: unknown })?.error;
    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    if (body && typeof body === 'object') {
      const record = body as Record<string, unknown>;
      const message = record['message'] ?? record['title'];
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }
    return 'Invalid email or password.';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    const email = this.loginForm.controls.email.value ?? '';
    const password = this.loginForm.controls.password.value ?? '';

    this.auth
      .loginWithApi(email, password)
      .pipe(finalize(() => {
        this.loading = false;
      }))
      .subscribe({
        next: () => {
          void this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.errorMessage = this.resolveLoginError(err);
        },
      });
  }
}
