import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { LibraryService } from '../../services/library.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html'
})
export class HeaderComponent {
  userService = inject(UserService);
  libraryService = inject(LibraryService);
  readonly authService = inject(AuthService);
  private router = inject(Router);

  // Expose current user session signal
  readonly user = this.authService.currentUser;

  backToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
