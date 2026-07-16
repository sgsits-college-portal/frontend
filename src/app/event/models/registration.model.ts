import { Event } from './event.model';
import { Status } from './status.enum';

/**
 * Registration model — aligned with backend Registration entity.
 *
 * Backend fields:
 *   registrationId, participantUserId, event, registrationDate, status
 *
 * Changed from old model:
 *   - Replaced `user?: User` with `participantUserId?: number`
 *     (backend stores the auth-service user ID, not an embedded user object)
 *   - registrationDate is LocalDateTime on backend → ISO string here
 */
export interface Registration {
  registrationId?: number;
  participantUserId?: number;
  event: Event;
  registrationDate?: string;
  status: Status;
}
