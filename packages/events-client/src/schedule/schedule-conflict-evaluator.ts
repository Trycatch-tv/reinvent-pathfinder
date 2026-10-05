import type { SessionCandidate, ScheduleConflict } from '@pathfinder/domain';
import { detectScheduleConflict } from '@pathfinder/domain';
import type { UserScheduleItem } from '../types/user-schedule.js';

export interface EvaluatedScheduleConflict {
  readonly proposedSession: SessionCandidate;
  readonly scheduledItem: UserScheduleItem;
  readonly conflict: ScheduleConflict;
}

/**
 * Converts a UserScheduleItem into a temporary SessionCandidate so that
 * pure domain collision logic (detectScheduleConflict) can evaluate it.
 */
function toComparableSessionCandidate(item: UserScheduleItem): SessionCandidate {
  if (item.session) {
    return item.session;
  }

  return {
    id: item.id,
    code: item.id,
    title: item.title,
    description: item.notes ?? '',
    level: 100,
    topics: ['Personal'],
    format: item.type === 'personal_time' ? 'other' : 'breakout',
    schedule: {
      day: item.day,
      startTime: item.startTime,
      endTime: item.endTime,
    },
    location: item.venue
      ? {
          venue: item.venue,
          room: item.room,
        }
      : undefined,
  };
}

/**
 * Compares a list of proposed sessions (e.g. from a LearningPath or recommendations)
 * against the user's scheduled items (reservations, favorites, personal time) to
 * detect overlaps and timing conflicts.
 */
export function evaluateScheduleConflicts(
  proposedSessions: readonly SessionCandidate[],
  scheduledItems: readonly UserScheduleItem[],
  options: { includeFavorites?: boolean } = {}
): readonly EvaluatedScheduleConflict[] {
  const includeFavorites = options.includeFavorites ?? false;
  const conflicts: EvaluatedScheduleConflict[] = [];

  // Filter items: by default evaluate reservations and personal time (hard commitments)
  // Optionally include favorites
  const activeItems = scheduledItems.filter((item) => {
    if (item.type === 'favorite') {
      return includeFavorites;
    }
    return true;
  });

  for (const proposed of proposedSessions) {
    if (!proposed.schedule) {
      continue;
    }

    for (const scheduled of activeItems) {
      const scheduledCandidate = toComparableSessionCandidate(scheduled);
      const conflict = detectScheduleConflict(proposed, scheduledCandidate);

      if (conflict) {
        conflicts.push({
          proposedSession: proposed,
          scheduledItem: scheduled,
          conflict,
        });
      }
    }
  }

  return conflicts;
}
