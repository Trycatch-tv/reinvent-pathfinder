import type { SessionAvailability } from '../types/session-availability.js';

/**
 * Deterministic domain fixtures for availability consumers and unit tests.
 * They deliberately express the status directly and do not simulate AWS Events payloads.
 */
export const SAMPLE_SESSION_AVAILABILITIES: readonly SessionAvailability[] = [
  {
    sessionId: 'sess-available',
    status: 'available',
    isReservable: true,
    lastUpdatedAt: '2026-12-01T09:00:00Z',
    capacityRemaining: 48,
  },
  {
    sessionId: 'sess-limited',
    status: 'limited',
    isReservable: true,
    lastUpdatedAt: '2026-12-01T09:00:00Z',
    capacityRemaining: 3,
  },
  {
    sessionId: 'sess-full',
    status: 'full',
    isReservable: false,
    lastUpdatedAt: '2026-12-01T09:00:00Z',
    capacityRemaining: 0,
  },
  {
    sessionId: 'sess-walk-up',
    status: 'walk-up',
    isReservable: false,
    lastUpdatedAt: '2026-12-01T09:00:00Z',
  },
  {
    sessionId: 'sess-unavailable',
    status: 'unavailable',
    isReservable: false,
  },
  {
    sessionId: 'sess-unknown',
    status: 'unknown',
  },
];
