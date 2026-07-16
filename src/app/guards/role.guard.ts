import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Role-based route guard.
 *
 * Usage in routes:
 *   {
 *     path: 'events/create',
 *     component: EventCreateComponent,
 *     canActivate: [authGuard, roleGuard],
 *     data: { roles: ['ADMIN', 'STAFF'], subRoles: ['EVENT_MANAGER'] }
 *   }
 *
 * Logic:
 *   - If route.data.roles is defined, the user's role must be in that list.
 *   - If route.data.subRoles is defined, a STAFF user must also have their
 *     subRole in that list.
 *   - If neither roles nor subRoles is defined, the guard allows access.
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser();

  // Should not happen if authGuard runs first, but defensive check
  if (!user) {
    router.navigate(['/']);
    return false;
  }

  const allowedRoles: string[] | undefined = route.data?.['roles'];
  const allowedSubRoles: string[] | undefined = route.data?.['subRoles'];

  // No role restriction on this route — allow all authenticated users
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  // Check if user's role is in allowed roles
  const roleAllowed = allowedRoles.includes(user.role);

  if (!roleAllowed) {
    // Redirect to events list as a safe fallback
    router.navigate(['/events']);
    return false;
  }

  // If subRoles restriction exists, check subRole for STAFF
  if (allowedSubRoles && allowedSubRoles.length > 0 && user.role === 'STAFF') {
    if (!user.subRole || !allowedSubRoles.includes(user.subRole)) {
      router.navigate(['/events']);
      return false;
    }
  }

  return true;
};
