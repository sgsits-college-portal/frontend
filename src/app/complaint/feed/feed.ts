import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ComplaintService } from '../services/complaint.service';
import { AuthService } from '../../services/auth.service';
import { Complaint } from '../models/complaint.model';
import { HeaderComponent } from '../components/header/header';

@Component({
  selector: 'app-complaint-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent],
  templateUrl: './feed.html',
  styleUrl: './feed.css'
})
export class Feed implements OnInit {
  private readonly complaintService = inject(ComplaintService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // States
  readonly complaints = signal<Complaint[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly isWarmingUp = signal<boolean>(false);

  // Filters
  readonly searchFilter = signal<string>('');
  readonly categoryFilter = signal<string>('');
  readonly priorityFilter = signal<string>('');

  // Categories list
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

  // User details
  readonly user = this.authService.currentUser;

  ngOnInit(): void {
    this.loadFeed();
  }

  loadFeed(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.isWarmingUp.set(false);

    // Render free-tier cold-start handler
    const timer = setTimeout(() => {
      if (this.isLoading()) {
        this.isWarmingUp.set(true);
      }
    }, 4000);

    this.complaintService.getPublicFeed().subscribe({
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
        console.error('Error fetching public feed:', err);
        this.errorMessage.set('Failed to fetch public complaints. Please try again.');
      }
    });
  }

  // Filtered complaints computation
  readonly filteredComplaints = computed(() => {
    const list = this.complaints();
    const search = this.searchFilter().toLowerCase().trim();
    const cat = this.categoryFilter();
    const prio = this.priorityFilter();

    return list.filter(c => {
      const matchesSearch = !search || 
        c.title.toLowerCase().includes(search) || 
        c.description.toLowerCase().includes(search) || 
        (c.location && c.location.toLowerCase().includes(search)) ||
        c.userId.toLowerCase().includes(search);
      
      const matchesCategory = !cat || c.category === cat;
      const matchesPriority = !prio || c.priority === prio;

      return matchesSearch && matchesCategory && matchesPriority;
    });
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
      case 'OPEN': return 'bg-danger-subtle text-danger border border-danger-subtle';
      case 'IN_PROGRESS': return 'bg-primary-subtle text-primary border border-primary-subtle';
      case 'VERIFICATION_PENDING': return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
      case 'RESOLVED': return 'bg-success-subtle text-success border border-success-subtle';
      case 'REJECTED': return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
      default: return 'bg-light text-dark';
    }
  }
}
