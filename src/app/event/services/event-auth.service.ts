import { Injectable, inject } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService, UserSession } from '../../services/auth.service';
import { SubRole } from '../models/role.enum';
import { AUTH_API } from '../config/api-endpoints';
import { PortalUser } from '../models/user.model';

/**
 * EventAuthService — convenience wrapper around the global AuthService
 * for use within the Event module.
 *
 * Provides:
 *  - Typed access to the current user session
 *  - Role/subRole permission checks specific to the Event module
 *  - HTTP Authorization headers with Bearer JWT token
 *
 * This service reads from AuthService signals so components stay reactive.
 */
@Injectable({
  providedIn: 'root'
})
export class EventAuthService {

  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);

  // ─── User Lookup ────────────────────────────────────────────────────────────

  /**
   * Fetches all registered portal users from the auth-service.
   * Used by admin screens and participant lists to resolve participantUserIds.
   */
  getAllUsers(): Observable<PortalUser[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<PortalUser[]>(AUTH_API.GET_USERS, { headers }).pipe(
      catchError(() => {
        console.warn('[EventAuthService] Could not fetch users from auth-service. Using fallback.');
        return of([]);
      })
    );
  }

  // ─── Current User Access ────────────────────────────────────────────────────

  /** Returns the current logged-in user session, or null if not authenticated. */
  getCurrentUser(): UserSession | null {
    return this.authService.currentUser();
  }

  /** Returns the current user's role string (e.g. 'ADMIN', 'STUDENT'). */
  getCurrentRole(): string {
    return this.authService.currentUser()?.role ?? '';
  }

  /** Returns the current user's subRole (e.g. 'EVENT_MANAGER'), or null. */
  getCurrentSubRole(): string | null {
    return this.authService.currentUser()?.subRole ?? null;
  }

  /** Returns the current user's numeric ID from auth-service. */
  getCurrentUserId(): number {
    return this.authService.currentUser()?.id ?? 0;
  }

  // ─── Permission Checks — Event Module ───────────────────────────────────────

  /**
   * ADMIN or STAFF with subRole EVENT_MANAGER can create events.
   */
  canCreateEvent(): boolean {
    const role = this.getCurrentRole();
    const subRole = this.getCurrentSubRole();
    return role === 'ADMIN' || (role === 'STAFF' && subRole === SubRole.EVENT_MANAGER);
  }

  /**
   * ADMIN or STAFF with subRole EVENT_MANAGER can edit/delete events.
   */
  canDeleteEvent(): boolean {
    return this.canCreateEvent();
  }

  /**
   * ADMIN, EVENT_MANAGER (STAFF), and HEAD can view all registrations.
   */
  canViewAllRegistrations(): boolean {
    const role = this.getCurrentRole();
    const subRole = this.getCurrentSubRole();
    return (
      role === 'ADMIN' ||
      role === 'HOD' ||
      (role === 'STAFF' && subRole === SubRole.EVENT_MANAGER)
    );
  }

  /**
   * STUDENT and FACULTY can register themselves for events.
   * STAFF and HEAD are excluded from self-registration.
   * ADMIN and EVENT_MANAGER can register others.
   */
  canRegisterForEvent(): boolean {
    const role = this.getCurrentRole();
    return role === 'STUDENT' ||
             role === 'FACULTY' ||
             role === 'HEAD' ||
             role === 'HOD';
  }

  /**
   * Returns true if the current user has any access to the event module.
   * All authenticated portal users can view the event list.
   */
  canViewEvents(): boolean {
    const role = this.getCurrentRole();
    return ['ADMIN', 'HEAD', 'FACULTY', 'STUDENT', 'STAFF'].includes(role);
  }

  // ─── HTTP Helpers ────────────────────────────────────────────────────────────

  /**
   * Builds an HttpHeaders object with the Authorization Bearer token
   * from the current session. Use this for all authenticated API calls.
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });
  }
}
