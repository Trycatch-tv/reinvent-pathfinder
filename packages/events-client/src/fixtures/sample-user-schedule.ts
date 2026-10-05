import type { UserScheduleItem } from '../types/user-schedule.js';
import { normalizeAwsSession } from '../normalizer/normalize-session.js';
import { SAMPLE_RAW_SESSIONS } from './sample-sessions.js';

const sampleSessionMap = new Map(
  SAMPLE_RAW_SESSIONS.map((raw) => [raw.session_id, normalizeAwsSession(raw)])
);

export const SAMPLE_USER_SCHEDULE: readonly UserScheduleItem[] = [
  {
    id: 'sched-item-1',
    type: 'reserved',
    session: sampleSessionMap.get('sess-aim-301'),
    title: 'Building Autonomous Multi-Agent Systems with Amazon Bedrock AgentCore',
    day: '2026-12-01',
    startTime: '10:00',
    endTime: '11:00',
    venue: 'The Venetian',
    room: 'Palazzo Ballroom E',
  },
  {
    id: 'sched-item-2',
    type: 'reserved',
    session: sampleSessionMap.get('sess-dat-304'),
    title: 'Advanced DynamoDB Design Patterns: Single-Table Architecture in Action',
    day: '2026-12-01',
    startTime: '11:30',
    endTime: '12:30',
    venue: 'The Venetian',
    room: 'Titian 2201',
  },
  {
    id: 'sched-item-3',
    type: 'personal_time',
    title: 'Lunch & Peer Networking at Venetian Hall',
    day: '2026-12-01',
    startTime: '12:30',
    endTime: '14:00',
    venue: 'The Venetian',
    room: 'Dining Hall A',
  },
  {
    id: 'sched-item-4',
    type: 'favorite',
    session: sampleSessionMap.get('sess-sec-305'),
    title: 'Zero Trust Architecture: Identity and Least Privilege in Cloud-Native Apps',
    day: '2026-12-02',
    startTime: '14:00',
    endTime: '15:00',
    venue: 'Caesars Forum',
    room: 'Forum 110',
  },
];
