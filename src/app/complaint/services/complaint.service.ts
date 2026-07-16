import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Complaint } from '../models/complaint.model';

@Injectable({
  providedIn: 'root'
})
export class ComplaintService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://gateway-service-sc5r.onrender.com/complaints';

  /**
   * Submit a new complaint (Student only)
   */
  createComplaint(data: {
    userId: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    location?: string;
  }, files: File[]): Observable<Complaint> {
    const formData = new FormData();
    formData.append('data', JSON.stringify(data));
    
    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append('files', file);
      });
    }
    
    // POST request with FormData (HttpClient handles headers and boundaries automatically)
    return this.http.post<Complaint>(`${this.baseUrl}/`, formData);
  }

  /**
   * Assign a technician to a complaint (Admin only)
   * Note: adminId parameter is actually the technician's username.
   */
  assignTechnician(id: number, technicianId: string, dispatcherId: string): Observable<Complaint> {
    const params = new HttpParams()
      .set('adminId', technicianId)
      .set('dispatcherId', dispatcherId);
    
    return this.http.put<Complaint>(`${this.baseUrl}/${id}/assign`, null, { params });
  }

  /**
   * Submit work verification (Technician / Admin)
   */
  submitVerification(id: number, adminNote: string): Observable<Complaint> {
    const params = new HttpParams().set('adminNote', adminNote);
    return this.http.put<Complaint>(`${this.baseUrl}/${id}/submit-verification`, null, { params });
  }

  /**
   * Final sign-off and resolution of complaint (HOD only)
   */
  resolveComplaint(id: number, hodId: string, hodNote: string): Observable<Complaint> {
    const params = new HttpParams()
      .set('hodId', hodId)
      .set('hodNote', hodNote);
    
    return this.http.put<Complaint>(`${this.baseUrl}/${id}/resolve`, null, { params });
  }

  /**
   * Toggle public visibility of a complaint (Admin only)
   */
  toggleVisibility(id: number, isPublic: boolean): Observable<Complaint> {
    const params = new HttpParams().set('isPublic', String(isPublic));
    return this.http.put<Complaint>(`${this.baseUrl}/${id}/visibility`, null, { params });
  }

  /**
   * Get single complaint by ID
   */
  getComplaintById(id: number): Observable<Complaint> {
    return this.http.get<Complaint>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get all public complaints
   */
  getPublicFeed(): Observable<Complaint[]> {
    return this.http.get<Complaint[]>(`${this.baseUrl}/public`);
  }

  /**
   * Get complaints submitted by a specific user (My Complaints)
   */
  getUserComplaints(userId: string): Observable<Complaint[]> {
    return this.http.get<Complaint[]>(`${this.baseUrl}/user/${userId}`);
  }

  /**
   * Get all complaints (Admin view)
   */
  getAllComplaints(): Observable<Complaint[]> {
    return this.http.get<Complaint[]>(`${this.baseUrl}/all`);
  }

  /**
   * Get complaints assigned to the logged-in technician
   */
  getAssignedComplaints(): Observable<Complaint[]> {
    return this.http.get<Complaint[]>(`${this.baseUrl}/assigned`);
  }

  /**
   * Get complaints pending HOD approval
   */
  getPendingApprovals(): Observable<Complaint[]> {
    return this.http.get<Complaint[]>(`${this.baseUrl}/pending-approval`);
  }
}
