import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EventService } from '../../services/event.service';
import { NotificationService } from '../../services/notification.service';
import { UserNotificationService } from '../../services/user-notification.service';
import { EventAuthService } from '../../services/event-auth.service';

import { EventHeaderComponent } from '../header/header';

/**
 * EventCreateComponent — allows ADMIN or EVENT_MANAGER to create a new event.
 *
 * Changes from old version:
 *  - Removed UserService dependency (user management is now in auth-service)
 *  - Reads current user (createdByUserId) from EventAuthService
 *  - Added access guard in ngOnInit to redirect unauthorized users
 *  - Form fields aligned with backend Event entity
 */
@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, EventHeaderComponent],
  template: `
    <app-event-header></app-event-header>
    <div class="container-fluid py-2">
      <!-- Back link -->
      <div class="mb-4">
        <a routerLink="/events" class="text-decoration-none text-muted small hover-primary d-inline-flex align-items-center gap-1">
          <i class="bi bi-arrow-left"></i> Back to Events Directory
        </a>
      </div>

      <!-- Access Denied -->
      <div *ngIf="!canCreate" class="card border-0 shadow-sm p-5 text-center">
        <i class="bi bi-lock-fill display-3 text-danger mb-3"></i>
        <h4 class="fw-bold text-dark mb-2">Access Restricted</h4>
        <p class="text-muted mb-3">Only ADMIN or EVENT_MANAGER can create events.</p>
        <a routerLink="/events" class="btn btn-primary px-4">Back to Events</a>
      </div>

      <!-- Create Form -->
      <div class="row g-4" *ngIf="canCreate">
        <!-- Left: Form -->
        <div class="col-lg-7">
          <div class="card border-0 shadow-sm">
            <div class="card-body p-4 p-md-5">
              <div class="d-flex align-items-center mb-4 border-bottom pb-3">
                <div class="bg-primary-subtle text-primary rounded-3 p-3 me-3"
                     style="width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">
                  <i class="bi bi-calendar-plus-fill fs-4"></i>
                </div>
                <div>
                  <h3 class="fw-bold text-dark mb-0">Create Event</h3>
                  <p class="text-muted small mb-0">Create and schedule a new campus event.</p>
                </div>
              </div>

              <form [formGroup]="eventForm" (ngSubmit)="onSubmit()">

                <!-- Event Name -->
                <div class="form-floating mb-4">
                  <input
                    type="text"
                    id="eventName"
                    formControlName="eventName"
                    class="form-control"
                    [class.is-invalid]="isFieldInvalid('eventName')"
                    placeholder="Enter event name"
                  />
                  <label for="eventName">Event Title <span class="text-danger">*</span></label>
                  <div class="invalid-feedback" *ngIf="eventForm.get('eventName')?.errors?.['required']">
                    Event title is required.
                  </div>
                </div>

                <!-- Description -->
                <div class="mb-4">
                  <label for="description" class="form-label text-muted small fw-semibold">Event Description</label>
                  <textarea
                    id="description"
                    formControlName="description"
                    class="form-control"
                    rows="3"
                    maxlength="500"
                    placeholder="Provide details about agenda, topics, speakers, etc..."
                  ></textarea>
                  <div class="d-flex justify-content-between mt-1">
                    <span class="text-muted small" style="font-size: 0.7rem;">Add event details, speakers or agenda information.</span>
                    <span class="text-muted small" style="font-size: 0.7rem;">
                      {{ eventForm.get('description')?.value?.length || 0 }} / 500 chars
                    </span>
                  </div>
                </div>

                <!-- Date & Time -->
                <div class="row g-3 mb-4">
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input
                        type="date"
                        id="eventDate"
                        formControlName="eventDate"
                        class="form-control"
                        [class.is-invalid]="isFieldInvalid('eventDate')"
                      />
                      <label for="eventDate">Schedule Date <span class="text-danger">*</span></label>
                      <div class="invalid-feedback" *ngIf="eventForm.get('eventDate')?.errors?.['required']">
                        Event date is required.
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input
                        type="time"
                        id="eventTime"
                        formControlName="eventTime"
                        class="form-control"
                        [class.is-invalid]="isFieldInvalid('eventTime')"
                        step="1"
                      />
                      <label for="eventTime">Start Time <span class="text-danger">*</span></label>
                      <div class="invalid-feedback" *ngIf="eventForm.get('eventTime')?.errors?.['required']">
                        Event time is required.
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Venue & Capacity -->
                <div class="row g-3 mb-4">
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input
                        type="text"
                        id="venue"
                        formControlName="venue"
                        class="form-control"
                        placeholder="E.g., Conference Hall A"
                      />
                      <label for="venue">Event Venue / Location</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input
                        type="number"
                        id="capacity"
                        formControlName="capacity"
                        class="form-control"
                        [class.is-invalid]="isFieldInvalid('capacity')"
                        placeholder="E.g., 100"
                        min="1"
                      />
                      <label for="capacity">Capacity <span class="text-danger">*</span></label>
                      <div class="invalid-feedback" *ngIf="eventForm.get('capacity')?.errors?.['required']">
                        Capacity is required.
                      </div>
                      <div class="invalid-feedback" *ngIf="eventForm.get('capacity')?.errors?.['min']">
                        Capacity must be at least 1.
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Creator Info (display only) -->
                <div class="alert alert-info border-0 small d-flex align-items-center gap-2 mb-4" *ngIf="currentUser">
                  <i class="bi bi-person-check-fill"></i>
                  Creating as: <strong>{{ currentUser.fullName }}</strong>
                  <span class="badge bg-primary ms-1">{{ currentUser.role }}</span>
                </div>

                <!-- Submit -->
                <div class="d-flex justify-content-end gap-2 border-top pt-4 mt-4">
                  <a routerLink="/events" class="btn btn-outline-secondary px-4 py-2 border-light-subtle rounded-3">Cancel</a>
                  <button type="submit" id="btn-publish-event" [disabled]="submitting" class="btn btn-primary px-4 py-2 rounded-3">
                    <span *ngIf="submitting" class="spinner-border spinner-border-sm me-1" role="status"></span>
                    Publish Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Right: Live Preview -->
        <div class="col-lg-5">
          <div class="sticky-lg-top" style="top: 2rem; z-index: 10;">
            <h5 class="fw-bold text-dark mb-3">Live Card Preview</h5>

            <div class="card border-0 shadow-lg overflow-hidden event-preview-card position-relative">
              <div class="accent-line bg-primary"></div>

              <div class="preview-banner p-4 bg-gradient-preview d-flex flex-column justify-content-between position-relative text-white">
                <div class="date-badge-preview bg-white text-dark rounded-3 shadow-sm text-center align-self-start px-3 py-2">
                  <span class="d-block preview-day fw-bold">
                    {{ (eventForm.get('eventDate')?.value | date:'d') || '10' }}
                  </span>
                  <span class="d-block preview-month text-muted text-uppercase fw-semibold">
                    {{ (eventForm.get('eventDate')?.value | date:'MMM') || 'AUG' }}
                  </span>
                </div>

                <div class="mt-4 z-2 position-relative">
                  <span class="badge bg-success-subtle text-success mb-2">Upcoming</span>
                  <h4 class="fw-bold mb-0 text-white text-truncate">
                    {{ eventForm.get('eventName')?.value || 'Untitled Event' }}
                  </h4>
                </div>
                <div class="banner-overlay-preview"></div>
              </div>

              <div class="card-body p-4 d-flex flex-column justify-content-between bg-white">
                <p class="text-muted small preview-description mb-4">
                  {{ eventForm.get('description')?.value || 'Enter event details to preview how the event card will appear.' }}
                </p>
                <div class="d-flex flex-column gap-2">
                  <div class="d-flex align-items-center text-muted small">
                    <i class="bi bi-clock me-2 text-primary fs-5"></i>
                    <span>{{ eventForm.get('eventTime')?.value || '09:00' }}</span>
                  </div>
                  <div class="d-flex align-items-center text-muted small">
                    <i class="bi bi-geo-alt me-2 text-danger fs-5"></i>
                    <span class="text-truncate">{{ eventForm.get('venue')?.value || 'To Be Announced' }}</span>
                  </div>
                  <div class="d-flex align-items-center text-muted small">
                    <i class="bi bi-people me-2 text-success fs-5"></i>
                    <span>Capacity: {{ eventForm.get('capacity')?.value || '—' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .event-preview-card { border-radius: 1rem !important; }
    .accent-line {
      position: absolute;
      top: 0; left: 0;
      width: 4px; height: 100%;
      z-index: 5;
    }
    .preview-banner { height: 160px; }
    .bg-gradient-preview {
      background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%) !important;
    }
    .banner-overlay-preview {
      position: absolute; top: 0; left: 0;
      width: 100%; height: 100%;
      background: linear-gradient(to bottom, rgba(15, 23, 42, 0.05) 0%, rgba(15, 23, 42, 0.75) 100%);
      z-index: 1;
    }
    .date-badge-preview { width: 52px; border-radius: 0.5rem !important; z-index: 5; }
    .preview-day { font-size: 1.15rem; line-height: 1; }
    .preview-month { font-size: 0.6rem; letter-spacing: 0.5px; }
    .preview-description {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 3.6em;
      line-height: 1.5;
    }
  `]
})
export class EventCreateComponent implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly eventService = inject(EventService);
  private readonly notification = inject(NotificationService);
  private readonly userNotification = inject(UserNotificationService);
  private readonly router = inject(Router);
  private readonly eventAuth = inject(EventAuthService);

  eventForm!: FormGroup;
  submitting = false;

  get canCreate(): boolean { return this.eventAuth.canCreateEvent(); }
  get currentUser() { return this.eventAuth.getCurrentUser(); }

  ngOnInit(): void {
    // Redirect immediately if user doesn't have permission (belt-and-suspenders
    // alongside the roleGuard on the route)
    if (!this.canCreate) {
      this.router.navigate(['/events']);
      return;
    }
    this.initForm();
  }

  private initForm() {
    this.eventForm = this.fb.group({
      eventName:   ['', [Validators.required]],
      description: [''],
      eventDate:   ['', [Validators.required]],
      eventTime:   ['', [Validators.required]],
      venue:       [''],
      capacity:    ['', [Validators.required, Validators.min(1)]]
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.eventForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  onSubmit() {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formValue = this.eventForm.value;

    // Ensure time has seconds component (backend expects HH:mm:ss)
    let timeStr: string = formValue.eventTime;
    if (timeStr && timeStr.split(':').length === 2) {
      timeStr = `${timeStr}:00`;
    }

    const payload = {
      ...formValue,
      eventTime: timeStr,
      capacity: Number(formValue.capacity),
      // createdByUserId is set inside EventService.createEvent() from current session
    };

    this.eventService.createEvent(payload).subscribe({
      next: (created) => {
        this.notification.showSuccess('Event created successfully!');
        this.userNotification.addNotification(
          'Event Created',
          `New event "${created.eventName ?? payload.eventName}" was published successfully.`,
          'event'
        );
        this.router.navigate(['/events']);
      },
      error: (err) => {
        console.error('[EventCreate] Error creating event', err);
        this.notification.showError(err.error?.message || 'Failed to create event.');
        this.submitting = false;
      }
    });
  }
}
