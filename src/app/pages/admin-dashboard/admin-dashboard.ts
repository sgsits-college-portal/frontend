import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; // Added RouterLink import
import { Auth } from '../../services/auth';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  // FIX: Added RouterLink here so your sidebar layout hyperlinks become fully active!
  imports: [CommonModule, RouterLink], 
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit {

  leaves: any[] = [];
  isLoading = true;
  errorMessage = '';
  canManageLeaves = false;
  usersMap: Record<number, any> = {};

  constructor(private auth: Auth, private authService: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.canManageLeaves = this.isLeaveApprover();

    if (!this.canManageLeaves) {
      this.isLoading = false;
      return;
    }

    this.authService.getUsers().subscribe({
      next: (users) => {
        users.forEach(u => this.usersMap[u.id] = u);
        this.loadLeaves();
      },
      error: (err) => {
        console.error('Failed to load users for leave dashboard mapping:', err);
        this.loadLeaves();
      }
    });
  }

  get pendingCount(): number {
    return this.leaves.filter(leave => leave.status === 'Pending').length;
  }

  get approvedCount(): number {
    return this.leaves.filter(leave => leave.status === 'Approved').length;
  }

  get rejectedCount(): number {
    return this.leaves.filter(leave => leave.status === 'Rejected').length;
  }

  private isLeaveApprover(): boolean {
    const user = JSON.parse(localStorage.getItem('sgsits_auth_user') || '{}');
    const role = (user.role || '').toUpperCase().trim();
    const subRole = (user.subRole || '').toUpperCase().trim();

    return ['ADMIN', 'HEAD', 'HOD', 'SUB_HEAD_OF_DEPT', 'SUB_HOD'].includes(role)
      || ['SUB_HEAD_OF_DEPT', 'SUB_HOD'].includes(subRole);
  }

  loadLeaves() {
    this.isLoading = true;
    this.errorMessage = '';

    this.auth.getAllLeaves().subscribe({
      next: (response: any) => {
        this.leaves = Array.isArray(response) ? response : [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.log(error);
        this.isLoading = false;
        this.errorMessage = 'Failed to load leave requests. Please refresh and try again.';
        this.cdr.detectChanges();
      }
    });
  }

  approve(id: number) {
    this.auth.approveLeave(id).subscribe({
      next: () => {
        // Updated interface triggers list refreshes smoothly
        this.loadLeaves();
      },
      error: (err) => console.error(err)
    });
  }

  reject(id: number) {
    this.auth.rejectLeave(id).subscribe({
      next: () => {
        // Updated interface triggers list refreshes smoothly
        this.loadLeaves();
      },
      error: (err) => console.error(err)
    });
  }
}
