import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ComplaintService } from '../services/complaint.service';
import { AuthService } from '../../services/auth.service';
import { HeaderComponent } from '../components/header/header';

@Component({
  selector: 'app-complaint-new',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent],
  templateUrl: './new.html',
  styleUrl: './new.css'
})
export class New {
  private readonly complaintService = inject(ComplaintService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // User session
  readonly user = this.authService.currentUser;

  // Form Fields
  title = '';
  description = '';
  category = '';
  priority = 'MEDIUM';
  location = '';
  selectedFiles: File[] = [];
  filePreviews: { file: File; url: string }[] = [];

  // Categories list
  readonly categories = [
    'Infrastructure',
    'IT / Network',
    'Hostel',
    'Academics',
    'Library',
    'Canteen / Mess',
    'Transport',
    'Sports',
    'Cleanliness / Hygiene',
    'Security',
    'Electrical',
    'Plumbing',
    'Other'
  ];

  // States
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly dragOver = signal<boolean>(false);

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files) {
      this.addFiles(files);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
    
    const files = event.dataTransfer?.files;
    if (files) {
      this.addFiles(files);
    }
  }

  private addFiles(files: FileList): void {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        // Enforce max 5 files
        if (this.selectedFiles.length >= 5) {
          this.errorMessage.set('You can attach a maximum of 5 images.');
          return;
        }
        this.selectedFiles.push(file);
        const url = URL.createObjectURL(file);
        this.filePreviews.push({ file, url });
      } else {
        this.errorMessage.set('Only image files are allowed.');
      }
    }
  }

  removeFile(index: number): void {
    const preview = this.filePreviews[index];
    URL.revokeObjectURL(preview.url);
    this.selectedFiles.splice(index, 1);
    this.filePreviews.splice(index, 1);
  }

  onSubmit(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    // Frontend validations
    if (!this.title || this.title.trim().length < 5) {
      this.errorMessage.set('Title must be at least 5 characters long.');
      return;
    }
    if (this.title.length > 255) {
      this.errorMessage.set('Title cannot exceed 255 characters.');
      return;
    }
    if (!this.description || this.description.trim().length < 20) {
      this.errorMessage.set('Description must be at least 20 characters long.');
      return;
    }
    if (!this.category) {
      this.errorMessage.set('Please select a category.');
      return;
    }

    const currentUser = this.user();
    if (!currentUser) {
      this.errorMessage.set('Authentication session missing. Please log in.');
      return;
    }

    const payload = {
      userId: currentUser.username,
      title: this.title.trim(),
      description: this.description.trim(),
      category: this.category,
      priority: this.priority.toUpperCase(),
      location: this.location.trim() || undefined
    };

    this.isSubmitting.set(true);

    this.complaintService.createComplaint(payload, this.selectedFiles).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.successMessage.set('Complaint filed successfully! Redirecting...');
        // Clean up object URLs
        this.filePreviews.forEach(p => URL.revokeObjectURL(p.url));
        setTimeout(() => {
          this.router.navigate(['/complaints/my']);
        }, 1500);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        console.error('Error creating complaint:', err);
        if (err.error && err.error.message) {
          this.errorMessage.set(err.error.message);
        } else {
          this.errorMessage.set('Failed to submit complaint. Verify fields and try again.');
        }
      }
    });
  }
}
