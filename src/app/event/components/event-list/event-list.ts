import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EventService } from '../../services/event.service';
import { RegistrationService } from '../../services/registration.service';
import { NotificationService } from '../../services/notification.service';
import { EventAuthService } from '../../services/event-auth.service';
import { Event } from '../../models/event.model';

import { EventHeaderComponent } from '../header/header';

interface EventWithCounts extends Event {
  registeredCount: number;
}

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, EventHeaderComponent],
  template: `
    <app-event-header></app-event-header>
    <div class="events-wrapper min-vh-100 py-4 px-2">

      <!-- Title Header -->
      <div class="events-main-header rounded-4 bg-white border d-flex justify-content-between align-items-center p-5 mb-4 mx-3 shadow-sm position-relative overflow-hidden">
        <div class="header-content z-2">
          <h1 class="display-4 fw-bolder mb-2 text-dark" style="letter-spacing: -0.03em;">EVENTS</h1>
          <p class="text-muted fs-5 mb-0">Discover and participate in amazing events.</p>
        </div>
        <div class="header-illustration d-none d-md-block position-absolute end-0 bottom-0 pe-4">
          <img src="/images/calendar_illustration.jpg" alt="Calendar" class="img-fluid" style="max-height: 200px; opacity: 0.9;" onerror="this.style.display='none'">
        </div>
      </div>

      <div class="container-xl">
        <!-- Controls -->
        <div class="card bg-white border shadow-sm p-4 mb-4">
          <div class="row align-items-center g-3">
            <div class="col-md-6">
              <h6 class="fw-bold text-dark mb-1 text-uppercase" style="letter-spacing: 0.5px;">Event Controls</h6>
              <p class="text-muted small mb-0">Search and filter available events.</p>
            </div>
            <!-- Create Event — ADMIN or EVENT_MANAGER -->
            <div class="col-md-6 text-md-end d-flex gap-2 justify-content-md-end" *ngIf="canCreate">
              <a routerLink="/events/create" id="btn-create-event"
                 class="btn btn-primary d-flex align-items-center gap-2 shadow-sm fw-semibold px-4 rounded-3">
                <i class="bi bi-plus-lg"></i> Create Event
              </a>
            </div>
          </div>

          <div class="row mt-4 g-3 align-items-center">
            <!-- Search -->
            <div class="col-lg-6 position-relative">
              <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
              <input
                type="text"
                id="event-search"
                class="form-control ps-5 rounded-3 py-2 bg-light border-light-subtle"
                placeholder="Search event title, venue, or description..."
                [(ngModel)]="searchQuery"
                (input)="filterEvents()"
              />
            </div>
            <!-- Sort Selector -->
            <div class="col-lg-4 ms-auto d-flex gap-3 align-items-center justify-content-end">
              <select id="event-filter-status"
                      class="form-select py-2 bg-white"
                      [(ngModel)]="selectedFilter"
                      (change)="filterEvents()"
                      style="max-width: 200px;">
                <option value="all">Status: All</option>
                <option value="upcoming">Upcoming Events</option>
                <option value="past">Past Events</option>
              </select>

              <div class="btn-group border rounded-3 p-1 bg-white shadow-sm">
                <button type="button" id="btn-grid-view"
                        class="btn btn-sm rounded-2 py-1 px-3 border-0 d-flex align-items-center justify-content-center"
                        [ngClass]="isGridView ? 'bg-primary-subtle text-primary fw-bold' : 'text-muted'"
                        (click)="isGridView = true">
                  <i class="bi bi-grid-3x3-gap-fill fs-6"></i>
                </button>
                <button type="button" id="btn-list-view"
                        class="btn btn-sm rounded-2 py-1 px-3 border-0 d-flex align-items-center justify-content-center"
                        [ngClass]="!isGridView ? 'bg-primary-subtle text-primary fw-bold' : 'text-muted'"
                        (click)="isGridView = false">
                  <i class="bi bi-list-task fs-6"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="card border-0 shadow-sm p-5 text-center my-4">
          <div class="spinner-border text-primary my-2" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="text-muted mt-2 mb-0">Loading events...</p>
        </div>

        <!-- Grid View -->
        <div *ngIf="!loading && isGridView && filteredEvents.length > 0" class="row g-4 mt-2">
          <div *ngFor="let event of filteredEvents" class="col-md-6 col-lg-4 col-xl-3 animate-card">
            <div class="card border bg-white shadow-sm position-relative overflow-hidden rounded-4 hover-lift h-100">
              <!-- Card Banner -->
              <div class="position-relative overflow-hidden rounded-top-4" style="height: 160px;">
                <span class="position-absolute top-0 start-0 m-3 badge bg-primary text-white px-2 py-1 text-uppercase rounded-1 shadow-sm"
                      style="z-index: 10; font-size: 0.65rem; letter-spacing: 0.5px;">
                  {{ getEventCategory(event) }}
                </span>
                <img [src]="getEventImage(event)" class="w-100 h-100 object-fit-cover card-banner" alt="Event banner" />
              </div>

              <!-- Card Body -->
              <div class="card-body p-4 bg-white d-flex flex-column justify-content-between position-relative rounded-bottom-4">
                <div>
                  <h5 class="fw-bold text-dark mb-2 text-truncate">{{ event.eventName }}</h5>
                  <p class="text-muted text-xs text-truncate-3 mb-4" style="min-height: 3.5em;">
                    {{ event.description || 'Join fellow students and faculty members in this event.' }}
                  </p>

                  <div class="d-flex flex-column gap-2 mb-4">
                    <div class="d-flex align-items-center text-muted small">
                      <i class="bi bi-geo-alt me-2 text-muted"></i>
                      <span class="text-truncate">{{ event.venue || 'To Be Announced' }}</span>
                    </div>
                    <div class="d-flex align-items-center text-muted small">
                      <i class="bi bi-calendar-event me-2 text-muted"></i>
                      <span>{{ event.eventDate }} &nbsp;•&nbsp; {{ event.eventTime }}</span>
                    </div>
                  </div>
                </div>

                <!-- Capacity & Actions -->
                <div>
                  <div class="d-flex justify-content-between align-items-center text-muted small mb-3">
                    <span class="badge bg-primary-subtle text-primary rounded-1 px-2 py-1 fw-bold"
                          style="font-size: 0.65rem; letter-spacing: 0.5px;">UPCOMING</span>
                    <span class="fw-semibold d-flex align-items-center gap-1">
                      <i class="bi bi-people-fill text-muted"></i>
                      {{ event.registeredCount }} / {{ event.capacity ?? '—' }}
                    </span>
                  </div>

                  <div class="d-flex gap-2">
                    <!-- Register — STUDENT or FACULTY -->
                    <a *ngIf="canRegister"
                       [routerLink]="['/events/register']"
                       [queryParams]="{ eventId: event.eventId }"
                       [id]="'btn-register-' + event.eventId"
                       class="btn btn-primary btn-sm flex-grow-1 py-2 fw-semibold">
                      Register
                    </a>
                    <!-- Register (Admin flow) — ADMIN or EVENT_MANAGER -->
                    <a *ngIf="canCreate && !canRegister"
                       [routerLink]="['/events/register']"
                       [queryParams]="{ eventId: event.eventId }"
                       [id]="'btn-reg-admin-' + event.eventId"
                       class="btn btn-outline-primary btn-sm flex-grow-1 py-2 fw-semibold">
                      <i class="bi bi-person-plus me-1"></i>Register
                    </a>
                    <!-- Delete — ADMIN or EVENT_MANAGER -->
                    <button *ngIf="canDelete"
                            (click)="onDelete(event.eventId!)"
                            [id]="'btn-delete-' + event.eventId"
                            class="btn btn-outline-danger btn-sm py-2 px-3 d-flex align-items-center justify-content-center"
                            title="Delete Event">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- List View -->
        <div *ngIf="!loading && !isGridView && filteredEvents.length > 0" class="d-flex flex-column gap-3 mt-2">
          <div *ngFor="let event of filteredEvents" class="card border bg-white shadow-sm overflow-hidden rounded-4 hover-lift">
            <div class="row g-0 align-items-center">
              <div class="col-md-3 col-lg-2">
                <img [src]="getEventImage(event)" class="img-fluid w-100 h-100 object-fit-cover" alt="Event banner" style="min-height: 120px;">
              </div>
              <div class="col-md-9 col-lg-10 p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div class="flex-grow-1">
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <span class="badge bg-primary-subtle text-primary text-uppercase px-2 py-1 rounded-1" style="font-size: 0.65rem;">{{ getEventCategory(event) }}</span>
                    <span class="badge bg-light text-dark border text-uppercase px-2 py-1 rounded-1" style="font-size: 0.65rem;">UPCOMING</span>
                  </div>
                  <h5 class="fw-bold text-dark mb-1">{{ event.eventName }}</h5>
                  <p class="text-muted small mb-2 text-truncate" style="max-width: 600px;">
                    {{ event.description || 'Join fellow students and faculty members in this event.' }}
                  </p>
                  <div class="d-flex gap-4">
                    <div class="d-flex align-items-center text-muted small">
                      <i class="bi bi-geo-alt me-1 text-primary"></i>
                      <span>{{ event.venue || 'To Be Announced' }}</span>
                    </div>
                    <div class="d-flex align-items-center text-muted small">
                      <i class="bi bi-calendar-event me-1 text-primary"></i>
                      <span>{{ event.eventDate }} &nbsp;•&nbsp; {{ event.eventTime }}</span>
                    </div>
                  </div>
                </div>

                <div class="d-flex flex-column align-items-md-end gap-2 ms-md-4 mt-3 mt-md-0 border-start ps-md-4">
                  <span class="fw-semibold text-muted d-flex align-items-center gap-1 mb-2">
                    <i class="bi bi-people-fill"></i> {{ event.registeredCount }} / {{ event.capacity ?? '—' }}
                  </span>
                  <div class="d-flex gap-2">
                    <a *ngIf="canRegister"
                       [routerLink]="['/events/register']"
                       [queryParams]="{ eventId: event.eventId }"
                       class="btn btn-primary px-4 fw-semibold shadow-sm">
                      Register
                    </a>
                    <a *ngIf="canCreate && !canRegister"
                       [routerLink]="['/events/register']"
                       [queryParams]="{ eventId: event.eventId }"
                       class="btn btn-outline-primary px-4 fw-semibold">
                      <i class="bi bi-person-plus me-1"></i>Register
                    </a>
                    <button *ngIf="canDelete"
                            (click)="onDelete(event.eventId!)"
                            class="btn btn-outline-danger px-3 d-flex align-items-center gap-2">
                      <i class="bi bi-trash"></i> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div class="card border-0 shadow-sm p-5 text-center my-4"
             *ngIf="!loading && filteredEvents.length === 0">
          <i class="bi bi-folder-x text-muted display-1 mb-3"></i>
          <h4 class="fw-bold text-dark">No Events Found</h4>
          <p class="text-muted mb-0">No events match your current filters. Try changing the search or filter options.</p>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .events-main-header { background: #ffffff; }

    .hover-lift {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .hover-lift:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg) !important;
      border-color: rgba(var(--primary-rgb), 0.2) !important;
    }

    .card-banner {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }
    .hover-lift:hover .card-banner { transform: scale(1.05); }

    .text-xs { font-size: 0.75rem !important; }
  `]
})
export class EventListComponent implements OnInit {

  private readonly eventService = inject(EventService);
  private readonly registrationService = inject(RegistrationService);
  private readonly notification = inject(NotificationService);
  private readonly eventAuth = inject(EventAuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);

  events: EventWithCounts[] = [];
  filteredEvents: EventWithCounts[] = [];
  loading = true;

  searchQuery = '';
  selectedFilter = 'all';
  isGridView = true;

  // ─── Role-based Permission Flags ────────────────────────────────────────────

  /** ADMIN or EVENT_MANAGER can create/delete events */
  get canCreate(): boolean { return this.eventAuth.canCreateEvent(); }
  get canDelete(): boolean { return this.eventAuth.canDeleteEvent(); }
  /** STUDENT or FACULTY can self-register */
  get canRegister(): boolean { return this.eventAuth.canRegisterForEvent(); }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchQuery = params['search'];
      }
    });
    this.loadEvents();
  }

  loadEvents() {
    this.loading = true;
    forkJoin({
      events: this.eventService.getAllEvents(),
      registrations: this.registrationService.getAll().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ events, registrations }) => {
        const eventRegCounts = new Map<number, number>();
        (registrations || []).forEach(r => {
          if (r?.event?.eventId && r.status === 'REGISTERED') {
            eventRegCounts.set(r.event.eventId, (eventRegCounts.get(r.event.eventId) || 0) + 1);
          }
        });

        this.events = (events || []).map(event => ({
          ...event,
          registeredCount: eventRegCounts.get(event.eventId!) || 0
        }));

        this.filterEvents();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[EventList] Error loading events', err);
        this.notification.showError('Could not load events.');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  filterEvents() {
    let result = [...this.events];

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(e =>
        e.eventName?.toLowerCase().includes(q) ||
        e.venue?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q)
      );
    }

    if (this.selectedFilter === 'upcoming') {
      const now = new Date();
      result = result.filter(e => new Date(e.eventDate) >= now);
    } else if (this.selectedFilter === 'past') {
      const now = new Date();
      result = result.filter(e => new Date(e.eventDate) < now);
    }

    this.filteredEvents = result;
    this.cdr.detectChanges();
  }

  getEventCategory(event: Event): string {
    const name = (event.eventName ?? '').toLowerCase();
    if (name.includes('workshop') || name.includes('hackathon') || name.includes('ai') ||
        name.includes('coding') || name.includes('tech') || name.includes('web')) {
      return 'Technology';
    }
    if (name.includes('business') || name.includes('marketing') || name.includes('finance') ||
        name.includes('seminar') || name.includes('management')) {
      return 'Business';
    }
    if (name.includes('career') || name.includes('placement') || name.includes('job') ||
        name.includes('fair')) {
      return 'Career';
    }
    return 'General';
  }

  getEventImage(event: Event): string {
    const id = event.eventId || 1;
    const category = this.getEventCategory(event).toLowerCase();
    return `https://loremflickr.com/800/600/${category}?lock=${id}`;
    //     return `https://picsum.photos/seed/${category}${id}/800/600`;
  }

  onDelete(eventId: number) {
    if (!confirm('Are you sure you want to delete this event? All associated registrations will also be affected.')) {
      return;
    }
    this.eventService.deleteEvent(eventId).subscribe({
      next: () => {
        this.notification.showSuccess('Event deleted successfully.');
        this.loadEvents();
      },
      error: (err) => {
        console.error('[EventList] Error deleting event', err);
        this.notification.showError('Could not delete event.');
      }
    });
  }
}
