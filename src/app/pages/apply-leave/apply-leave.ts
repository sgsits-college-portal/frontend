import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-apply-leave',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './apply-leave.html',
  styleUrl: './apply-leave.css'
})
export class ApplyLeave {

  leaveType = '';
  startDate = '';
  endDate = '';
  reason = '';

  // UI state managers
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private auth: Auth) {}

  applyLeave() {
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const employee = JSON.parse(localStorage.getItem('sgsits_auth_user') || '{}');

    const leave = {
      leaveType: this.leaveType,
      startDate: this.startDate,
      endDate: this.endDate,
      reason: this.reason,
      status: 'Pending',
      employeeId: employee.id
    };

    this.auth.applyLeave(leave).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Your leave application has been submitted successfully!';

        // Clear forms elegantly
        this.leaveType = '';
        this.startDate = '';
        this.endDate = '';
        this.reason = '';

        console.log(response);
      },
      error: (error) => {
        this.isLoading = false;
        console.error(error);
        this.errorMessage = 'Failed to submit leave application. Please verify details and try again.';
      }
    });
  }
}