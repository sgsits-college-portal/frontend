import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface UserSession {
  id: number;
  username: string;
  role: string;
  subRole: string | null;
  fullName: string;
  email: string | null;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  role: string;
  subRole: string | null;
  fullName: string;
  email: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly baseUrl = 'https://gateway-service-sc5r.onrender.com/auth';

  // Create signals to expose login state reactively
  readonly currentUser = signal<UserSession | null>(this.getStoredUser());
  readonly isAuthenticated = signal<boolean>(!!this.getToken());

  /**
   * Performs authentication request
   */
  login(username: string, password: string, role: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, {
      username,
      password,
      role
    }).pipe(
      tap(res => {
        this.saveSession(res.token, {
          id: res.id,
          username: res.username,
          role: res.role,
          subRole: res.subRole,
          fullName: res.fullName,
          email: res.email
        });
      })
    );
  }

  /**
   * Registers a new user (restricted to ADMIN in backend)
   */
  register(userData: {
    username: string;
    password?: string;
    role: string;
    subRole?: string;
    fullName: string;
    email?: string;
  }): Observable<{ message: string }> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.getToken()}`);
    return this.http.post<{ message: string }>(`${this.baseUrl}/register`, userData, { headers });
  }

  /**
   * Validates active session against backend
   */
  validateSession(): Observable<UserSession> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.getToken()}`);
    return this.http.get<UserSession>(`${this.baseUrl}/validate`, { headers }).pipe(
      tap({
        error: () => this.logout() // Clear session on validation failure
      })
    );
  }

  /**
   * Saves credentials and sets signal states
   */
  private saveSession(token: string, user: UserSession): void {
    localStorage.setItem('sgsits_auth_token', token);
    localStorage.setItem('sgsits_auth_user', JSON.stringify(user));
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
  }

  /**
   * Clears state and local storage, redirects to login
   */
  logout(): void {
    localStorage.removeItem('sgsits_auth_token');
    localStorage.removeItem('sgsits_auth_user');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/']);
  }

  /**
   * Get raw token string
   */
  getToken(): string | null {
    return localStorage.getItem('sgsits_auth_token');
  }

  /**
   * Read stored user metadata
   */
  private getStoredUser(): UserSession | null {
    const userJson = localStorage.getItem('sgsits_auth_user');
    if (!userJson) return null;
    try {
      return JSON.parse(userJson) as UserSession;
    } catch {
      return null;
    }
  }
}
