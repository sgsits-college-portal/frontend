import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  readonly authService = inject(AuthService);

  // Get active session user
  readonly user = this.authService.currentUser;

  // Unified Services List for the Dashboard
  readonly services = signal<ServiceItem[]>([
    {
      id: 1,
      title: 'Library Service',
      description: 'Access digital catalogs, available books, and track current borrowings seamlessly.',
      iconClass: 'bi-journal-bookmark-fill',
      badge: 'Active',
      url: 'http://localhost:4201/'
    },
    {
      id: 2,
      title: 'Event Service',
      description: 'Browse upcoming campus events, technical fests, and register in a tap.',
      iconClass: 'bi-calendar-event-fill',
      badge: 'Coming Soon'
    },
    {
      id: 3,
      title: 'Leave Service',
      description: 'Apply for academic or official leaves and view instant approval status workflows.',
      iconClass: 'bi-file-earmark-check-fill',
      badge: 'Coming Soon'
    },
    {
      id: 4,
      title: 'Complaint Service',
      description: 'Submit campus complaints, infrastructure feedback, and track resolution status.',
      iconClass: 'bi-exclamation-triangle-fill',
      badge: 'Coming Soon'
    }
  ]);

  openService(service: ServiceItem): void {
    if (service.id === 1 && service.url) {
      const token = localStorage.getItem('sgsits_auth_token') || '';
      const u = this.user();
      if (u) {
        // Construct standard portal redirection URL carrying session context
        const redirectUrl = `${service.url}?token=${encodeURIComponent(token)}` +
          `&id=${u.id}` +
          `&username=${encodeURIComponent(u.username)}` +
          `&role=${encodeURIComponent(u.role)}` +
          `&subRole=${encodeURIComponent(u.subRole || '')}` +
          `&fullName=${encodeURIComponent(u.fullName)}` +
          `&email=${encodeURIComponent(u.email || '')}`;
        
        window.location.href = redirectUrl;
      } else {
        window.location.href = service.url;
      }
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
