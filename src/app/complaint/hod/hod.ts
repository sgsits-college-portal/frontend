import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ComplaintService } from '../services/complaint.service';
import { AuthService } from '../../services/auth.service';
import { Complaint } from '../models/complaint.model';
import { HeaderComponent } from '../components/header/header';

@Component({
  selector: 'app-complaint-hod',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent],
  templateUrl: './hod.html',
  styleUrl: './hod.css'
})
export class Hod implements OnInit {
  private readonly complaintService = inject(ComplaintService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // States
  readonly complaints = signal<Complaint[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly isWarmingUp = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Action States
  readonly isActionSubmitting = signal<boolean>(false);
  readonly showResolveModal = signal<boolean>(false);
  activeComplaintForResolve: Complaint | null = null;
  hodNoteInput = '';

  // User session
  readonly user = this.authService.currentUser;

  ngOnInit(): void {
    this.loadPendingApprovals();
  }

  loadPendingApprovals(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.isWarmingUp.set(false);

    const timer = setTimeout(() => {
      if (this.isLoading()) {
        this.isWarmingUp.set(true);
      }
    }, 4000);

    this.complaintService.getPendingApprovals().subscribe({
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
        console.error('Error fetching pending approvals:', err);
        this.errorMessage.set('Failed to fetch pending sign-off tickets.');
      }
    });
  }

  openResolveModal(item: Complaint): void {
    this.activeComplaintForResolve = item;
    this.hodNoteInput = '';
    this.showResolveModal.set(true);
  }

  onApproveSubmit(): void {
    const item = this.activeComplaintForResolve;
    const HOD = this.user();
    if (!item || !HOD || !this.hodNoteInput || this.hodNoteInput.trim().length < 10) return;

    this.isActionSubmitting.set(true);
    this.complaintService.approveComplaint(item.id, HOD.username, this.hodNoteInput.trim()).subscribe({
      next: (updated: Complaint) => {
        this.isActionSubmitting.set(false);
        this.showResolveModal.set(false);
        this.activeComplaintForResolve = null;
        // Remove from pending list
        this.complaints.update(list => list.filter(c => c.id !== updated.id));
      },
      error: (err: any) => {
        this.isActionSubmitting.set(false);
        console.error('Error approving complaint:', err);
        alert(err.error?.message || 'Failed to approve complaint.');
      }
    });
  }

  onRejectSubmit(): void {
    const item = this.activeComplaintForResolve;
    const HOD = this.user();
    if (!item || !HOD || !this.hodNoteInput || this.hodNoteInput.trim().length < 10) return;

    this.isActionSubmitting.set(true);
    this.complaintService.rejectComplaint(item.id, HOD.username, this.hodNoteInput.trim()).subscribe({
      next: (updated: Complaint) => {
        this.isActionSubmitting.set(false);
        this.showResolveModal.set(false);
        this.activeComplaintForResolve = null;
        // Remove from pending list
        this.complaints.update(list => list.filter(c => c.id !== updated.id));
      },
      error: (err: any) => {
        this.isActionSubmitting.set(false);
        console.error('Error rejecting complaint:', err);
        alert(err.error?.message || 'Failed to reject complaint.');
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
}
