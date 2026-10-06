/**
 * Provider-independent availability state for an event session.
 *
 * `unknown` is intentional: consumers must use it when a provider does not
 * supply a reliable availability signal rather than deriving one from capacity.
 */
export type AvailabilityStatus =
  | 'available'
  | 'limited'
  | 'full'
  | 'walk-up'
  | 'unavailable'
  | 'unknown';

/**
 * Availability information associated with a session by its canonical id.
 * Optional provider signals are preserved as metadata and never imply a status.
 */
export interface SessionAvailability {
  readonly sessionId: string;
  readonly status: AvailabilityStatus;
  readonly isReservable?: boolean;
  readonly lastUpdatedAt?: string;
  readonly capacityRemaining?: number;
}
