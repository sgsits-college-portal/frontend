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

  // ─── Complaint Module ──────────────────────────────────────────────────────

  /**
   * Public Feed — all authenticated users can view the public complaint feed
   */
  {
    path: 'complaints/feed',
    loadComponent: () => import('./complaint/feed/feed').then(m => m.Feed),
    canActivate: [authGuard]
  },

  /**
   * My Complaints — students, faculty, HOD, and staff can see their own complaints
   */
  {
    path: 'complaints/my',
    loadComponent: () => import('./complaint/my/my').then(m => m.My),
    canActivate: [authGuard]
  },

  /**
   * File a Complaint — student, faculty, HOD, etc. can file new complaints
   */
  {
    path: 'complaints/new',
    loadComponent: () => import('./complaint/new/new').then(m => m.New),
    canActivate: [authGuard]
  },

  /**
   * Complaint Details — view a single complaint by id
   */
  {
    path: 'complaints/:id',
    loadComponent: () => import('./complaint/detail/detail').then(m => m.Detail),
    canActivate: [authGuard]
  },

  /**
   * Admin Dashboard — view and manage all complaints, assign technicians
   */
  {
    path: 'admin/complaints',
    loadComponent: () => import('./complaint/admin/admin').then(m => m.Admin),
    canActivate: [authGuard]
  },

  /**
   * Technician Tasks — assigned complaints dashboard for technicians
   */
  {
    path: 'technician/complaints',
    loadComponent: () => import('./complaint/technician/technician').then(m => m.Technician),
    canActivate: [authGuard]
  },

  /**
   * HOD Approvals — sign-off and resolution panel for HODs
   */
  {
    path: 'hod/approvals',
    loadComponent: () => import('./complaint/hod/hod').then(m => m.Hod),
    canActivate: [authGuard]
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
