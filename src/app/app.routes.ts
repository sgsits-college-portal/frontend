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

  {
    path: 'events',
    component: EventListComponent,
    canActivate: [authGuard]
  },

  {
    path: 'events/create',
    component: EventCreateComponent,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ADMIN', 'STAFF'],
      subRoles: ['EVENT_MANAGER']
    }
  },

  {
    path: 'events/participants',
    component: ParticipantListComponent,
    canActivate: [authGuard]
  },

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

  {
    path: 'complaints/feed',
    loadComponent: () => import('./complaint/feed/feed').then(m => m.Feed),
    canActivate: [authGuard]
  },

  {
    path: 'complaints/my',
    loadComponent: () => import('./complaint/my/my').then(m => m.My),
    canActivate: [authGuard]
  },

  {
    path: 'complaints/new',
    loadComponent: () => import('./complaint/new/new').then(m => m.New),
    canActivate: [authGuard]
  },

  {
    path: 'complaints/:id',
    loadComponent: () => import('./complaint/detail/detail').then(m => m.Detail),
    canActivate: [authGuard]
  },

  {
    path: 'admin/complaints',
    loadComponent: () => import('./complaint/admin/admin').then(m => m.Admin),
    canActivate: [authGuard]
  },

  {
    path: 'technician/complaints',
    loadComponent: () => import('./complaint/technician/technician').then(m => m.Technician),
    canActivate: [authGuard]
  },

  {
    path: 'hod/approvals',
    loadComponent: () => import('./complaint/hod/hod').then(m => m.Hod),
    canActivate: [authGuard]
  },

  // ─── Leave Module ──────────────────────────────────────────────────────────

  {
    path: 'leave/apply',
    loadComponent: () =>
      import('./pages/apply-leave/apply-leave').then(m => m.ApplyLeave),
    canActivate: [authGuard]
  },

  {
    path: 'leave/history',
    loadComponent: () =>
      import('./pages/leave-history/leave-history').then(m => m.LeaveHistory),
    canActivate: [authGuard]
  },

  {
    path: 'leave/admin',
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard').then(m => m.AdminDashboard),
    canActivate: [authGuard]
  },

  // ─── Library Module ────────────────────────────────────────────────────────

  {
    path: 'library',
    loadComponent: () =>
      import('./library/library.component').then(m => m.LibraryComponent),
    canActivate: [authGuard]
  },

  // ─── Catch-all ─────────────────────────────────────────────────────────────

  {
    path: '**',
    redirectTo: ''
  }
];