import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, timeout, map } from 'rxjs/operators';
import { Event } from '../models/event.model';
import { EVENTS_API } from '../config/api-endpoints';
import { EventAuthService } from './event-auth.service';

/**
 * Paginated response shape returned by Spring Data Page<Event>.
 * The backend GET /events endpoint returns this structure.
 */
interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {

  private readonly http = inject(HttpClient);
  private readonly eventAuth = inject(EventAuthService);

  /**
   * Offline mock data — used as fallback when backend is unavailable.
   * Includes all fields from the backend Event entity.
   */
  private readonly defaultMockEvents: Event[] = [
    {
      eventId: 1,
      eventName: 'AI Workshop',
      description: 'Introduction to Artificial Intelligence and Machine Learning concepts.',
      eventDate: '2026-08-15',
      eventTime: '10:00:00',
      venue: 'Seminar Hall A',
      capacity: 120,
      createdByUserId: 1
    },
    {
      eventId: 2,
      eventName: 'Hackathon 2026',
      description: '24-hour coding marathon. Build innovative solutions to real-world problems.',
      eventDate: '2026-08-20',
      eventTime: '09:00:00',
      venue: 'Auditorium',
      capacity: 200,
      createdByUserId: 1
    },
    {
      eventId: 3,
      eventName: 'Career Fair',
      description: 'Meet top companies and explore internship and job opportunities.',
      eventDate: '2026-09-05',
      eventTime: '11:00:00',
      venue: 'Main Ground',
      capacity: 500,
      createdByUserId: 1
    }
  ];

  private readonly MOCK_STORAGE_KEY = 'sgsits_mock_events_v1';

  constructor() {
    if (!localStorage.getItem(this.MOCK_STORAGE_KEY)) {
      localStorage.setItem(this.MOCK_STORAGE_KEY, JSON.stringify(this.defaultMockEvents));
    }
  }

  private getMockEvents(): Event[] {
    const stored = localStorage.getItem(this.MOCK_STORAGE_KEY);
    return stored ? JSON.parse(stored) : this.defaultMockEvents;
  }

  private saveMockEvents(events: Event[]): void {
    localStorage.setItem(this.MOCK_STORAGE_KEY, JSON.stringify(events));
  }

  // ─── API Methods ─────────────────────────────────────────────────────────────

  /**
   * Create a new event.
   * Automatically sets createdByUserId from current auth session.
   * Backend requires ADMIN role (enforced via JWT on the backend).
   */
  createEvent(event: Event): Observable<Event> {
    const payload: Event = {
      ...event,
      createdByUserId: this.eventAuth.getCurrentUserId()
    };
    const headers = this.eventAuth.getAuthHeaders();

    return this.http.post<Event>(EVENTS_API.CREATE, payload, { headers }).pipe(
      timeout(5000),
      catchError(() => {
        console.warn('[EventService] Backend offline or gateway route missing. Creating event in offline store.');
        const mockEvents = this.getMockEvents();
        const newEvent: Event = { ...payload, eventId: Date.now() % 100000 };
        mockEvents.push(newEvent);
        this.saveMockEvents(mockEvents);
        return of(newEvent);
      })
    );
  }

  /**
   * Get all events. Backend returns Spring Page<Event> — this method
   * unwraps the `content` array automatically.
   * Supports pagination via optional page/size query params (defaults: 0/100).
   */
  getAllEvents(page = 0, size = 100): Observable<Event[]> {
    const headers = this.eventAuth.getAuthHeaders();
    const url = `${EVENTS_API.GET_ALL}?page=${page}&size=${size}`;

    return this.http.get<PagedResponse<Event> | Event[]>(url, { headers }).pipe(
      timeout(5000),
      map(response => {
        // Handle both paginated Spring response and plain array (for flexibility)
        if (response && typeof response === 'object' && 'content' in response) {
          return (response as PagedResponse<Event>).content;
        }
        return response as Event[];
      }),
      catchError(() => {
        console.warn('[EventService] Backend offline or gateway route missing. Returning offline events.');
        return of(this.getMockEvents());
      })
    );
  }

  /**
   * Get a single event by ID.
   */
  getEvent(id: number): Observable<Event> {
    const headers = this.eventAuth.getAuthHeaders();

    return this.http.get<Event>(EVENTS_API.GET_BY_ID(id), { headers }).pipe(
      timeout(5000),
      catchError(() => {
        const mockEvent = this.getMockEvents().find(e => e.eventId === id);
        if (mockEvent) return of(mockEvent);
        return throwError(() => new Error(`Event ${id} not found in offline store.`));
      })
    );
  }

  /**
   * Delete an event by ID.
   * Backend requires ADMIN role (enforced via JWT on the backend).
   */
  deleteEvent(id: number): Observable<string> {
    const headers = this.eventAuth.getAuthHeaders();

    return this.http.delete(EVENTS_API.DELETE(id), { headers, responseType: 'text' }).pipe(
      timeout(5000),
      catchError(() => {
        console.warn('[EventService] Backend offline. Deleting event from offline store.');
        const filtered = this.getMockEvents().filter(e => e.eventId !== id);
        this.saveMockEvents(filtered);
        return of('Deleted locally');
      })
    );
  }
}
