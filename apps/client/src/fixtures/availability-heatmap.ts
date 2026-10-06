import type { SessionAvailability } from '@pathfinder/domain'

/** Local-only availability signals aligned with SAMPLE_RAW_SESSIONS. */
export const SAMPLE_HEATMAP_AVAILABILITY: readonly SessionAvailability[] = [
  {
    sessionId: 'sess-aim-301',
    status: 'available',
    isReservable: true,
    capacityRemaining: 45,
    lastUpdatedAt: '2026-12-01T09:00:00Z',
  },
  {
    sessionId: 'sess-dat-304',
    status: 'limited',
    isReservable: true,
    capacityRemaining: 12,
    lastUpdatedAt: '2026-12-01T09:05:00Z',
  },
  {
    sessionId: 'sess-sec-305',
    status: 'full',
    isReservable: false,
    capacityRemaining: 0,
    lastUpdatedAt: '2026-12-02T13:55:00Z',
  },
]
