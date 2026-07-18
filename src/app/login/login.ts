import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

  type PortalRole = 'STUDENT' | 'FACULTY' | 'STAFF' | 'HOD' | 'ADMIN';

interface ServiceModule {
  id: number;
  title: string;
  description: string;
  iconClass: string;
  badge?: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Active Role Selection
  readonly activeRole = signal<PortalRole>('STUDENT');

  // Form Fields Bound via ngModel
  readonly username = signal<string>('');
  readonly password = signal<string>('');

  // UI Interaction States
  readonly showPassword = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly isSubmitting = signal<boolean>(false);

  // Unified Services List for the Left Panel
  readonly services = signal<ServiceModule[]>([
    {
      id: 1,
      title: 'Library Service',
      description: 'Access digital catalogs, available books, and track current borrowings seamlessly.',
      iconClass: 'bi-journal-bookmark-fill',
      badge: ''
    },
    {
      id: 2,
      title: 'Event Service',
      description: 'Browse upcoming campus events, technical fests, and register in a tap.',
      iconClass: 'bi-calendar-event-fill',
      badge: ''
    },
    {
      id: 3,
      title: 'Leave Service',
      description: 'Apply for academic or official leaves and view instant approval status workflows.',
      iconClass: 'bi-file-earmark-check-fill'
    },
    {
      id: 4,
      title: 'Complaint Service',
      description: 'Raise facility or academic grievances directly to administration with active tracking.',
      iconClass: 'bi-exclamation-triangle-fill'
    }
  ]);

  // Dynamic config based on active role
  readonly roleConfig = computed(() => {
    const role = this.activeRole();
    switch (role) {
      case 'STUDENT':
        return {
          label: 'Student Enrollment Number',
          placeholder: 'e.g., 0801CS241000',
          helpText: 'Enter your 12-character university enrollment number.'
        };
      case 'FACULTY':
        return {
          label: 'College Email Address',
          placeholder: 'e.g., rajesh_kumar@sgsits.ac.in',
          helpText: 'Enter your registered faculty email (ends with @sgsits.ac.in).'
        };
      case 'STAFF':
        return {
          label: 'College Email Address',
          placeholder: 'e.g., staff@sgsits.ac.in',
          helpText: 'Enter your registered staff email (ends with @sgsits.ac.in).'
        };
      case 'HOD':
        return {
          label: 'College Email Address',
          placeholder: 'e.g., hod_cs@sgsits.ac.in',
          helpText: 'Enter your registered department head email (ends with @sgsits.ac.in).'
        };
      case 'ADMIN':
        return {
          label: 'College Email Address',
          placeholder: 'e.g., admin@sgsits.ac.in',
          helpText: 'Enter your administrative portal email (ends with @sgsits.ac.in).'
        };
    }
  });

  // Handle Switching Roles - clear credentials and error messages
  selectRole(role: string): void {
    this.activeRole.set(role as PortalRole);
    this.username.set('');
    this.password.set('');
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  // Toggle Password Field Type visibility
  togglePasswordVisibility(): void {
    this.showPassword.update(val => !val);
  }

  // Validate Credential Format
  private validateCredentials(user: string, role: PortalRole): { valid: boolean; error?: string } {
    if (!user || user.trim() === '') {
      return { valid: false, error: `${this.roleConfig().label} is required.` };
    }

    if (role === 'STUDENT') {
      // Regex for Student Enrollment: 4 digits, 2 alphabets, 6 digits. E.g., 0801CS241055
      const enrollmentRegex = /^\d{4}[A-Za-z]{2}\d{6}$/;
      if (!enrollmentRegex.test(user)) {
        return {
          valid: false,
          error: 'Invalid Student Enrollment format. Must contain 4 digits, 2 letters, and 6 digits (e.g., 0801CS241000).'
        };
      }
    } else {
      // Regex for Official Email ending with @sgsits.ac.in
      const emailRegex = /^[a-zA-Z0-9._%+-]+@sgsits\.ac\.in$/;
      if (!emailRegex.test(user)) {
        return {
          valid: false,
          error: `Invalid email format. Official email must end strictly with "@sgsits.ac.in" (e.g., name@sgsits.ac.in).`
        };
      }
    }

    return { valid: true };
  }

  // Form Submit Handler
  onSubmit(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const userVal = this.username().trim();
    const passVal = this.password();
    const currentRole = this.activeRole();

    // 1. Validate Username Format
    const userValidation = this.validateCredentials(userVal, currentRole);
    if (!userValidation.valid) {
      this.errorMessage.set(userValidation.error || 'Invalid credentials format.');
      return;
    }

    // 2. Validate Password Length
    if (!passVal || passVal.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters long.');
      return;
    }

    // 3. Call AuthService API Login
    this.isSubmitting.set(true);

    this.authService.login(userVal, passVal, currentRole).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.successMessage.set(`Welcome back! Successfully authenticated as ${currentRole}. Redirecting to dashboard...`);
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        if (err.error && err.error.message) {
          this.errorMessage.set(err.error.message);
        } else {
          this.errorMessage.set('Authentication failed. Please verify your credentials.');
        }
      }
    });
  }
}
