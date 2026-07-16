/**
 * Portal-wide role definitions aligned with auth-service.
 * These match the 'role' field returned in UserSession from AuthService.
 */
export enum Role {
  ADMIN = 'ADMIN',
  HEAD = 'HEAD',
  FACULTY = 'FACULTY',
  STUDENT = 'STUDENT',
  STAFF = 'STAFF'
}

/**
 * Sub-role definitions for STAFF users.
 * These match the 'subRole' field returned in UserSession from AuthService.
 */
export enum SubRole {
  LIBRARIAN = 'LIBRARIAN',
  TECHNICIAN = 'TECHNICIAN',
  EVENT_MANAGER = 'EVENT_MANAGER'
}
