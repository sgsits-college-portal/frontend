import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { Registration } from '../models/registration.model';
import { Status } from '../models/status.enum';
import { REGISTRATIONS_API } from '../config/api-endpoints';
import { EventAuthService } from './event-auth.service';

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {

  private readonly http = inject(HttpClient);
  private readonly eventAuth = inject(EventAuthService);

  private readonly MOCK_STORAGE_KEY = 'sgsits_mock_registrations_v1';

  constructor() {
    if (!localStorage.getItem(this.MOCK_STORAGE_KEY)) {
      localStorage.setItem(this.MOCK_STORAGE_KEY, JSON.stringify([]));
    }
  }

  private getMockRegistrations(): Registration[] {
    const stored = localStorage.getItem(this.MOCK_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveMockRegistrations(registrations: Registration[]): void {
    localStorage.setItem(this.MOCK_STORAGE_KEY, JSON.stringify(registrations));
  }

  // ─── API Methods ─────────────────────────────────────────────────────────────

  /**
   * Register a participant for an event.
   *
   * Backend endpoint: POST /registrations/event/{eventId}/user/{userId}
   * This uses path parameters — NOT a JSON request body.
   *
   * @param eventId - ID of the event to register for
   * @param userId  - ID of the participant (from auth-service)
   */
  registerForEvent(eventId: number, userId: number): Observable<Registration> {
    const headers = this.eventAuth.getAuthHeaders();
    const url = REGISTRATIONS_API.REGISTER(eventId, userId);

    return this.http.post<Registration>(url, {}, { headers }).pipe(
      timeout(5000),
      catchError(() => {
        console.warn('[RegistrationService] Backend offline. Registering locally.');
        // Find the event from mock events for the offline registration object
        const storedEvents = localStorage.getItem('sgsits_mock_events_v1');
        const events = storedEvents ? JSON.parse(storedEvents) : [];
        const event = events.find((e: any) => e.eventId === eventId) ?? { eventId, eventName: 'Unknown Event', eventDate: '', eventTime: '' };

        const newReg: Registration = {
          registrationId: Date.now() % 100000,
          participantUserId: userId,
          event,
          registrationDate: new Date().toISOString(),
          status: Status.REGISTERED
        };
        const mocks = this.getMockRegistrations();
        mocks.push(newReg);
        this.saveMockRegistrations(mocks);
        return of(newReg);
      })
    );
  }

  /**
   * Get all registrations.
   * ADMIN / EVENT_MANAGER / HEAD use this to view all registrations.
   * STUDENT / FACULTY filter client-side by their own participantUserId.
   */
  getAll(): Observable<Registration[]> {
    const headers = this.eventAuth.getAuthHeaders();

    return this.http.get<Registration[]>(REGISTRATIONS_API.GET_ALL, { headers }).pipe(
      timeout(5000),
      catchError(() => {
        console.warn('[RegistrationService] Backend offline. Returning offline registrations.');
        return of(this.getMockRegistrations());
      })
    );
  }

  /**
   * Get all registrations for a specific event.
   */
  getByEvent(eventId: number): Observable<Registration[]> {
    const headers = this.eventAuth.getAuthHeaders();

    return this.http.get<Registration[]>(REGISTRATIONS_API.GET_BY_EVENT(eventId), { headers }).pipe(
      timeout(5000),
      catchError(() => {
        const mocks = this.getMockRegistrations();
        return of(mocks.filter(r => r.event?.eventId === eventId));
      })
    );
  }

  /**
   * Get a single registration by ID.
   */
  getById(id: number): Observable<Registration> {
    const headers = this.eventAuth.getAuthHeaders();

    return this.http.get<Registration>(REGISTRATIONS_API.GET_BY_ID(id), { headers }).pipe(
      timeout(5000),
      catchError(() => {
        const mocks = this.getMockRegistrations();
        const reg = mocks.find(r => r.registrationId === id);
        if (reg) return of(reg);
        return throwError(() => new Error(`Registration ${id} not found in offline store.`));
      })
    );
  }

  /**
   * Permanently delete a registration record.
   * Typically restricted to ADMIN / EVENT_MANAGER on the backend.
   *
   * NOTE: Cancellation (status update to CANCELLED) is NOT yet implemented.
   * This requires a backend PATCH/PUT endpoint that does not currently exist.
   * Only hard-delete is supported for now.
   */
  delete(id: number): Observable<void> {
    const headers = this.eventAuth.getAuthHeaders();

    return this.http.delete<void>(REGISTRATIONS_API.DELETE(id), { headers }).pipe(
      timeout(5000),
      catchError(() => {
        console.warn('[RegistrationService] Backend offline. Deleting registration locally.');
        const filtered = this.getMockRegistrations().filter(r => r.registrationId !== id);
        this.saveMockRegistrations(filtered);
        return of(undefined);
      })
    );
  }
}
