/**
 * PortalUser — represents the auth-service user session model used throughout
 * the portal frontend.
 *
 * This re-exports the shape from AuthService so event-module components don't
 * need to import from a different service path. It exactly mirrors UserSession
 * in auth.service.ts.
 *
 * Fields from auth-service AuthResponse / UserSession:
 *   id, username, role, subRole, fullName, email
 *
 * NOTE: The old standalone User model (userId, name, email, phone, password,
 * role, createdAt) has been replaced. Auth and user management are now fully
 * handled by auth-service. This file is kept for type convenience.
 */
export interface PortalUser {
  id: number;
  username?: string;
  role: string;
  subRole: string | null;
  fullName: string;
  email: string | null;
}
