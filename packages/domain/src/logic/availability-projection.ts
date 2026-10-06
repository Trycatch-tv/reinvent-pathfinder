import type {
  AvailabilityProjection,
  AvailabilityProjectionFilters,
  AvailabilityProjectionGroup,
  AvailabilityProjectedSession,
} from '../types/availability-projection.js';
import type { SessionAvailability } from '../types/session-availability.js';
import type { SessionCandidate } from '../types/session-candidate.js';

function compareStrings(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function includesIfProvided<T>(values: readonly T[] | undefined, value: T): boolean {
  return values === undefined || values.includes(value);
}

function matchesFilters(
  projected: AvailabilityProjectedSession,
  filters: AvailabilityProjectionFilters,
): boolean {
  const { session, availability } = projected;

  return (
    (filters.day === undefined || session.schedule?.day === filters.day) &&
    (filters.startTime === undefined || session.schedule?.startTime === filters.startTime) &&
    (filters.venue === undefined || session.location?.venue === filters.venue) &&
    includesIfProvided(filters.availability, availability.status) &&
    includesIfProvided(filters.formats, session.format) &&
    includesIfProvided(filters.levels, session.level) &&
    (filters.topics === undefined || filters.topics.every((topic) => session.topics.includes(topic)))
  );
}

/**
 * Creates a deterministic, display-neutral projection from catalog sessions and their availability.
 * Sessions lacking a schedule or venue cannot be placed on a heatmap and are reported separately.
 */
export function projectSessionAvailability(
  sessions: readonly SessionCandidate[],
  availabilityRecords: readonly SessionAvailability[],
  filters: AvailabilityProjectionFilters = {},
): AvailabilityProjection {
  const availabilityBySessionId = new Map(
    availabilityRecords.map((availability) => [availability.sessionId, availability]),
  );
  const groups = new Map<string, AvailabilityProjectionGroup>();
  const excludedSessionIds = new Set<string>();

  for (const session of sessions) {
    if (session.schedule === undefined || session.location?.venue === undefined) {
      excludedSessionIds.add(session.id);
      continue;
    }

    const projected: AvailabilityProjectedSession = {
      session,
      availability: availabilityBySessionId.get(session.id) ?? {
        sessionId: session.id,
        status: 'unknown',
      },
    };

    if (!matchesFilters(projected, filters)) {
      continue;
    }

    const { day, startTime } = session.schedule;
    const { venue } = session.location;
    const key = `${day}\u0000${startTime}\u0000${venue}`;
    const group = groups.get(key);

    if (group === undefined) {
      groups.set(key, { day, startTime, venue, sessions: [projected] });
      continue;
    }

    groups.set(key, { ...group, sessions: [...group.sessions, projected] });
  }

  const sortedGroups = [...groups.values()]
    .map((group) => ({
      ...group,
      sessions: [...group.sessions].sort((left, right) =>
        compareStrings(left.session.title, right.session.title),
      ),
    }))
    .sort(
      (left, right) =>
        compareStrings(left.day, right.day) ||
        compareStrings(left.startTime, right.startTime) ||
        compareStrings(left.venue, right.venue),
    );

  return {
    groups: sortedGroups,
    excludedSessionIds: [...excludedSessionIds].sort(compareStrings),
  };
}
