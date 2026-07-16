/**
 * UserService — DEPRECATED for the event module.
 *
 * The old standalone user management (registering new users, listing all users)
 * has been replaced by the centralized auth-service:
 *   - New users are created by ADMIN via POST /auth/api/auth/register
 *   - The current logged-in user is available via AuthService.currentUser()
 *   - User listing is not available from the event-service
 *
 * This file is kept to avoid breaking imports during migration but all methods
 * are no-ops that return empty observables. Components should use AuthService
 * and EventAuthService instead.
 *
 * TODO: Remove this file once all component imports are cleaned up.
 */
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  /**
   * @deprecated User registration is handled by auth-service.
   * Use AuthService.register() (ADMIN only) instead.
   */
  register(_user: any): Observable<any> {
    console.warn('[UserService] UserService.register() is deprecated. Use AuthService.register() instead.');
    return of(null);
  }

  /**
   * @deprecated User listing is not available from event-service.
   * The event module now only works with participantUserId (from auth-service).
   */
  getAllUsers(): Observable<any[]> {
    console.warn('[UserService] UserService.getAllUsers() is deprecated. User management is via auth-service.');
    return of([]);
  }
}
