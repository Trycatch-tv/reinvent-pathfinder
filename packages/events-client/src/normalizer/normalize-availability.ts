import type { SessionAvailability } from '@pathfinder/domain';
import type { RawAwsSession } from '../types/raw-aws-events.js';

export function normalizeAwsAvailability(raw: RawAwsSession, observedAt: string): SessionAvailability {
  const sessionId = raw.sessionId ?? raw.session_id;
  if (!sessionId) {
    throw new Error('AWS Events session is missing sessionId.');
  }

  const availabilityMap: Record<string, SessionAvailability['status']> = {
    available: 'available',
    limited: 'limited',
    veryLimited: 'limited',
    unavailable: 'unavailable',
    walkUp: 'walk-up',
  };
  const status = availabilityMap[raw.seatAvailability ?? ''] ?? 'unknown';

  return {
    sessionId,
    status,
    ...(typeof raw.isReservable === 'boolean' ? { isReservable: raw.isReservable } : {}),
    lastUpdatedAt: observedAt,
  };
}
