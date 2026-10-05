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
    if (levelRaw >= 400) return 400;
    if (levelRaw >= 300) return 300;
    if (levelRaw >= 200) return 200;
    return 100;
  }
  if (typeof levelRaw === 'string') {
    const matched = levelRaw.match(/\b(100|200|300|400)\b/);
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
  if (!raw.start_time || !raw.end_time) {
    return undefined;
  }

  let day = raw.day;
  if (!day && raw.start_time.includes('T')) {
    day = raw.start_time.split('T')[0];
  }

  return {
    day: day ?? 'TBD',
    startTime: raw.start_time,
    endTime: raw.end_time,
  };
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
  const topics = raw.topics && raw.topics.length > 0
    ? Array.from(raw.topics)
    : raw.track
    ? [raw.track]
    : [];

  const schedule = parseSchedule(raw);
  const location = parseLocation(raw);

  return {
    id: raw.session_id,
    code: raw.session_code ?? raw.session_id,
    title: (raw.title ?? 'Untitled Session').trim(),
    description: (raw.description ?? raw.abstract ?? '').trim(),
    level: parseSessionLevel(raw.level),
    format: parseSessionFormat(raw.session_type),
    topics,
    ...(schedule ? { schedule } : {}),
    ...(location ? { location } : {}),
    ...(typeof raw.capacity_remaining === 'number' ? { capacityRemaining: raw.capacity_remaining } : {}),
  };
}
