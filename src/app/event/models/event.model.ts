/**
 * Event model — aligned with backend Event entity.
 *
 * Backend fields:
 *   eventId, eventName, description, eventDate, eventTime,
 *   venue, capacity, createdByUserId
 *
 * Removed from old model (not in backend entity):
 *   category, status, organizerId
 */
export interface Event {
  eventId?: number;
  eventName: string;
  description?: string;
  eventDate: string;    // ISO date string: "2026-08-15"
  eventTime: string;    // ISO time string: "10:00:00"
  venue?: string;
  capacity?: number;
  createdByUserId?: number;
}
