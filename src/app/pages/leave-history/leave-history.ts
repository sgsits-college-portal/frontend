import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router'; // Imported cleanly from router
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-leave-history',
  standalone: true,
  // FIX: Added RouterLink here so your sidebar navigation tags become live links!
  imports: [CommonModule, FormsModule, RouterLink], 
  templateUrl: './leave-history.html',
  styleUrl: './leave-history.css'
})
export class LeaveHistory implements OnInit {

  leaves: any[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(private auth: Auth) {}

  ngOnInit(): void {
    const employee = JSON.parse(localStorage.getItem('sgsits_auth_user') || '{}');

    if (!employee.id) {
      this.isLoading = false;
      this.errorMessage = 'Unable to load leave history because your user session is missing. Please log in again.';
      return;
    }

    this.auth.getEmployeeLeaves(employee.id).subscribe({
      next: (response: any) => {
        this.leaves = Array.isArray(response) ? response : [];
        this.isLoading = false;
        console.log(this.leaves);
      },
      error: (error) => {
        console.error(error);
        this.isLoading = false;
        this.errorMessage = 'Failed to load leave history. Please refresh and try again.';
      }
    });
  }
}
