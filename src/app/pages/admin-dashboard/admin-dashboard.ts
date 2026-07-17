import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; // Added RouterLink import
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  // FIX: Added RouterLink here so your sidebar layout hyperlinks become fully active!
  imports: [CommonModule, RouterLink], 
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit {

  leaves: any[] = [];

  constructor(private auth: Auth) {}

  ngOnInit(): void {
    this.loadLeaves();
  }

  loadLeaves() {
    this.auth.getAllLeaves().subscribe({
      next: (response: any) => {
        this.leaves = response;
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

  approve(id: number) {
    this.auth.approveLeave(id).subscribe({
      next: () => {
        // Updated interface triggers list refreshes smoothly
        this.loadLeaves();
      },
      error: (err) => console.error(err)
    });
  }

  reject(id: number) {
    this.auth.rejectLeave(id).subscribe({
      next: () => {
        // Updated interface triggers list refreshes smoothly
        this.loadLeaves();
      },
      error: (err) => console.error(err)
    });
  }
}