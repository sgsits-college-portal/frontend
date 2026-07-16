import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ComplaintService } from '../services/complaint.service';
import { AuthService } from '../../services/auth.service';
import { Complaint } from '../models/complaint.model';
import { HeaderComponent } from '../components/header/header';

@Component({
  selector: 'app-complaint-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {
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
  readonly showAssignModal = signal<boolean>(false);
  readonly technicians = signal<any[]>([]);
  selectedTechnicianId = '';
  activeComplaintForAssign: Complaint | null = null;

  // Filters
  readonly searchFilter = signal<string>('');
  readonly statusFilter = signal<string>('');
  readonly categoryFilter = signal<string>('');
  readonly priorityFilter = signal<string>('');

  readonly categories = [
    'Infrastructure',
    'IT / Network',
    'Hostel',
    'Academics',
    'Library',
    'Canteen / Mess',
    'Transport',
    'Sports',
    'Cleanliness / Hygiene',
    'Security',
    'Electrical',
    'Plumbing',
    'Other'
  ];

  // User session
  readonly user = this.authService.currentUser;

  ngOnInit(): void {
    this.loadAllComplaints();
    this.loadTechnicians();
  }

  loadAllComplaints(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.isWarmingUp.set(false);

    const timer = setTimeout(() => {
      if (this.isLoading()) {
        this.isWarmingUp.set(true);
      }
    }, 4000);

    this.complaintService.getAllComplaints().subscribe({
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
        console.error('Error loading all complaints:', err);
        this.errorMessage.set('Failed to load system complaints catalog.');
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
        console.error('Error loading technicians:', err);
      }
    });
  }

  // Filter computation
  readonly filteredComplaints = computed(() => {
    const list = this.complaints();
    const search = this.searchFilter().toLowerCase().trim();
    const status = this.statusFilter();
    const cat = this.categoryFilter();
    const prio = this.priorityFilter();

    return list.filter(c => {
      const matchesSearch = !search || 
        c.id.toString().includes(search) ||
        c.title.toLowerCase().includes(search) || 
        c.userId.toLowerCase().includes(search) ||
        (c.adminId && c.adminId.toLowerCase().includes(search)) ||
        (c.location && c.location.toLowerCase().includes(search));

      const matchesStatus = !status || c.status === status;
      const matchesCategory = !cat || c.category === cat;
      const matchesPriority = !prio || c.priority === prio;

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });
  });

  openAssignModal(item: Complaint): void {
    this.activeComplaintForAssign = item;
    this.selectedTechnicianId = item.adminId || '';
    this.showAssignModal.set(true);
  }

  onAssignTechnician(): void {
    const item = this.activeComplaintForAssign;
    const admin = this.user();
    if (!item || !admin || !this.selectedTechnicianId) return;

    this.isActionSubmitting.set(true);
    this.complaintService.assignTechnician(item.id, this.selectedTechnicianId, admin.username).subscribe({
      next: (updated) => {
        this.isActionSubmitting.set(false);
        this.showAssignModal.set(false);
        this.activeComplaintForAssign = null;
        // Update local list
        this.complaints.update(list => list.map(c => c.id === updated.id ? updated : c));
      },
      error: (err) => {
        this.isActionSubmitting.set(false);
        console.error('Error assigning technician:', err);
        alert(err.error?.message || 'Failed to assign technician.');
      }
    });
  }

  onToggleVisibility(item: Complaint, newPublicStatus: boolean): void {
    this.complaintService.toggleVisibility(item.id, newPublicStatus).subscribe({
      next: (updated) => {
        // Update local list
        this.complaints.update(list => list.map(c => c.id === updated.id ? updated : c));
      },
      error: (err) => {
        console.error('Error toggling visibility:', err);
        alert(err.error?.message || 'Failed to update visibility.');
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
