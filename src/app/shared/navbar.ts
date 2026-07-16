import { Component, inject } from '@angular/core';
 import { CommonModule } from '@angular/common';
 import { AuthService } from '../services/auth.service';

 @Component({
   selector: 'app-navbar',
   standalone: true,
   imports: [CommonModule],
   templateUrl: './navbar.html',
   styleUrl: './navbar.css'
 })
 export class Navbar {

   readonly authService = inject(AuthService);

   readonly user = this.authService.currentUser;

   logout(): void {
     this.authService.logout();
   }
 }
