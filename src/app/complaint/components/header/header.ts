import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-complaint-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Expose current user session signal
  readonly user = this.authService.currentUser;

  backToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  isTechnician(user: any): boolean {
    if (!user) return false;
    const r = user.role ? user.role.toUpperCase() : '';
    const sr = user.subRole ? user.subRole.toUpperCase() : '';
    return r === 'STAFF' && sr === 'TECHNICIAN';
  }

  isAdmin(user: any): boolean {
    if (!user) return false;
    const r = user.role ? user.role.toUpperCase() : '';
    const sr = user.subRole ? user.subRole.toUpperCase() : '';
    return r === 'ADMIN' || sr === 'SUPER_ADMIN' || sr === 'SYSTEM_ADMIN';
  }

  isHOD(user: any): boolean {
    if (!user) return false;
    const r = user.role ? user.role.toUpperCase() : '';
    const sr = user.subRole ? user.subRole.toUpperCase() : '';
    return r === 'HOD' || r === 'HEAD' || sr === 'HEAD_OF_DEPT' || sr === 'HEAD' || sr === 'HOD';
  }

  canFile(user: any): boolean {
    return user && !this.isAdmin(user) && !this.isTechnician(user) && !this.isHOD(user);
  }
}
