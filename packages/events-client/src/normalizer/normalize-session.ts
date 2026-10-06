import type {
  SessionCandidate,
  SessionFormat,
  SessionLevel,
  SessionSchedule,
  SessionLocation,
} from '@pathfinder/domain';
import type { RawAwsSession } from '../types/raw-aws-events.js';

function parseSessionLevel(levelRaw?: string | number): SessionLevel {
  if (typeof levelRaw === 'number') {
    if (levelRaw >= 500) return 500;
    if (levelRaw >= 400) return 400;
    if (levelRaw >= 300) return 300;
    if (levelRaw >= 200) return 200;
    return 100;
  }
  if (typeof levelRaw === 'string') {
    const matched = levelRaw.match(/\b(100|200|300|400|500)\b/);
    if (matched && matched[1]) {
      return parseInt(matched[1], 10) as SessionLevel;
    }
  }
  return 200; // Default intermediate level
}

function parseSessionFormat(typeRaw?: string): SessionFormat {
  if (!typeRaw) return 'other';
  const lower = typeRaw.toLowerCase();

  if (lower.includes('breakout')) return 'breakout';
  if (lower.includes('workshop')) return 'workshop';
  if (lower.includes('chalk')) return 'chalk-talk';
  if (lower.includes('builder')) return 'builders-session';
  if (lower.includes('keynote')) return 'keynote';
  if (lower.includes('lightning')) return 'lightning-talk';

  return 'other';
}

function parseSchedule(raw: RawAwsSession): SessionSchedule | undefined {
  const officialTime = raw.sessionTime;
  const officialStartTime = officialTime?.date && officialTime.time
    ? officialTime.time
    : undefined;
  const officialEndTime = officialStartTime && officialTime?.length
    ? addMinutesToClock(officialStartTime, Number(officialTime.length))
    : undefined;
  const startTime = officialStartTime ?? officialTime?.startTime ?? raw.start_time;
  const endTime = officialEndTime ?? officialTime?.endTime ?? raw.end_time;
  if (!startTime || !endTime) {
    return undefined;
  }

  let day = officialTime?.date ?? raw.day;
  if (!day && startTime.includes('T')) {
    day = startTime.split('T')[0];
  }

  return {
    day: day ?? 'TBD',
    startTime,
    endTime,
  };
}

function addMinutesToClock(time: string, length: number): string | undefined {
  const matched = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!matched || !matched[1] || !matched[2] || !Number.isFinite(length)) {
    return undefined;
  }

  const hours = Number(matched[1]);
  const minutes = Number(matched[2]);
  if (hours > 23 || minutes > 59 || length < 0) {
    return undefined;
  }

  const totalMinutes = (hours * 60 + minutes + length) % (24 * 60);
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
}

function parseLocation(raw: RawAwsSession): SessionLocation | undefined {
  if (!raw.venue) {
    return undefined;
  }

  return {
    venue: raw.venue,
    ...(raw.room ? { room: raw.room } : {}),
  };
}

/**
 * Pure function that normalizes a raw AWS Events session object
 * into the canonical SessionCandidate domain entity.
 */
export function normalizeAwsSession(raw: RawAwsSession): SessionCandidate {
  const id = raw.sessionId ?? raw.session_id;
  if (!id) {
    throw new Error('AWS Events session is missing sessionId.');
  }
  const topics = raw.topics && raw.topics.length > 0
    ? Array.from(raw.topics)
    : raw.track
    ? [raw.track]
    : [];

  const schedule = parseSchedule(raw);
  const location = parseLocation(raw);

  return {
    id,
    code: raw.abbreviation ?? raw.session_code ?? id,
    title: (raw.title ?? 'Untitled Session').trim(),
    description: (raw.description ?? raw.abstract ?? '').trim(),
    level: parseSessionLevel(raw.level),
    format: parseSessionFormat(raw.type ?? raw.session_type),
    topics,
    ...(schedule ? { schedule } : {}),
    ...(location ? { location } : {}),
    ...(typeof raw.capacity_remaining === 'number' ? { capacityRemaining: raw.capacity_remaining } : {}),
  };
}
