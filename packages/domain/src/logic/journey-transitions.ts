import type { AttendeeJourney, JourneyPhase } from '../types/attendee-journey.js';

const VALID_PHASE_TRANSITIONS: Record<JourneyPhase, readonly JourneyPhase[]> = {
  before: ['during'],
  during: ['after'],
  after: [],
};

/**
 * Validates and advances an AttendeeJourney to the next valid lifecycle phase.
 */
export function advanceJourneyPhase(
  journey: AttendeeJourney,
  nextPhase: JourneyPhase
): AttendeeJourney {
  const allowed = VALID_PHASE_TRANSITIONS[journey.phase];
  if (!allowed.includes(nextPhase)) {
    throw new Error(
      `Invalid phase transition from "${journey.phase}" to "${nextPhase}". Allowed: ${allowed.join(', ') || 'none'}`
    );
  }

  return {
    ...journey,
    phase: nextPhase,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Increments the reflections count on an AttendeeJourney when a reflection is recorded.
 */
export function recordReflectionOnJourney(journey: AttendeeJourney): AttendeeJourney {
  return {
    ...journey,
    reflectionsCount: journey.reflectionsCount + 1,
    updatedAt: new Date().toISOString(),
  };
}
