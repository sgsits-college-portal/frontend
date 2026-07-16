import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RegistrationService } from '../../services/registration.service';
import { NotificationService } from '../../services/notification.service';
import { EventAuthService } from '../../services/event-auth.service';
import { Registration } from '../../models/registration.model';
import { Status } from '../../models/status.enum';
import { PortalUser } from '../../models/user.model';
import { EventNavbarComponent } from '../event-bar/event-bar';

import { EventHeaderComponent } from '../header/header';

/**
 * ParticipantListComponent — displays event registrations.
 *
 * Role-based behaviour:
 *   ADMIN / EVENT_MANAGER: full view of all registrations + delete action
 *   HEAD:                  read-only view of all registrations (no actions)
 *   STUDENT / FACULTY:     view only own registrations (filtered by participantUserId)
 *
 * NOTE: Registration cancellation (status update to CANCELLED) is NOT yet
 * implemented — the backend has no cancel endpoint. Only hard-delete is
 * available, and only for ADMIN / EVENT_MANAGER.
 *
 * NOTE: Participant name/email lookup is not implemented yet. The backend
 * Registration entity stores only participantUserId. Display shows the ID.
 * Name lookup requires either a backend DTO change or cross-service call.
 */
@Component({
  selector: 'app-participant-list',
  standalone: true,
  imports: [CommonModule, FormsModule, EventHeaderComponent, EventNavbarComponent],
  template: `
    <app-event-header></app-event-header>
    <div class="container-fluid py-2">

      <!-- Event Navbar -->
      <app-event-navbar></app-event-navbar>

      <!-- Header -->
      <div class="card border-0 shadow-sm p-4 mb-4">
        <div class="row align-items-center g-3">
          <div class="col-md-6">
            <h2 class="fw-extrabold text-dark mb-1">
              {{ isAdminView ? 'Event Registrations' : 'My Event Registrations' }}
            </h2>
            <p class="text-muted small mb-0">
              {{ isAdminView
                 ? 'Manage event registrations and participant records.'
                 : 'View your registered events and their status.' }}
            </p>
          </div>
          <!-- Export CSV — ADMIN or EVENT_MANAGER only -->
          <div class="col-md-6 text-md-end d-flex gap-2 justify-content-md-end" *ngIf="canManage">
            <button (click)="exportToCSV()" id="btn-export-csv"
                    class="btn btn-outline-primary d-flex align-items-center gap-2 border-light-subtle">
              <i class="bi bi-download"></i> Export CSV
            </button>
          </div>
        </div>

        <!-- HEAD read-only banner -->
        <div class="alert alert-info border-0 small mt-3 mb-0 d-flex align-items-center gap-2" *ngIf="isHeadView">
          <i class="bi bi-info-circle-fill"></i>
          You are viewing registrations in read-only mode. HEAD role has no management actions.
        </div>

        <div class="row mt-3 g-2 align-items-center">
          <!-- Search -->
          <div class="col-lg-6 position-relative">
            <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
            <input
              type="text"
              id="participant-search"
              class="form-control ps-5 rounded-3 py-2 border-light-subtle"
              placeholder="Search by participant ID or event name..."
              [(ngModel)]="searchQuery"
              (input)="filterRegistrations()"
            />
          </div>

          <!-- Status Filter + View Toggle -->
          <div class="col-lg-4 ms-auto d-flex gap-2 align-items-center justify-content-end">
            <select [(ngModel)]="selectedStatusFilter"
                    (change)="filterRegistrations()"
                    id="status-filter"
                    class="form-select border-light-subtle py-2 flex-grow-1"
                    style="max-width: 200px;">
              <option value="all">Status: All</option>
              <option [value]="Status.REGISTERED">Confirmed</option>
              <option [value]="Status.CANCELLED">Cancelled</option>
            </select>

            <div class="btn-group border border-light-subtle rounded-3 p-1 bg-light">
              <button type="button" class="btn btn-sm rounded-2 py-1 px-2 border-0"
                      [class.btn-primary]="isTableView"
                      [class.text-muted]="!isTableView"
                      (click)="isTableView = true" title="Table View">
                <i class="bi bi-table"></i>
              </button>
              <button type="button" class="btn btn-sm rounded-2 py-1 px-2 border-0"
                      [class.btn-primary]="!isTableView"
                      [class.text-muted]="isTableView"
                      (click)="isTableView = false" title="Card View">
                <i class="bi bi-grid-fill"></i>
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
        <p class="text-muted mt-2 mb-0">Loading registrations...</p>
      </div>

      <!-- Content -->
      <div *ngIf="!loading">

        <!-- Empty State -->
        <div *ngIf="filteredRegistrations.length === 0" class="card border-0 shadow-sm p-5 text-center my-4">
          <i class="bi bi-ticket-perforated display-3 text-muted mb-3"></i>
          <h4 class="fw-bold text-dark mb-1">No registrations found</h4>
          <p class="text-muted small mb-3">No registrations match your current filters.</p>
          <button (click)="resetFilters()" class="btn btn-outline-primary btn-sm px-4 rounded-pill">Reset Filters</button>
        </div>

        <!-- Table View -->
        <div *ngIf="filteredRegistrations.length > 0 && isTableView" class="card border-0 shadow-sm overflow-hidden mb-4">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0 rounded-table border border-light-subtle">
              <thead class="bg-light text-muted text-uppercase small" style="font-size: 0.75rem;">
                <tr>
                  <th scope="col" class="ps-4 py-3">Booking ID</th>
                  <th scope="col" class="py-3">Participant User ID</th>
                  <th scope="col" class="py-3">Event Details</th>
                  <th scope="col" class="py-3">Date Registered</th>
                  <th scope="col" class="py-3">Status</th>
                  <!-- Action column only shown when user has management rights -->
                  <th scope="col" class="pe-4 py-3 text-end" *ngIf="canManage">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let reg of filteredRegistrations">
                  <!-- Registration ID -->
                  <td class="ps-4 fw-bold text-muted">#{{ reg.registrationId }}</td>

                  <!-- Participant User ID -->
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="avatar bg-primary-subtle text-primary fw-bold me-3 rounded-circle d-flex align-items-center justify-content-center"
                           style="width: 40px; height: 40px; font-size: 0.9rem;">
                        {{ getParticipantInitial(reg.participantUserId) }}
                      </div>
                      <div>
                        <h6 class="fw-bold mb-0 text-body" style="font-size: 0.9rem;">
                          {{ getParticipantName(reg) }}
                        </h6>
                        <span class="text-muted small d-block" style="font-size: 0.75rem;">
                          {{ getParticipantEmail(reg) }}
                        </span>
                      </div>
                    </div>
                  </td>

                  <!-- Event Details -->
                  <td>
                    <span class="fw-bold text-body d-block" style="font-size: 0.9rem;">{{ reg.event.eventName }}</span>
                    <span class="text-muted small d-flex align-items-center gap-1">
                      <i class="bi bi-calendar-event text-primary"></i> {{ reg.event.eventDate }}
                    </span>
                  </td>

                  <!-- Date Registered -->
                  <td class="text-muted small">
                    {{ reg.registrationDate ? (reg.registrationDate | date:'medium') : '—' }}
                  </td>

                  <!-- Status -->
                  <td>
                    <span class="status-badge"
                          [ngClass]="reg.status === Status.REGISTERED ? 'status-badge-success' : 'status-badge-danger'">
                      <span class="status-dot"></span>
                      {{ reg.status === Status.REGISTERED ? 'Confirmed' : 'Cancelled' }}
                    </span>
                  </td>

                  <!-- Actions — only for ADMIN / EVENT_MANAGER -->
                  <td class="pe-4 text-end" *ngIf="canManage">
                    <button
                      (click)="triggerDeleteModal(reg.registrationId!)"
                      [id]="'btn-delete-reg-' + reg.registrationId"
                      class="btn btn-outline-danger btn-sm rounded-3 py-1 px-3 d-inline-flex align-items-center gap-1"
                      title="Delete Registration"
                    >
                      <i class="bi bi-trash"></i> Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Card View -->
        <div *ngIf="filteredRegistrations.length > 0 && !isTableView" class="row g-4 mb-4">
          <div class="col-md-6 col-xl-4" *ngFor="let reg of filteredRegistrations">
            <div class="card border-0 shadow-sm hover-lift h-100 position-relative p-3">
              <div class="accent-line" [ngClass]="reg.status === Status.REGISTERED ? 'bg-success' : 'bg-danger'"></div>
              <div class="card-body p-1 d-flex flex-column justify-content-between h-100">
                <div>
                  <div class="d-flex justify-content-between align-items-start mb-3">
                    <span class="fw-bold text-muted" style="font-size: 0.8rem;">#{{ reg.registrationId }}</span>
                    <span class="status-badge" [ngClass]="reg.status === Status.REGISTERED ? 'status-badge-success' : 'status-badge-danger'">
                      <span class="status-dot"></span>
                      {{ reg.status === Status.REGISTERED ? 'Confirmed' : 'Cancelled' }}
                    </span>
                  </div>

                  <h5 class="fw-bold text-dark mb-1 text-truncate">{{ reg.event.eventName }}</h5>
                  <span class="text-muted small d-block mb-3">
                    <i class="bi bi-calendar-event me-1"></i> {{ reg.event.eventDate }}
                  </span>

                  <div class="d-flex align-items-center border-top pt-3 mb-3">
                    <div class="avatar bg-primary-subtle text-primary fw-bold me-2 rounded-circle d-flex align-items-center justify-content-center"
                         style="width: 36px; height: 36px; font-size: 0.8rem;">
                      {{ getParticipantInitial(reg.participantUserId) }}
                    </div>
                    <div>
                      <h6 class="fw-semibold mb-0 text-body" style="font-size: 0.85rem;">
                        {{ getParticipantName(reg) }}
                      </h6>
                      <span class="text-muted" style="font-size: 0.72rem;">{{ getParticipantEmail(reg) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Delete action — ADMIN / EVENT_MANAGER only -->
                <div class="d-flex gap-2 justify-content-end border-top pt-3" *ngIf="canManage">
                  <button
                    (click)="triggerDeleteModal(reg.registrationId!)"
                    class="btn btn-outline-danger btn-sm rounded-3 py-1 px-3 d-inline-flex align-items-center gap-1"
                  >
                    <i class="bi bi-trash"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div *ngIf="showDeleteModal" class="custom-modal-backdrop">
        <div class="custom-modal-content p-4">
          <div class="text-center">
            <div class="bg-danger-subtle text-danger rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                 style="width: 54px; height: 54px;">
              <i class="bi bi-trash-fill fs-3"></i>
            </div>
            <h4 class="fw-bold text-dark mb-2">Delete Registration?</h4>
            <p class="text-muted small mb-4">
              Are you sure you want to permanently delete registration
              <strong>#{{ targetDeleteId }}</strong>?
              This action cannot be undone.
            </p>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-light border flex-grow-1 py-2 rounded-3" (click)="showDeleteModal = false">Cancel</button>
            <button class="btn btn-danger flex-grow-1 py-2 rounded-3" (click)="confirmDeleteRegistration()">
              Delete Record
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .rounded-table {
      border-collapse: separate !important;
      border-spacing: 0;
      overflow: hidden;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .status-badge-success {
      background: rgba(34, 197, 94, 0.1);
      color: #16a34a;
    }
    .status-badge-danger {
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
    }
    .status-dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .accent-line {
      position: absolute;
      left: 0; top: 0;
      width: 4px; height: 100%;
      border-radius: 4px 0 0 4px;
    }

    .hover-lift {
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }
    .hover-lift:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.09) !important;
    }

    .custom-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    .custom-modal-content {
      background: white;
      border-radius: 1rem;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    }
  `]
})
export class ParticipantListComponent implements OnInit {

  private readonly registrationService = inject(RegistrationService);
  private readonly notification = inject(NotificationService);
  private readonly eventAuth = inject(EventAuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  registrations: Registration[] = [];
  filteredRegistrations: Registration[] = [];
  loading = true;
  Status = Status;

  isTableView = true;
  searchQuery = '';
  selectedStatusFilter = 'all';

  showDeleteModal = false;
  targetDeleteId: number | null = null;
  usersMap = new Map<number, PortalUser>();

  // ─── Role Flags ──────────────────────────────────────────────────────────────

  /** ADMIN or EVENT_MANAGER: full management rights */
  get canManage(): boolean { return this.eventAuth.canDeleteEvent(); }
  /** HEAD, ADMIN, EVENT_MANAGER: can view all registrations */
  get isAdminView(): boolean { return this.eventAuth.canViewAllRegistrations(); }
  /** HEAD only: read-only all-registrations view */
  get isHeadView(): boolean {
    return this.eventAuth.getCurrentRole() === 'HEAD';
  }

  private get currentUserId(): number { return this.eventAuth.getCurrentUserId(); }

  ngOnInit(): void {
    this.loadRegistrations();
  }

  loadRegistrations() {
    this.loading = true;
    forkJoin({
      registrations: this.registrationService.getAll().pipe(catchError(() => of([]))),
      users: this.eventAuth.getAllUsers()
    }).subscribe({
      next: ({ registrations, users }) => {
        (users || []).forEach(u => this.usersMap.set(u.id, u));

        const sorted = (registrations || []).sort((a, b) =>
          (b.registrationId || 0) - (a.registrationId || 0)
        );

        // ADMIN, EVENT_MANAGER, HEAD see all; STUDENT/FACULTY see only own
        if (this.isAdminView) {
          this.registrations = sorted;
        } else {
          this.registrations = sorted.filter(r => r.participantUserId === this.currentUserId);
        }

        this.filterRegistrations();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[ParticipantList] Error loading data', err);
        this.notification.showError('Could not load data.');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  filterRegistrations() {
    let result = [...this.registrations];
    const query = this.searchQuery.toLowerCase().trim();

    if (query) {
      result = result.filter(r =>
        String(r.participantUserId ?? '').includes(query) ||
        r.event.eventName.toLowerCase().includes(query) ||
        String(r.registrationId ?? '').includes(query)
      );
    }

    if (this.selectedStatusFilter !== 'all') {
      result = result.filter(r => r.status === this.selectedStatusFilter);
    }

    this.filteredRegistrations = result;
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedStatusFilter = 'all';
    this.filterRegistrations();
  }

  /**
   * Returns a short display initial for a participant.
   */
  getParticipantInitial(userId?: number): string {
    if (!userId) return '?';
    if (this.usersMap.has(userId)) {
      const name = this.usersMap.get(userId)!.fullName;
      const parts = name.split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    return `U${userId}`.slice(0, 3);
  }

  // ─── Delete Modal ────────────────────────────────────────────────────────────

  triggerDeleteModal(id: number) {
    this.targetDeleteId = id;
    this.showDeleteModal = true;
  }

  confirmDeleteRegistration() {
    if (!this.targetDeleteId) return;
    this.showDeleteModal = false;

    this.registrationService.delete(this.targetDeleteId).subscribe({
      next: () => {
        this.notification.showSuccess('Registration deleted successfully.');
        this.loadRegistrations();
      },
      error: (err) => {
        console.error('[ParticipantList] Error deleting registration', err);
        this.notification.showError('Failed to delete registration.');
      }
    });
  }

  // ─── CSV Export ───────────────────────────────────────────────────────────────

  exportToCSV() {
    const headers = ['Registration ID', 'Participant User ID', 'Event Name', 'Event Date', 'Registration Date', 'Status'];
    const rows = [headers.join(',')];

    this.filteredRegistrations.forEach(r => {
      const row = [
        r.registrationId ?? '',
        r.participantUserId ?? '',
        `"${r.event.eventName}"`,
        r.event.eventDate ?? '',
        r.registrationDate ? new Date(r.registrationDate).toLocaleDateString() : '',
        r.status
      ];
      rows.push(row.join(','));
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.notification.showSuccess('Registrations exported to CSV successfully!');
  }

  getParticipantName(reg: Registration): string {
    if (reg.participantUserId && this.usersMap.has(reg.participantUserId)) {
      return this.usersMap.get(reg.participantUserId)!.fullName;
    }
    return `User #${reg.participantUserId || 'N/A'}`;
  }

  getParticipantEmail(reg: Registration): string {
    if (reg.participantUserId && this.usersMap.has(reg.participantUserId)) {
      const email = this.usersMap.get(reg.participantUserId)!.email;
      return email || `Participant ID: ${reg.participantUserId}`;
    }
    return `Participant ID: ${reg.participantUserId || 'N/A'}`;
  }
}
