import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

interface ServiceItem {
  id: number;
  title: string;
  description: string;
  iconClass: string;
  badge?: string;
  url?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);


  // Get active session user
  readonly user = this.authService.currentUser;

  // Track if Admin is viewing User Management
  readonly showUserManagement = signal<boolean>(false);

  // Admin User Management State
  readonly usersList = signal<any[]>([]);
  readonly searchQuery = signal<string>('');
  readonly isFormOpen = signal<boolean>(false);
  readonly selectedUser = signal<any | null>(null);
  readonly errorMessage = signal<string>('');
  readonly successMessage = signal<string>('');

  // Form Fields
  formUsername = '';
  formPassword = '';
  readonly formRole = signal<string>('STUDENT');
  formSubRole = 'NONE';
  formFullName = '';
  formEmail = '';

  // Unified Services List for the Dashboard, dynamically filtered by role/subRole
  readonly services = computed<ServiceItem[]>(() => {
    const currentUser = this.user();
    if (!currentUser) return [];

    const r = currentUser.role.toUpperCase();
    const sr = currentUser.subRole ? currentUser.subRole.toUpperCase() : '';

    const list: ServiceItem[] = [];

    // 1. User Management (ADMIN only)
    if (r === 'ADMIN') {
      list.push({
        id: 5,
        title: 'User Management',
        description: 'Directly manage SGSITS academic portal accounts: list, add, edit, or delete users.',
        iconClass: 'bi-people-fill',
        badge: 'Active',
        url: '/admin/users'
      });
    }

    // 2. Library Service (STUDENT, FACULTY, HEAD/HOD, STAFF with LIBRARIAN subRole)
    if (r === 'STUDENT' || r === 'FACULTY' || r === 'HEAD' || r === 'HOD' || (r === 'STAFF' && sr === 'LIBRARIAN')) {
      list.push({
        id: 1,
        title: 'Library Service',
        description: 'Access digital catalogs, available books, and track current borrowings seamlessly.',
        iconClass: 'bi-journal-bookmark-fill',
        badge: 'Active',
        url: '/library'
      });
    }

    // 3. Event Service (Common for all roles, Active for Event managers, Admin, and show for others)
    list.push({
      id: 2,
      title: 'Event Service',
      description: 'Browse upcoming campus events, technical fests, and register in a tap.',
      iconClass: 'bi-calendar-event-fill',
      badge: 'Active',
      url: '/events'
    });

    // 4. Leave Service (Common for all roles, Active for Leave managers, Admin, and show for others)
    list.push({
  id: 3,
  title: 'Leave Service',
  description: 'Apply for academic or official leaves and view instant approval status workflows.',
  iconClass: 'bi-file-earmark-check-fill',
  badge: 'Active',
  url: '/leave/apply'
});

    // 5. Complaint Service (Common for all roles, Active for all authenticated users)
    list.push({
      id: 4,
      title: 'Complaint Service',
      description: 'Submit campus complaints, infrastructure feedback, and track resolution status.',
      iconClass: 'bi-exclamation-triangle-fill',
      badge: 'Active',
      url: '/complaints/feed'
    });

    return list;
  });

  // Filtered Users List for search
  readonly filteredUsersList = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const list = this.usersList();
    if (!query) return list;
    return list.filter(u =>
      u.fullName.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      (u.email && u.email.toLowerCase().includes(query)) ||
      u.role.toLowerCase().includes(query) ||
      (u.subRole && u.subRole.toLowerCase().includes(query))
    );
  });

  getDashboardRoute(role: string, subRole: string): string {
    const r = role.toUpperCase();
    const sr = subRole ? subRole.toUpperCase() : '';

    if (r === 'ADMIN' || sr === 'SUPER_ADMIN' || sr === 'SYSTEM_ADMIN') {
      return '/admin/complaints';
    }

    switch (r) {
      case 'STUDENT':
        return '/complaints/my';
      case 'STAFF':
        if (sr === 'TECHNICIAN') return '/technician/complaints';
        return '/complaints/my';
      case 'HOD':
      case 'FACULTY':
        if (r === 'HOD' || sr === 'HOD' || sr === 'HEAD_OF_DEPT') return '/hod/approvals';
        return '/complaints/my';
      default:
        return '/complaints/feed';
    }
  }

  openService(service: ServiceItem): void {
    if (service.id === 5) {
      // Toggle User Management view instead of routing
      this.toggleUserManagement(true);
    }
    else if (service.id === 1 && service.badge === 'Active') {
      this.router.navigate(['/library']);
    }
    else if (service.id === 2 && service.badge === 'Active') {
      this.router.navigate(['/events']);
      return;
    }
    else if (service.id === 4 && service.badge === 'Active') {
      const currentUser = this.user();
      if (currentUser) {
        const route = this.getDashboardRoute(currentUser.role, currentUser.subRole || '');
        this.router.navigate([route]);
      }
    }
  else if (service.id === 3 && service.badge === 'Active') {
    const currentUser = this.user();
    if (currentUser) {
      const role = (currentUser.role || '').toUpperCase().trim();
      const subRole = (currentUser.subRole || '').toUpperCase().trim();
      const isAdmin = ['ADMIN', 'HEAD', 'HOD', 'SUB_HEAD_OF_DEPT', 'SUB_HOD'].includes(role) || ['SUB_HEAD_OF_DEPT', 'SUB_HOD'].includes(subRole);
      this.router.navigate([isAdmin ? '/leave/admin' : '/leave/apply']);
    } else {
      this.router.navigate(['/leave/apply']);
    }
  }
  }

  toggleUserManagement(show: boolean): void {
    this.showUserManagement.set(show);
    if (show) {
      this.loadUsers();
    }
  }

  loadUsers(): void {
    this.errorMessage.set('');
    this.authService.getUsers().subscribe({
      next: (data) => {
        this.usersList.set(data);
      },
      error: (err) => {
        this.errorMessage.set('Failed to load portal directories from auth-db.');
        console.error(err);
      }
    });
  }

  openAddUserForm(): void {
    this.selectedUser.set(null);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.formUsername = '';
    this.formPassword = '';
    this.formRole.set('STUDENT');
    this.formSubRole = 'NONE';
    this.formFullName = '';
    this.formEmail = '';
    this.isFormOpen.set(true);
  }

  openEditUserForm(user: any): void {
    this.selectedUser.set(user);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.formUsername = user.username;
    this.formPassword = ''; // Keep empty to indicate unchanged password
    this.formRole.set(user.role);
    this.formSubRole = user.subRole || 'NONE';
    this.formFullName = user.fullName;
    this.formEmail = user.email || '';
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
  }

  onRoleChange(newRole: string): void {
    this.formRole.set(newRole);
    this.formSubRole = 'NONE';
  }

  readonly subRoleOptions = computed(() => {
    const role = this.formRole() ? this.formRole().toUpperCase() : '';
    switch (role) {
      case 'STUDENT':
        return [
          { value: 'NONE', label: 'None' },
          { value: 'CR', label: 'Class Representative (CR)' }
        ];
      case 'FACULTY':
        return [
          { value: 'NONE', label: 'None' },
          { value: 'PROFESSOR', label: 'Professor' },
          { value: 'HEAD_OF_DEPT', label: 'Head of Department (HOD)' }
        ];
      case 'HEAD':
      case 'HOD':
        return [
          { value: 'NONE', label: 'None' },
          { value: 'HEAD_OF_DEPT', label: 'Head of Department (HOD)' }
        ];
      case 'STAFF':
        return [
          { value: 'NONE', label: 'None' },
          { value: 'LAB_INCHARGE', label: 'Lab In-Charge' },
          { value: 'LIBRARIAN', label: 'Librarian' },
          { value: 'TECHNICIAN', label: 'Technician' },
          { value: 'OFFICE_ADMIN', label: 'Office Admin' }
        ];
      case 'ADMIN':
        return [
          { value: 'NONE', label: 'None' },
          { value: 'SYSTEM_ADMIN', label: 'System Admin' },
          { value: 'SUPER_ADMIN', label: 'Super Admin' }
        ];
      default:
        return [{ value: 'NONE', label: 'None' }];
    }
  });

  submitUserForm(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    const payload: any = {
      username: this.formUsername.trim(),
      role: this.formRole(),
      subRole: this.formSubRole || 'NONE',
      fullName: this.formFullName.trim(),
      email: this.formEmail.trim() || null
    };

    if (this.selectedUser() === null) {
      // Add user
      if (!this.formPassword) {
        this.errorMessage.set('Password is required for new users.');
        return;
      }
      payload.password = this.formPassword;
      this.authService.register(payload).subscribe({
        next: () => {
          this.successMessage.set('User registered successfully!');
          this.loadUsers();
          setTimeout(() => this.closeForm(), 1000);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Failed to add user account.');
        }
      });
    } else {
      // Edit user
      const userToEdit = this.selectedUser();
      if (this.formPassword) {
        payload.password = this.formPassword;
      }
      this.authService.updateUser(userToEdit.id, payload).subscribe({
        next: () => {
          this.successMessage.set('User account updated successfully!');
          this.loadUsers();
          setTimeout(() => this.closeForm(), 1000);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Failed to update user account.');
        }
      });
    }
  }

  deleteUser(user: any): void {
    if (confirm(`Are you sure you want to remove the portal account for "${user.fullName}"?`)) {
      this.authService.deleteUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to delete user.');
        }
      });
    }


  }
  logout(): void {
    this.authService.logout();
  }
}
