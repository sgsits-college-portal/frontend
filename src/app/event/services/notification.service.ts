import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AlertMessage {
  type: 'success' | 'danger' | 'warning' | 'info';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private alertsSubject = new BehaviorSubject<AlertMessage[]>([]);
  alerts$ = this.alertsSubject.asObservable();

  showSuccess(message: string) {
    this.addAlert('success', message);
  }

  showError(message: string) {
    this.addAlert('danger', message);
  }

  showWarning(message: string) {
    this.addAlert('warning', message);
  }

  showInfo(message: string) {
    this.addAlert('info', message);
  }

  private addAlert(type: AlertMessage['type'], message: string) {
    const currentAlerts = this.alertsSubject.value;
    const newAlert: AlertMessage = { type, message };
    this.alertsSubject.next([...currentAlerts, newAlert]);

    // Automatically remove alert after 5 seconds
    setTimeout(() => {
      this.removeAlert(newAlert);
    }, 5000);
  }

  removeAlert(alert: AlertMessage) {
    const currentAlerts = this.alertsSubject.value;
    this.alertsSubject.next(currentAlerts.filter(a => a !== alert));
  }
}
