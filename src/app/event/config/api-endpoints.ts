/**
 * API endpoint configuration for the SGSITS College Portal frontend.
 *
 * All backend API calls are routed through the API Gateway (port 8080).
 * Centralize all endpoint paths here so routes can be updated in one place
 * if the gateway configuration changes.
 *
 * Gateway route mappings (configured in gateway-service):
 *   /auth/**          → auth-service   (http://localhost:8080)
 *   /events/**        → event-service  (http://localhost:8080)
 *   /registrations/** → event-service  (http://localhost:8080)
 *
 * NOTE: The event-service gateway route must be added by the backend team.
 *       Until then, the frontend will gracefully fall back to offline mock data.
 */

/** Base URL for the API Gateway */
export const GATEWAY_BASE_URL = 'https://gateway-service-sc5r.onrender.com';

/** Auth service endpoints (via gateway) */
export const AUTH_API = {
  LOGIN:    `${GATEWAY_BASE_URL}/api/auth/login`,
  REGISTER: `${GATEWAY_BASE_URL}/api/auth/register`,
  VALIDATE: `${GATEWAY_BASE_URL}/api/auth/validate`,
  GET_USERS: `${GATEWAY_BASE_URL}/api/auth/users`
} as const;

/** Event service — events endpoint (via+ gateway) */
export const EVENTS_API = {
  BASE:        `${GATEWAY_BASE_URL}/events`,
  GET_ALL:     `${GATEWAY_BASE_URL}/events`,
  GET_BY_ID:   (id: number) => `${GATEWAY_BASE_URL}/events/${id}`,
  CREATE:      `${GATEWAY_BASE_URL}/events`,
  DELETE:      (id: number) => `${GATEWAY_BASE_URL}/events/${id}`
} as const;

/** Event service — registrations endpoint (via gateway) */
export const REGISTRATIONS_API = {
  BASE:           `${GATEWAY_BASE_URL}/registrations`,
  GET_ALL:        `${GATEWAY_BASE_URL}/registrations`,
  GET_BY_ID:      (id: number) => `${GATEWAY_BASE_URL}/registrations/${id}`,
  GET_BY_EVENT:   (eventId: number) => `${GATEWAY_BASE_URL}/registrations/event/${eventId}`,
  REGISTER:       (eventId: number, userId: number) =>
                    `${GATEWAY_BASE_URL}/registrations/event/${eventId}/user/${userId}`,
  DELETE:         (id: number) => `${GATEWAY_BASE_URL}/registrations/${id}`
} as const;

/**
 * @deprecated Use EVENTS_API or REGISTRATIONS_API instead.
 * Kept for backwards compatibility with existing service code during migration.
 */
export const API_BASE_URL = GATEWAY_BASE_URL;
