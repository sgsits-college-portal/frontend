import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-event-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="event-nav">
      <button routerLink="/events" routerLinkActive="active-nav" [routerLinkActiveOptions]="{ exact: true }">Events</button>
      @if (user()?.role === 'ADMIN' ||
          (user()?.role === 'STAFF' && user()?.subRole === 'EVENT_MANAGER')) {
        <button routerLink="/events/create" routerLinkActive="active-nav">Create Event</button>
      }
      <button routerLink="/events/participants" routerLinkActive="active-nav">Registrations</button>
    </div>
  `,
  styles: [`
    .event-nav {
      display: flex;
      gap: 1rem;
      padding: 1rem 0;
      flex-wrap: wrap;
    }

    .event-nav button {
      padding: 0.7rem 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: white;
      cursor: pointer;
    }

    .event-nav button:hover {
      background: #f3f4f6;
    }

    .active-nav {
      background: var(--primary) !important;
      color: white !important;
      border-color: var(--primary) !important;
      box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.25);
    }
  `]
})
export class EventNavbarComponent {
  readonly authService = inject(AuthService);
  readonly user = this.authService.currentUser;
}
