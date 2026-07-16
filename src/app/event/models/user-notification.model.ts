export interface UserNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'system' | 'event' | 'registration' | 'alert';
}
