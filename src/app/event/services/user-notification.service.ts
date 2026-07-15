import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserNotification } from '../models/user-notification.model';
import { AuthService } from '../../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserNotificationService {

  private readonly authService = inject(AuthService);

  private notificationsSubject = new BehaviorSubject<UserNotification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  constructor() {
    this.loadNotifications();
  }

  /**
   * Load notifications from localStorage, keyed by user ID from AuthService.
   * Falls back to role-based defaults for first-time users.
   */
  private loadNotifications() {
    const user = this.authService.currentUser();
    const role = user?.role ?? 'STUDENT';
    const userId = user?.id ?? 0;
    const storageKey = `sgsits_notifications_user_${userId}`;
    const stored = localStorage.getItem(storageKey);

    let data: UserNotification[] = [];

    if (stored) {
      data = JSON.parse(stored);
    } else {
      // Default welcome notification based on role
      if (role === 'ADMIN') {
        data = [
          {
            id: 'welcome-admin',
            title: 'Welcome, Admin',
            message: 'You have full access to the SGSITS Portal. Manage events, users and reports.',
            time: 'Just now',
            read: false,
            type: 'system'
          }
        ];
      } else if (role === 'HEAD') {
        data = [
          {
            id: 'welcome-head',
            title: 'Welcome',
            message: 'Welcome to the SGSITS Portal. You can view events and registration reports.',
            time: 'Just now',
            read: false,
            type: 'system'
          }
        ];
      } else {
        data = [
          {
            id: 'welcome-user',
            title: 'Welcome to SGSITS Portal',
            message: 'Explore campus events and register to participate.',
            time: 'Just now',
            read: false,
            type: 'system'
          }
        ];
      }
      localStorage.setItem(storageKey, JSON.stringify(data));
    }

    this.notificationsSubject.next(data);
    this.updateUnreadCount();
  }

  addNotification(title: string, message: string, type: UserNotification['type']) {
    const user = this.authService.currentUser();
    const userId = user?.id ?? 0;
    const storageKey = `sgsits_notifications_user_${userId}`;

    const newNotif: UserNotification = {
      id: Date.now().toString(),
      title,
      message,
      time: 'Just now',
      read: false,
      type
    };

    const current = this.notificationsSubject.getValue();
    const updated = [newNotif, ...current];
    localStorage.setItem(storageKey, JSON.stringify(updated));
    this.notificationsSubject.next(updated);
    this.updateUnreadCount();
  }

  getNotifications(): Observable<UserNotification[]> {
    return this.notifications$;
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCount$;
  }

  markAsRead(id: string) {
    const user = this.authService.currentUser();
    const userId = user?.id ?? 0;
    const storageKey = `sgsits_notifications_user_${userId}`;

    const updated = this.notificationsSubject.getValue().map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    localStorage.setItem(storageKey, JSON.stringify(updated));
    this.notificationsSubject.next(updated);
    this.updateUnreadCount();
  }

  markAllAsRead() {
    const user = this.authService.currentUser();
    const userId = user?.id ?? 0;
    const storageKey = `sgsits_notifications_user_${userId}`;

    const updated = this.notificationsSubject.getValue().map(n => ({ ...n, read: true }));
    localStorage.setItem(storageKey, JSON.stringify(updated));
    this.notificationsSubject.next(updated);
    this.updateUnreadCount();
  }

  private updateUnreadCount() {
    const unread = this.notificationsSubject.getValue().filter(n => !n.read).length;
    this.unreadCountSubject.next(unread);
  }
}
