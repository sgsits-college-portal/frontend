import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

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
  formRole = 'STUDENT';
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
      badge: r === 'ADMIN' || (r === 'STAFF' && sr === 'EVENT_MANAGER') ? 'Active' : 'Coming Soon',
      url: '/event'
    });

    // 4. Leave Service (Common for all roles, Active for Leave managers, Admin, and show for others)
    list.push({
      id: 3,
      title: 'Leave Service',
      description: 'Apply for academic or official leaves and view instant approval status workflows.',
      iconClass: 'bi-file-earmark-check-fill',
      badge: r === 'ADMIN' || (r === 'STAFF' && sr === 'LEAVE_MANAGER') ? 'Active' : 'Coming Soon',
      url: '/leave'
    });

    // 5. Complaint Service (Common for all roles, Active for Complaint managers, Admin, and show for others)
    list.push({
      id: 4,
      title: 'Complaint Service',
      description: 'Submit campus complaints, infrastructure feedback, and track resolution status.',
      iconClass: 'bi-exclamation-triangle-fill',
      badge: r === 'ADMIN' || (r === 'STAFF' && sr === 'COMPLAINT_MANAGER') ? 'Active' : 'Coming Soon',
      url: '/complaint'
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

  openService(service: ServiceItem): void {
    if (service.id === 5) {
      // Toggle User Management view instead of routing
      this.toggleUserManagement(true);
    }
    else if (service.id === 1 && service.badge === 'Active') {
      this.router.navigate(['/library']);
    }
    // event, leave, complaint routes are mock for now
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
    this.formRole = 'STUDENT';
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
    this.formRole = user.role;
    this.formSubRole = user.subRole || 'NONE';
    this.formFullName = user.fullName;
    this.formEmail = user.email || '';
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
  }

  onRoleChange(): void {
    if (this.formRole !== 'STAFF') {
      this.formSubRole = 'NONE';
    } else {
      this.formSubRole = '';
    }
  }

  submitUserForm(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    const payload: any = {
      username: this.formUsername.trim(),
      role: this.formRole,
      subRole: (this.formRole !== 'STAFF' || this.formSubRole === 'NONE' || !this.formSubRole) ? 'NONE' : this.formSubRole,
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

  logout(): void {
    this.authService.logout();
  }
}
