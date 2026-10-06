import { describe, it, expect } from 'vitest';
import {
  transitionGapStatus,
  applyReflectionToGaps,
  detectScheduleConflict,
  advanceJourneyPhase,
  recordReflectionOnJourney,
  type KnowledgeGap,
  type SessionCandidate,
  type AvailabilityStatus,
  type SessionAvailability,
  SAMPLE_SESSION_AVAILABILITIES,
  projectSessionAvailability,
  type Reflection,
  type AttendeeJourney,
  type ProjectContext,
} from './index.js';

describe('Domain Models and Logic', () => {
  describe('Session availability', () => {
    it('exposes every supported provider-independent availability status', () => {
      const statuses = new Set(SAMPLE_SESSION_AVAILABILITIES.map(({ status }) => status));
      const expected: readonly AvailabilityStatus[] = [
        'available',
        'limited',
        'full',
        'walk-up',
        'unavailable',
        'unknown',
      ];

      expect(statuses).toEqual(new Set(expected));
    });

    it('keeps unknown explicit when provider metadata is absent', () => {
      const unknown = SAMPLE_SESSION_AVAILABILITIES.find(({ status }) => status === 'unknown');

      expect(unknown).toEqual({
        sessionId: 'sess-unknown',
        status: 'unknown',
      });
      expect(unknown?.capacityRemaining).toBeUndefined();
      expect(unknown?.isReservable).toBeUndefined();
      expect(unknown?.lastUpdatedAt).toBeUndefined();
    });

    it('associates availability with a session without inferring it from capacity', () => {
      const session: SessionCandidate = {
        id: 'sess-available',
        code: 'ARC101',
        title: 'Availability consumer',
        description: '',
        level: 100,
        format: 'breakout',
        topics: [],
      };
      const availability: SessionAvailability | undefined = SAMPLE_SESSION_AVAILABILITIES.find(
        ({ sessionId }) => sessionId === session.id,
      );

      expect(availability?.status).toBe('available');
      expect(availability?.capacityRemaining).toBe(48);
    });
  });

  describe('Availability projection', () => {
    const sessions: readonly SessionCandidate[] = [
      {
        id: 'session-later',
        code: 'ARC201',
        title: 'Zulu Availability',
        description: '',
        level: 200,
        format: 'workshop',
        topics: ['Architecture', 'AI/ML'],
        schedule: { day: '2026-12-02', startTime: '11:00', endTime: '12:00' },
        location: { venue: 'Venetian' },
      },
      {
        id: 'session-unknown',
        code: 'AIM101',
        title: 'Alpha Unknown',
        description: '',
        level: 100,
        format: 'breakout',
        topics: ['AI/ML'],
        schedule: { day: '2026-12-02', startTime: '10:00', endTime: '11:00' },
        location: { venue: 'Caesars Forum' },
      },
      {
        id: 'session-same-cell',
        code: 'ARC202',
        title: 'Beta Available',
        description: '',
        level: 200,
        format: 'workshop',
        topics: ['Architecture'],
        schedule: { day: '2026-12-02', startTime: '11:00', endTime: '12:00' },
        location: { venue: 'Venetian' },
      },
      {
        id: 'session-without-venue',
        code: 'DAT101',
        title: 'No Venue',
        description: '',
        level: 100,
        format: 'breakout',
        topics: [],
        schedule: { day: '2026-12-02', startTime: '09:00', endTime: '10:00' },
      },
      {
        id: 'session-without-schedule',
        code: 'SEC101',
        title: 'No Schedule',
        description: '',
        level: 100,
        format: 'breakout',
        topics: [],
        location: { venue: 'Venetian' },
      },
    ];

    const availability: readonly SessionAvailability[] = [
      { sessionId: 'session-later', status: 'limited' },
      { sessionId: 'session-same-cell', status: 'available' },
    ];

    it('groups deterministically and uses unknown when availability is absent', () => {
      const result = projectSessionAvailability(sessions, availability);

      expect(result.groups).toHaveLength(2);
      expect(result.groups[0]).toMatchObject({
        day: '2026-12-02',
        startTime: '10:00',
        venue: 'Caesars Forum',
      });
      expect(result.groups[0]?.sessions[0]?.availability.status).toBe('unknown');
      expect(result.groups[1]?.sessions.map(({ session }) => session.title)).toEqual([
        'Beta Available',
        'Zulu Availability',
      ]);
      expect(result.excludedSessionIds).toEqual([
        'session-without-schedule',
        'session-without-venue',
      ]);
    });

    it('applies all supplied filters without mutating its inputs', () => {
      const result = projectSessionAvailability(sessions, availability, {
        day: '2026-12-02',
        startTime: '11:00',
        venue: 'Venetian',
        availability: ['available'],
        formats: ['workshop'],
        levels: [200],
        topics: ['Architecture'],
      });

      expect(result.groups).toHaveLength(1);
      expect(result.groups[0]?.sessions.map(({ session }) => session.id)).toEqual([
        'session-same-cell',
      ]);
      expect(sessions[0]?.title).toBe('Zulu Availability');
      expect(availability[0]?.status).toBe('limited');
    });
  });

  describe('ProjectContext', () => {
    it('creates a typed project context successfully', () => {
      const context: ProjectContext = {
        id: 'ctx-1',
        name: 'Serverless Real-Time Analytics',
        industry: 'FinTech',
        currentStack: ['TypeScript', 'AWS Lambda', 'DynamoDB'],
        seniority: 'intermediate',
        goals: ['Implement Bedrock agent orchestration', 'Reduce cold starts'],
        constraints: ['Strict latency under 200ms'],
        createdAt: '2026-10-04T00:00:00Z',
        updatedAt: '2026-10-04T00:00:00Z',
      };

      expect(context.id).toBe('ctx-1');
      expect(context.seniority).toBe('intermediate');
      expect(context.currentStack).toHaveLength(3);
    });
  });

  describe('KnowledgeGap transitions', () => {
    const sampleGap: KnowledgeGap = {
      id: 'gap-bedrock-agents',
      topic: 'Amazon Bedrock AgentCore Runtime',
      description: 'Need understanding of AgentCore action groups and custom tools',
      targetProficiency: 'professional',
      severity: 'critical',
      status: 'open',
      rationale: 'Core requirement for autonomous recommendation engine',
      addressedBySessionIds: [],
    };

    it('transitions status and records session id when addressed', () => {
      const updated = transitionGapStatus(sampleGap, 'addressed', 'AIM301');

      expect(updated.status).toBe('addressed');
      expect(updated.addressedBySessionIds).toContain('AIM301');
      // Immutability check
      expect(sampleGap.status).toBe('open');
      expect(sampleGap.addressedBySessionIds).toHaveLength(0);
    });

    it('applies reflection updates to corresponding gaps', () => {
      const gap2: KnowledgeGap = {
        id: 'gap-dynamodb-design',
        topic: 'DynamoDB Single Table Design',
        description: 'Advanced data modeling',
        targetProficiency: 'professional',
        severity: 'important',
        status: 'open',
        rationale: 'Scalable state storage',
        addressedBySessionIds: [],
      };

      const reflection: Reflection = {
        id: 'ref-1',
        userId: 'user-42',
        sessionId: 'DAT304',
        rating: 5,
        keyTakeaways: 'Learned pattern for composite partition keys and sparse indexes.',
        gapUpdates: [
          { gapId: 'gap-dynamodb-design', newStatus: 'addressed' },
        ],
        createdAt: '2026-12-02T16:00:00Z',
      };

      const result = applyReflectionToGaps([sampleGap, gap2], reflection);

      expect(result[0]?.status).toBe('open');
      expect(result[1]?.status).toBe('addressed');
      expect(result[1]?.addressedBySessionIds).toContain('DAT304');
    });
  });

  describe('ScheduleConflict detection', () => {
    const baseSession: SessionCandidate = {
      id: 'sess-1',
      code: 'ARC301',
      title: 'Architecting Multi-Agent Workflows',
      description: 'Deep dive into multi-agent patterns',
      level: 300,
      format: 'breakout',
      topics: ['AI/ML', 'Architecture'],
      schedule: {
        day: '2026-12-02',
        startTime: '10:00',
        endTime: '11:00',
      },
      location: { venue: 'Venetian', room: 'Palazzo Ballroom' },
    };

    it('detects overlap between conflicting sessions on the same day', () => {
      const overlappingSession: SessionCandidate = {
        id: 'sess-2',
        code: 'SEC305',
        title: 'Zero Trust in Cloud Native Environments',
        description: 'Security architectures',
        level: 300,
        format: 'breakout',
        topics: ['Security'],
        schedule: {
          day: '2026-12-02',
          startTime: '10:30',
          endTime: '11:30',
        },
        location: { venue: 'Caesars Forum', room: 'Forum 101' },
      };

      const conflict = detectScheduleConflict(baseSession, overlappingSession);
      expect(conflict).not.toBeNull();
      expect(conflict?.overlapMinutes).toBe(30);
      expect(conflict?.sessionAId).toBe('sess-1');
      expect(conflict?.sessionBId).toBe('sess-2');
    });

    it('returns null when sessions do not overlap on the same day', () => {
      const nonOverlapping: SessionCandidate = {
        ...baseSession,
        id: 'sess-3',
        code: 'DAT310',
        schedule: {
          day: '2026-12-02',
          startTime: '11:30',
          endTime: '12:30',
        },
      };

      const conflict = detectScheduleConflict(baseSession, nonOverlapping);
      expect(conflict).toBeNull();
    });

    it('returns null when sessions occur on different days', () => {
      const differentDay: SessionCandidate = {
        ...baseSession,
        id: 'sess-4',
        code: 'OPN201',
        schedule: {
          day: '2026-12-03',
          startTime: '10:00',
          endTime: '11:00',
        },
      };

      const conflict = detectScheduleConflict(baseSession, differentDay);
      expect(conflict).toBeNull();
    });
  });

  describe('AttendeeJourney lifecycle transitions', () => {
    it('advances phases correctly from before -> during -> after', () => {
      const journey: AttendeeJourney = {
        id: 'jrn-100',
        userId: 'user-77',
        phase: 'before',
        projectContextId: 'ctx-1',
        reflectionsCount: 0,
        createdAt: '2026-11-20T10:00:00Z',
        updatedAt: '2026-11-20T10:00:00Z',
      };

      const during = advanceJourneyPhase(journey, 'during');
      expect(during.phase).toBe('during');

      const after = advanceJourneyPhase(during, 'after');
      expect(after.phase).toBe('after');

      expect(() => advanceJourneyPhase(after, 'before')).toThrowError();
    });

    it('records reflection count increments correctly', () => {
      const journey: AttendeeJourney = {
        id: 'jrn-100',
        userId: 'user-77',
        phase: 'during',
        projectContextId: 'ctx-1',
        reflectionsCount: 1,
        createdAt: '2026-11-20T10:00:00Z',
        updatedAt: '2026-11-20T10:00:00Z',
      };

      const updated = recordReflectionOnJourney(journey);
      expect(updated.reflectionsCount).toBe(2);
      expect(updated.phase).toBe('during');
    });
  });
});
