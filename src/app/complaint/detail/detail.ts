import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ComplaintService } from '../services/complaint.service';
import { AuthService } from '../../services/auth.service';
import { Complaint } from '../models/complaint.model';
import { HeaderComponent } from '../components/header/header';

@Component({
  selector: 'app-complaint-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent],
  templateUrl: './detail.html',
  styleUrl: './detail.css'
})
export class Detail implements OnInit {
  private readonly complaintService = inject(ComplaintService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  // User session details
  readonly user = this.authService.currentUser;

  // Complaint States
  readonly complaintId = signal<number | null>(null);
  readonly complaint = signal<Complaint | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly isActionSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly actionErrorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Interactive UI panels states
  readonly activeImageIndex = signal<number>(0);
  readonly showAssignModal = signal<boolean>(false);
  readonly technicians = signal<any[]>([]);

  // Form parameters
  selectedTechnicianId = '';
  adminNoteInput = '';
  hodNoteInput = '';

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const numId = Number(idParam);
      if (!isNaN(numId)) {
        this.complaintId.set(numId);
        this.loadComplaintDetails(numId);
      } else {
        this.errorMessage.set('Invalid Complaint ID format.');
        this.isLoading.set(false);
      }
    }
  }

  loadComplaintDetails(id: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.complaintService.getComplaintById(id).subscribe({
      next: (data) => {
        this.complaint.set(data);
        this.isLoading.set(false);
        this.activeImageIndex.set(0);
        // If the user is an admin, fetch technicians to prepare for assignment options
        const currentUser = this.user();
        if (currentUser && currentUser.role === 'ADMIN') {
          this.loadTechnicians();
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Error fetching complaint detail:', err);
        if (err.status === 403) {
          this.errorMessage.set('Access Denied: You do not have permission to view this private ticket.');
        } else if (err.status === 404) {
          this.errorMessage.set(`Complaint not found with id: ${id}`);
        } else {
          this.errorMessage.set('Failed to fetch complaint details. Please retry.');
        }
      }
    });
  }

  loadTechnicians(): void {
    this.authService.getUsers().subscribe({
      next: (users) => {
        const techs = users.filter(u => 
          u.role === 'STAFF' && u.subRole === 'TECHNICIAN'
        );
        this.technicians.set(techs);
      },
      error: (err) => {
        console.error('Failed to load technicians list:', err);
      }
    });
  }

  prevImage(): void {
    const images = this.complaint()?.images || [];
    if (images.length === 0) return;
    const current = this.activeImageIndex();
    this.activeImageIndex.set(current === 0 ? images.length - 1 : current - 1);
  }

  nextImage(): void {
    const images = this.complaint()?.images || [];
    if (images.length === 0) return;
    const current = this.activeImageIndex();
    this.activeImageIndex.set(current === images.length - 1 ? 0 : current + 1);
  }

  // Action: Admin Assigns Technician
  onAssignTechnician(): void {
    const id = this.complaintId();
    const admin = this.user();
    if (!id || !admin || !this.selectedTechnicianId) return;

    this.isActionSubmitting.set(true);
    this.actionErrorMessage.set(null);

    this.complaintService.assignTechnician(id, this.selectedTechnicianId, admin.username).subscribe({
      next: (updatedComplaint) => {
        this.isActionSubmitting.set(false);
        this.complaint.set(updatedComplaint);
        this.showAssignModal.set(false);
        this.successMessage.set('Technician assigned successfully!');
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        this.isActionSubmitting.set(false);
        console.error('Error assigning technician:', err);
        this.actionErrorMessage.set(err.error?.message || 'Failed to assign technician.');
      }
    });
  }

  // Action: Toggle visibility (Admin only)
  onToggleVisibility(newPublicStatus: boolean): void {
    const id = this.complaintId();
    if (!id) return;

    this.isActionSubmitting.set(true);
    this.actionErrorMessage.set(null);

    this.complaintService.toggleVisibility(id, newPublicStatus).subscribe({
      next: (updatedComplaint) => {
        this.isActionSubmitting.set(false);
        this.complaint.set(updatedComplaint);
        this.successMessage.set(`Visibility updated to ${newPublicStatus ? 'Public' : 'Private'}.`);
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        this.isActionSubmitting.set(false);
        console.error('Error toggling visibility:', err);
        this.actionErrorMessage.set(err.error?.message || 'Failed to update visibility.');
      }
    });
  }

  // Action: Technician Submits Work Verification Note
  onSubmitVerification(): void {
    const id = this.complaintId();
    if (!id || !this.adminNoteInput || this.adminNoteInput.trim().length < 10) {
      this.actionErrorMessage.set('Note must be at least 10 characters long.');
      return;
    }

    this.isActionSubmitting.set(true);
    this.actionErrorMessage.set(null);

    this.complaintService.submitVerification(id, this.adminNoteInput.trim()).subscribe({
      next: (updatedComplaint) => {
        this.isActionSubmitting.set(false);
        this.complaint.set(updatedComplaint);
        this.adminNoteInput = '';
        this.successMessage.set('Work submitted for HOD verification!');
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        this.isActionSubmitting.set(false);
        console.error('Error submitting verification:', err);
        this.actionErrorMessage.set(err.error?.message || 'Failed to submit verification.');
      }
    });
  }

  // Action: HOD Resolves Complaint
  onResolveComplaint(): void {
    const id = this.complaintId();
    const HOD = this.user();
    if (!id || !HOD || !this.hodNoteInput || this.hodNoteInput.trim().length < 10) {
      this.actionErrorMessage.set('Verification note must be at least 10 characters long.');
      return;
    }

    this.isActionSubmitting.set(true);
    this.actionErrorMessage.set(null);

    this.complaintService.resolveComplaint(id, HOD.username, this.hodNoteInput.trim()).subscribe({
      next: (updatedComplaint) => {
        this.isActionSubmitting.set(false);
        this.complaint.set(updatedComplaint);
        this.hodNoteInput = '';
        this.successMessage.set('Complaint resolved successfully!');
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        this.isActionSubmitting.set(false);
        console.error('Error resolving complaint:', err);
        this.actionErrorMessage.set(err.error?.message || 'Failed to sign-off and resolve.');
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
