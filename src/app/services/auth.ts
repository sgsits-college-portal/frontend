import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Auth {

  private http = inject(HttpClient);

  private employeeUrl = 'http://localhost:8080/employee';
  private leaveUrl = 'http://localhost:8080/leave';

  login(user: any): Observable<any> {
    return this.http.post(`${this.employeeUrl}/login`, user);
  }

  register(user: any): Observable<any> {
    return this.http.post(`${this.employeeUrl}/register`, user);
  }

  applyLeave(leave: any): Observable<any> {
    return this.http.post(`${this.leaveUrl}/apply`, leave);
  }

  getAllLeaves(): Observable<any> {
    return this.http.get(`${this.leaveUrl}/all`);
  }

  getEmployeeLeaves(id: number): Observable<any> {
    return this.http.get(`${this.leaveUrl}/employee/${id}`);
  }

  approveLeave(id: number): Observable<any> {
    return this.http.put(`${this.leaveUrl}/approve/${id}`, {});
  }

  rejectLeave(id: number): Observable<any> {
    return this.http.put(`${this.leaveUrl}/reject/${id}`, {});
  }

}