import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ComplaintService } from '../services/complaint.service';
import { AuthService } from '../../services/auth.service';
import { Complaint } from '../models/complaint.model';
import { HeaderComponent } from '../components/header/header';

@Component({
  selector: 'app-complaint-my',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent],
  templateUrl: './my.html',
  styleUrl: './my.css'
})
export class My implements OnInit {
  private readonly complaintService = inject(ComplaintService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // States
  readonly complaints = signal<Complaint[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly isWarmingUp = signal<boolean>(false);

  // Filters
  readonly statusFilter = signal<string>('');

  // User
  readonly user = this.authService.currentUser;

  ngOnInit(): void {
    this.loadMyComplaints();
  }

  loadMyComplaints(): void {
    const currentUser = this.user();
    if (!currentUser) {
      this.errorMessage.set('Session not found. Please log in.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.isWarmingUp.set(false);

    // Warm-up timer for Render cold starts
    const timer = setTimeout(() => {
      if (this.isLoading()) {
        this.isWarmingUp.set(true);
      }
    }, 4000);

    this.complaintService.getUserComplaints(currentUser.username).subscribe({
      next: (data) => {
        clearTimeout(timer);
        this.complaints.set(data || []);
        this.isLoading.set(false);
        this.isWarmingUp.set(false);
      },
      error: (err) => {
        clearTimeout(timer);
        this.isLoading.set(false);
        this.isWarmingUp.set(false);
        console.error('Error fetching my complaints:', err);
        this.errorMessage.set('Failed to fetch your complaints. Try again later.');
      }
    });
  }

  // Filtered complaints based on status selection
  readonly filteredComplaints = computed(() => {
    const list = this.complaints();
    const status = this.statusFilter();

    if (!status) return list;
    return list.filter(c => c.status === status);
  });

  canFile(user: any): boolean {
    if (!user) return false;
    const r = user.role ? user.role.toUpperCase() : '';
    const sr = user.subRole ? user.subRole.toUpperCase() : '';
    const isAdmin = r === 'ADMIN' || sr === 'SUPER_ADMIN' || sr === 'SYSTEM_ADMIN';
    const isTechnician = r === 'STAFF' && sr === 'TECHNICIAN';
    return !isAdmin && !isTechnician;
  }

  navigateToNewComplaint(): void {
    this.router.navigate(['/complaints/new']);
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority.toUpperCase()) {
      case 'LOW': return 'bg-secondary text-white';
      case 'MEDIUM': return 'bg-info text-dark';
      case 'HIGH': return 'bg-warning text-dark';
      case 'CRITICAL': return 'bg-danger text-white pulsing-badge';
      default: return 'bg-secondary text-white';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status.toUpperCase()) {
      case 'OPEN': return 'status-open';
      case 'IN_PROGRESS': return 'status-progress';
      case 'VERIFICATION_PENDING': return 'status-pending';
      case 'RESOLVED': return 'status-resolved';
      case 'REJECTED': return 'status-rejected';
      default: return 'status-default';
    }
  }
}
