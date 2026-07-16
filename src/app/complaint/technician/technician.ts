import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ComplaintService } from '../services/complaint.service';
import { AuthService } from '../../services/auth.service';
import { Complaint } from '../models/complaint.model';
import { HeaderComponent } from '../components/header/header';

@Component({
  selector: 'app-complaint-technician',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent],
  templateUrl: './technician.html',
  styleUrl: './technician.css'
})
export class Technician implements OnInit {
  private readonly complaintService = inject(ComplaintService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // States
  readonly complaints = signal<Complaint[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly isWarmingUp = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Quick Action States
  readonly isActionSubmitting = signal<boolean>(false);
  readonly showFixModal = signal<boolean>(false);
  activeComplaintForFix: Complaint | null = null;
  adminNoteInput = '';

  // Filters
  readonly statusFilter = signal<string>('');

  // User session
  readonly user = this.authService.currentUser;

  ngOnInit(): void {
    this.loadAssignedTasks();
  }

  loadAssignedTasks(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.isWarmingUp.set(false);

    const timer = setTimeout(() => {
      if (this.isLoading()) {
        this.isWarmingUp.set(true);
      }
    }, 4000);

    this.complaintService.getAssignedComplaints().subscribe({
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
        console.error('Error loading technician complaints:', err);
        this.errorMessage.set('Failed to fetch assigned tasks.');
      }
    });
  }

  // Filtered list
  readonly filteredComplaints = computed(() => {
    const list = this.complaints();
    const status = this.statusFilter();

    if (!status) return list;
    return list.filter(c => c.status === status);
  });

  openFixModal(item: Complaint): void {
    this.activeComplaintForFix = item;
    this.adminNoteInput = '';
    this.showFixModal.set(true);
  }

  onSubmitFix(): void {
    const item = this.activeComplaintForFix;
    if (!item || !this.adminNoteInput || this.adminNoteInput.trim().length < 10) return;

    this.isActionSubmitting.set(true);
    this.complaintService.submitVerification(item.id, this.adminNoteInput.trim()).subscribe({
      next: (updated) => {
        this.isActionSubmitting.set(false);
        this.showFixModal.set(false);
        this.activeComplaintForFix = null;
        // Update local list
        this.complaints.update(list => list.map(c => c.id === updated.id ? updated : c));
      },
      error: (err) => {
        this.isActionSubmitting.set(false);
        console.error('Error submitting work report:', err);
        alert(err.error?.message || 'Failed to submit work report.');
      }
    });
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
