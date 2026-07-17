import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-event-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class EventHeaderComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Expose current user session signal
  readonly user = this.authService.currentUser;

  backToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
