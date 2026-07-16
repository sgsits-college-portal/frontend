import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EventService } from '../../services/event.service';
import { RegistrationService } from '../../services/registration.service';
import { NotificationService } from '../../services/notification.service';
import { EventAuthService } from '../../services/event-auth.service';
import { Event } from '../../models/event.model';
import { PortalUser } from '../../models/user.model';
import { Status } from '../../models/status.enum';
import { EventNavbarComponent } from '../event-bar/event-bar';

import { EventHeaderComponent } from '../header/header';

@Component({
  selector: 'app-register-participant',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, EventHeaderComponent, EventNavbarComponent],
  template: `
    <app-event-header></app-event-header>
    <div class="cyber-workspace container-fluid py-4">

      <!-- Event Navbar -->
      <app-event-navbar></app-event-navbar>


      <!-- Loading State -->
      <div *ngIf="loading" class="cyber-card p-5 text-center my-4">
        <div class="spinner-border text-cyan my-3" role="status" style="width: 3rem; height: 3rem;">
          <span class="visually-hidden">LOADING SYSTEM DATA...</span>
        </div>
        <p class="cyber-glow-text mt-3 mb-0">Loading event details...</p>
      </div>

      <!-- Split Layout Grid -->
      <div class="row g-4" *ngIf="!loading">

        <!-- Left Column: Hologram Event Summary Card -->
        <div class="col-lg-5">
          <div class="cyber-header-badge mb-2">
            <span class="badge bg-purple-glow">Event Details</span>
          </div>

          <!-- Event selected preview -->
          <div class="cyber-card overflow-hidden h-100 position-relative" *ngIf="selectedEvent">
            <div class="neon-glow-line bg-cyber-gradient"></div>

            <!-- Banner Image Area -->
            <div [ngStyle]="getBannerStyle(selectedEvent.eventId)" class="preview-banner p-4 d-flex flex-column justify-content-between position-relative">
              <div class="d-flex justify-content-between align-items-start z-2">
                <div class="cyber-date-badge text-center">
                  <span class="d-block day-text fw-bold">{{ selectedEvent.eventDate | date:'d' }}</span>
                  <span class="d-block month-text text-uppercase fw-semibold">{{ selectedEvent.eventDate | date:'MMM' }}</span>
                </div>
                <span class="cyber-badge-glow text-uppercase" style="font-size: 0.65rem;">
                  Upcoming Event
                </span>
              </div>

              <div class="z-2 mt-4 pt-4">
                <h3 class="cyber-title mb-0 text-truncate text-white">{{ selectedEvent.eventName }}</h3>
              </div>
              <div class="banner-cyber-overlay"></div>
            </div>

            <!-- Body Details -->
            <div class="card-body p-4 bg-cyber-dark d-flex flex-column justify-content-between">
              <div>
                <p class="cyber-desc-text mb-4">
                  {{ selectedEvent.description || 'No description available for this event.' }}
                </p>

                <div class="d-flex flex-column gap-3 mb-4 border-top border-bottom border-cyber-grey py-3">
                  <div class="d-flex align-items-center text-muted small gap-3">
                    <div class="cyber-icon-box text-cyan"><i class="bi bi-clock-fill"></i></div>
                    <div>
                      <span class="d-block text-xs text-cyber-muted">Time</span>
                      <span>{{ selectedEvent.eventTime }}</span>
                    </div>
                  </div>
                  <div class="d-flex align-items-center text-muted small gap-3">
                    <div class="cyber-icon-box text-purple"><i class="bi bi-geo-fill"></i></div>
                    <div>
                      <span class="d-block text-xs text-cyber-muted">Venue</span>
                      <span class="text-truncate">{{ selectedEvent.venue || 'Not Assigned' }}</span>
                    </div>
                  </div>
                  <div class="d-flex align-items-center text-muted small gap-3">
                    <div class="cyber-icon-box text-success"><i class="bi bi-people-fill"></i></div>
                    <div>
                      <span class="d-block text-xs text-cyber-muted">Capacity</span>
                      <span class="text-truncate">{{ selectedEvent.capacity || 'Unlimited' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Fallback -->
          <div class="cyber-card p-5 text-center h-100 d-flex flex-column align-items-center justify-content-center" *ngIf="!selectedEvent">
            <i class="bi bi-hdd-network text-cyber-muted display-2 mb-3"></i>
            <h4 class="fw-bold cyber-title text-cyan mb-2">No Event Selected</h4>
            <p class="text-muted small mb-0">Select an event to view its details.</p>
          </div>
        </div>

        <!-- Right Column: Registration Deck Form -->
        <div class="col-lg-7">
          <div class="cyber-header-badge mb-2">
            <span class="badge bg-cyan-glow">Registration Form</span>
          </div>

          <div class="cyber-card">
            <div class="card-body p-4 p-md-5">
              <div class="d-flex align-items-center mb-4 border-bottom border-cyber-grey pb-3">
                <div class="cyber-icon-box-large bg-cyber-glow text-cyan me-3">
                  <i class="bi bi-person-fill-add fs-4"></i>
                </div>
                <div>
                  <h3 class="fw-extrabold cyber-title mb-0">Register Participant</h3>
                  <p class="text-cyber-muted small mb-0">Register participants for events.</p>
                </div>
              </div>

              <!-- Form -->
              <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
                <!-- Event selector dropdown -->
                <div class="mb-4">
                  <label for="event" class="form-label text-cyber-muted text-xs mb-2">Select Event<span class="text-danger">*</span></label>
                  <select id="event" formControlName="event" class="form-select cyber-input" (change)="onEventChange()" [class.is-invalid]="isFieldInvalid('event')">
                    <option value="" disabled>Select an event</option>
                    <option *ngFor="let ev of events" [ngValue]="ev">{{ ev.eventName }} [{{ ev.eventDate | date:'mediumDate' }}]</option>
                  </select>
                  <div class="invalid-feedback text-danger text-xs mt-1">Please select an event.</div>
                </div>

                <!-- Self Registration Display (For Student/Faculty) -->
                <div class="cyber-context-card p-3 rounded-3 mb-4" *ngIf="!canManage && currentUser">
                  <div class="d-flex align-items-center gap-3">
                    <div class="avatar bg-cyber-avatar text-white fw-bold rounded-circle d-flex align-items-center justify-content-center" style="width: 46px; height: 46px;">
                      {{ getInitials(currentUser.fullName) }}
                    </div>
                    <div>
                      <span class="text-cyber-muted small d-block mb-0.5" style="font-size: 0.7rem;">Registering As</span>
                      <h6 class="fw-bold mb-0" style="font-size: 0.95rem;">{{ currentUser.fullName }}</h6>
                      <span class="text-cyan small" style="font-size: 0.8rem;">{{ currentUser.email }} ({{ currentUser.role }})</span>
                    </div>
                  </div>
                </div>

                <!-- Admin Flow: Register another user by ID -->
                <div class="admin-flow-container mb-4" *ngIf="canManage">
                  <div class="alert alert-info bg-cyber-dark border-cyber-grey text-cyan small mb-3">
                    <i class="bi bi-info-circle me-1"></i> As an administrator, you can register any participant by entering their User ID.
                  </div>

                  <div class="mb-4">
                    <label for="participantId" class="form-label text-cyber-muted text-xs mb-2">Select Participant<span class="text-danger">*</span></label>
                    <select id="participantId" formControlName="participantId" class="form-select cyber-input" [class.is-invalid]="isFieldInvalid('participantId')">
                      <option value="" disabled>Select a user to register...</option>
                      <option *ngFor="let u of users" [value]="u.id">
                        {{ u.fullName }} ({{ u.email }}) - {{ u.role }}
                      </option>
                    </select>
                    <div class="invalid-feedback text-danger">Please select a valid participant.</div>
                  </div>
                </div>

                <!-- Submit buttons -->
                <div class="d-flex justify-content-end gap-3 border-top border-cyber-grey pt-4 mt-4">
                  <a routerLink="/events" class="btn cyber-btn-outline px-4 py-2">CANCEL</a>
                  <button type="submit" [disabled]="submitting" class="btn cyber-btn-primary px-4 py-2">
                    <span *ngIf="submitting" class="spinner-border spinner-border-sm me-1" role="status"></span>
                    Confirm Registration
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cyber-workspace {
      background-color: var(--bg-app) !important;
      color: var(--text-main) !important;
      min-height: 90vh;
    }

    .cyber-title {
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .cyber-back-link {
      color: var(--primary) !important;
      letter-spacing: 0.5px;
      transition: all 0.25s ease;
    }
    .cyber-back-link:hover {
      color: var(--primary-hover) !important;
      transform: translateX(-3px);
    }

    .cyber-card {
      background: var(--card-bg) !important;
      border: 1px solid var(--border-color) !important;
      border-radius: var(--border-radius) !important;
      box-shadow: var(--shadow-sm);
      position: relative;
    }

    .neon-glow-line {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 4px;
    }
    .bg-cyber-gradient {
      background: linear-gradient(
        90deg,
        var(--primary) 0%,
        var(--accent) 100%
      );
    }

    .preview-banner {
      height: 160px;
    }
    .banner-cyber-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0.2) 0%,
        rgba(0, 0, 0, 0.7) 100%
      );
      z-index: 1;
    }

    .cyber-date-badge {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      padding: 0.35rem 0.65rem;
      color: var(--primary);
      z-index: 5;
    }
    .day-text {
      font-size: 1.25rem;
      line-height: 1.1;
    }
    .month-text {
      font-size: 0.6rem;
      letter-spacing: 1px;
    }

    .cyber-badge-glow {
      background: rgba(var(--primary-rgb), 0.2);
      border: 1px solid rgba(var(--primary-rgb), 0.3);
      color: #fff;
      border-radius: var(--border-radius-sm);
      padding: 0.2rem 0.5rem;
      z-index: 5;
    }

    .bg-cyber-dark {
      background-color: var(--card-bg) !important;
    }
    .border-cyber-grey {
      border-color: var(--border-color) !important;
    }

    .cyber-desc-text {
      color: var(--text-muted);
      font-size: 0.875rem;
      line-height: 1.6;
    }
    .text-cyber-muted {
      color: var(--text-muted);
      letter-spacing: 0.5px;
    }

    .cyber-icon-box {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--accent-light);
      border: 1px solid var(--border-color);
      border-radius: 0.375rem;
      font-size: 1rem;
    }
    .text-cyan {
      color: var(--primary) !important;
    }

    .text-purple {
      color: var(--accent) !important;
    }
    .text-success {
      color: #10b981 !important;
    }

    .cyber-header-badge {
      font-size: 2rem;
      font-weight: 600;
      letter-spacing: 1px;
    }
    .bg-purple-glow,
    .bg-cyan-glow {
      background-color: var(--accent-light);
      color: var(--primary);
      border: 1px solid var(--border-color);
    }

    .cyber-icon-box-large {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--accent-light);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
    }

    .cyber-input {
      background-color: var(--card-bg) !important;
      border: 1px solid var(--border-color) !important;
      color: var(--text-main) !important;
      border-radius: var(--border-radius-sm) !important;
      padding: 0.75rem 1rem !important;
    }
    .cyber-input:focus {
      border-color: var(--primary) !important;
      box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.12) !important;
    }

    .cyber-context-card {
      background: var(--accent-light);
      border: 1px solid var(--border-color);
    }
    .bg-cyber-avatar {
      background: linear-gradient(
          135deg,
          var(--primary) 0%,
          var(--accent) 100%
        );
      box-shadow: var(--shadow-sm);
    }

    .cyber-btn-outline {
      color: var(--text-muted) !important;
      border: 1px solid var(--border-color) !important;
      background: transparent !important;
      border-radius: 0.5rem !important;
      letter-spacing: 1px;
      transition: all 0.25s ease;
    }
    .cyber-btn-outline:hover {
      background: var(--accent-light) !important;
      color: var(--primary) !important;
      border-color: var(--primary) !important;
    }

    .cyber-btn-primary {
      background: var(--primary) !important;
      border: 0 !important;
      color: white !important;
      border-radius: var(--border-radius-sm) !important;
      letter-spacing: 1px;
      font-weight: 600;
      transition: all 0.3s ease;
      box-shadow: var(--shadow-sm);
    }
    .cyber-btn-primary:hover {
      box-shadow: var(--shadow);
    }
  `]
})
export class RegisterParticipantComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);
  private readonly registrationService = inject(RegistrationService);
  private readonly notification = inject(NotificationService);
  private readonly eventAuth = inject(EventAuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  events: Event[] = [];
  users: PortalUser[] = [];
  currentUser: PortalUser | null = null;

  loading = true;
  submitting = false;

  selectedEvent: Event | null = null;
  registerForm!: FormGroup;

  get canManage(): boolean {
    return this.eventAuth.canCreateEvent(); // Admin or Event Manager can register others
  }

  ngOnInit(): void {
    this.currentUser = this.eventAuth.getCurrentUser();

    // Defensive redirect if HEAD accesses this (cannot register)
    if (!this.eventAuth.canRegisterForEvent() && !this.canManage) {
      this.router.navigate(['/events']);
      return;
    }

    this.initForm();
    this.loadData();
  }

  private initForm() {
    this.registerForm = this.fb.group({
      event: ['', [Validators.required]]
    });

    if (this.canManage) {
      this.registerForm.addControl('participantId', this.fb.control('', [Validators.required, Validators.min(1)]));
    }
  }

  getBannerStyle(eventId?: number): any {
    const id = eventId || 0;
    let imgUrl = 'https://loremflickr.com/800/600/tech?lock=' + id;
    if (id % 3 === 2) imgUrl = 'https://loremflickr.com/800/600/business?lock=' + id;
    else if (id % 3 === 0) imgUrl = 'https://loremflickr.com/800/600/music?lock=' + id;

    return {
      'background': `url('${imgUrl}') no-repeat center center / cover`,
      'height': '150px',
      'border-bottom': '1px solid rgba(6, 182, 212, 0.2)',
      'position': 'relative'
    };
  }

  private loadData() {
    let requests: any = {
      events: this.eventService.getAllEvents().pipe(catchError(() => of([])))
    };
    if (this.canManage) {
      requests.users = this.eventAuth.getAllUsers().pipe(catchError(() => of([])));
    }

    forkJoin(requests).subscribe({
      next: (res: any) => {
        this.events = res.events || [];
        if (this.canManage) {
          this.users = res.users || [];
        }

        // Check for incoming query params
        this.route.queryParams.subscribe(params => {
          const eventId = params['eventId'];
          if (eventId) {
            const matched = this.events.find(e => e.eventId === +eventId);
            if (matched) {
              this.registerForm.patchValue({ event: matched });
              this.selectedEvent = matched;
            }
          }
        });

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading data for registration', err);
        this.notification.showError('Could not fetch required data.');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onEventChange() {
    const val = this.registerForm.get('event')?.value;
    this.selectedEvent = val || null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  getInitials(name?: string): string {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formValue = this.registerForm.value;
    const eventId = formValue.event.eventId;

    let targetUserId = this.currentUser?.id;
    if (this.canManage) {
      targetUserId = Number(formValue.participantId);
    }

    if (!targetUserId || !eventId) {
      this.notification.showError('Missing required registration data.');
      this.submitting = false;
      return;
    }

    this.registrationService.registerForEvent(eventId, targetUserId).subscribe({
      next: () => {
        this.notification.showSuccess('Registration completed successfully!');
        this.router.navigate(['/events/participants']);
      },
      error: (err) => {
        console.error('Error submitting registration', err);
        this.notification.showError(err.error?.message || 'Error occurred while registering participant.');
        this.submitting = false;
      }
    });
  }
}
