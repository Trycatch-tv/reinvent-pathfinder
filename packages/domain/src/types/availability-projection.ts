import type { AvailabilityStatus, SessionAvailability } from './session-availability.js';
import type { SessionCandidate, SessionFormat, SessionLevel } from './session-candidate.js';

/** Optional predicates applied together when projecting session availability. */
export interface AvailabilityProjectionFilters {
  readonly day?: string;
  readonly startTime?: string;
  readonly venue?: string;
  readonly availability?: readonly AvailabilityStatus[];
  readonly formats?: readonly SessionFormat[];
  readonly levels?: readonly SessionLevel[];
  /** A session must include every requested topic. */
  readonly topics?: readonly string[];
}

/** A catalog session enriched with provider-independent availability. */
export interface AvailabilityProjectedSession {
  readonly session: SessionCandidate;
  readonly availability: SessionAvailability;
}

/** Sessions sharing the same heatmap cell. */
export interface AvailabilityProjectionGroup {
  readonly day: string;
  readonly startTime: string;
  readonly venue: string;
  readonly sessions: readonly AvailabilityProjectedSession[];
}

/** Complete, display-neutral result for an availability heatmap or agenda. */
export interface AvailabilityProjection {
  readonly groups: readonly AvailabilityProjectionGroup[];
  readonly excludedSessionIds: readonly string[];
}
