import type { SessionCandidate } from '../types/session-candidate.js';
import type { ScheduleConflict } from '../types/schedule-conflict.js';

function parseTimeToMinutes(timeStr: string): number {
  // Supports "HH:mm" or ISO date strings like "2026-12-01T14:30:00Z"
  if (timeStr.includes('T')) {
    const date = new Date(timeStr);
    return date.getUTCHours() * 60 + date.getUTCMinutes();
  }
  const parts = timeStr.split(':').map((p) => parseInt(p, 10));
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  return hours * 60 + minutes;
}

/**
 * Detects if two session candidates have overlapping scheduled times on the same day.
 * Returns ScheduleConflict if an overlap exists, or null otherwise.
 */
export function detectScheduleConflict(
  sessionA: SessionCandidate,
  sessionB: SessionCandidate
): ScheduleConflict | null {
  if (sessionA.id === sessionB.id) {
    return null;
  }

  if (!sessionA.schedule || !sessionB.schedule) {
    return null;
  }

  if (sessionA.schedule.day !== sessionB.schedule.day) {
    return null;
  }

  const startA = parseTimeToMinutes(sessionA.schedule.startTime);
  const endA = parseTimeToMinutes(sessionA.schedule.endTime);

  const startB = parseTimeToMinutes(sessionB.schedule.startTime);
  const endB = parseTimeToMinutes(sessionB.schedule.endTime);

  // Overlap condition: max(startA, startB) < min(endA, endB)
  const overlapStart = Math.max(startA, startB);
  const overlapEnd = Math.min(endA, endB);

  if (overlapStart < overlapEnd) {
    const overlapMinutes = overlapEnd - overlapStart;
    return {
      sessionAId: sessionA.id,
      sessionBId: sessionB.id,
      overlapMinutes,
      reason: `Sessions "${sessionA.code}" and "${sessionB.code}" overlap by ${overlapMinutes} minutes on ${sessionA.schedule.day}.`,
    };
  }

  return null;
}
