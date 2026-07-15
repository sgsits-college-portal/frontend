import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { LibraryService } from '../../services/library.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html'
})
export class HeaderComponent {
  userService = inject(UserService);
  libraryService = inject(LibraryService);
  private router = inject(Router);

  backToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
