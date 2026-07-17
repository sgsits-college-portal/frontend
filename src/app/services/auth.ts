import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Auth {

  private http = inject(HttpClient);
  private employeeUrl = 'https://gateway-service-sc5r.onrender.com/employees';
  private leaveUrl = 'https://gateway-service-sc5r.onrender.com/leaves';

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
    return this.http.get(`${this.leaveUrl}/all?t=${new Date().getTime()}`);
  }

  getEmployeeLeaves(id: number): Observable<any> {
    return this.http.get(`${this.leaveUrl}/employee/${id}?t=${new Date().getTime()}`);
  }

  approveLeave(id: number): Observable<any> {
    return this.http.put(`${this.leaveUrl}/approve/${id}`, {});
  }

  rejectLeave(id: number): Observable<any> {
    return this.http.put(`${this.leaveUrl}/reject/${id}`, {});
  }

}