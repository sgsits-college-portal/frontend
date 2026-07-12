import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

interface ActionItem {
  id: number;
  title: string;
  description: string;
  icon: string;
  route?: string;
  badge?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  readonly authService = inject(AuthService);

  // Get active session user
  readonly user = this.authService.currentUser;

  logout(): void {
    this.authService.logout();
  }
}
