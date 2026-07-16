import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { EventListComponent } from './event/components/event-list/event-list';
import { EventCreateComponent } from './event/components/event-create/event-create';
import { ParticipantListComponent } from './event/components/participant-list/participant-list';
import { RegisterParticipantComponent } from './event/components/register-participant/register-participant';

export const routes: Routes = [
  // ─── Public / Login ────────────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./login/login').then(m => m.Login),
    canActivate: [loginGuard]
  },

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [authGuard]
  },

  // ─── Event Module ──────────────────────────────────────────────────────────

  /**
   * Event List — all authenticated portal users can view events
   */
  {
    path: 'events',
    component: EventListComponent,
    canActivate: [authGuard]
  },

  /**
   * Create Event — ADMIN or STAFF with EVENT_MANAGER subRole
   */
  {
    path: 'events/create',
    component: EventCreateComponent,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ADMIN', 'STAFF'],
      subRoles: ['EVENT_MANAGER']
    }
  },

  /**
   * Participant / Registration List
   *   - ADMIN, EVENT_MANAGER: see all registrations
   *   - HEAD: read-only view of all registrations
   *   - STUDENT, FACULTY: see only their own registrations
   */
  {
    path: 'events/participants',
    component: ParticipantListComponent,
    canActivate: [authGuard]
  },

  /**
   * Register for an Event — STUDENT, FACULTY (self-registration)
   * ADMIN and EVENT_MANAGER can also access to register others
   */
  {
    path: 'events/register',
    component: RegisterParticipantComponent,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['STUDENT', 'FACULTY', 'ADMIN', 'STAFF'],
      subRoles: ['EVENT_MANAGER']
    }
  },

  // ─── Catch-all ─────────────────────────────────────────────────────────────
  {
    path: 'library',
    loadComponent: () => import('./library/library.component').then(m => m.LibraryComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
