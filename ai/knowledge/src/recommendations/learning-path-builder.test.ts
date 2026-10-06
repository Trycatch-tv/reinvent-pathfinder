import { describe, it, expect } from 'vitest';
import type { SessionRecommendation, SessionCandidate } from '@pathfinder/domain';
import { SAMPLE_USER_SCHEDULE } from '@pathfinder/events-client';
import { buildLearningPath } from './learning-path-builder.js';

// Sesión que solapa con sched-item-1 (reserved, 2026-12-01 10:00–11:00).
const overlappingSession: SessionCandidate = {
  id: 'sess-overlap',
  code: 'OVR-301',
  title: 'Sesión que choca con la agenda',
  description: 'Para probar reconciliación de conflictos',
  level: 300,
  format: 'breakout',
  topics: ['bedrock'],
  schedule: { day: '2026-12-01', startTime: '10:30', endTime: '11:30' },
};

// Sesión sin solape con ningún compromiso duro.
const freeSession: SessionCandidate = {
  id: 'sess-free',
  code: 'FRE-200',
  title: 'Sesión sin conflicto',
  description: 'Horario libre',
  level: 200,
  format: 'chalk-talk',
  topics: ['serverless'],
  schedule: { day: '2026-12-03', startTime: '09:00', endTime: '10:00' },
};

const recommendations: readonly SessionRecommendation[] = [
  {
    sessionId: 'sess-free',
    sessionCode: 'FRE-200',
    title: 'Sesión sin conflicto',
    relevanceScore: 0.9,
    coveredGapIds: ['gap-1', 'gap-2'],
    explanation: 'cubre dos gaps',
  },
  {
    sessionId: 'sess-overlap',
    sessionCode: 'OVR-301',
    title: 'Sesión que choca con la agenda',
    relevanceScore: 0.7,
    coveredGapIds: ['gap-3'],
    explanation: 'cubre un gap',
  },
];

describe('buildLearningPath', () => {
  it('construye items preservando el orden del reranker', () => {
    const path = buildLearningPath({
      recommendations,
      candidateSessions: [freeSession, overlappingSession],
      userId: 'user-1',
      journeyId: 'journey-1',
    });

    expect(path.items).toHaveLength(2);
    expect(path.items[0]?.sessionId).toBe('sess-free');
    expect(path.items[0]?.order).toBe(1);
    expect(path.items[1]?.sessionId).toBe('sess-overlap');
    expect(path.items[1]?.order).toBe(2);
  });

  it('liga cada item a los gaps que cubre (targetGapIds = coveredGapIds)', () => {
    const path = buildLearningPath({
      recommendations,
      candidateSessions: [freeSession, overlappingSession],
      userId: 'user-1',
      journeyId: 'journey-1',
    });

    expect(path.items[0]?.targetGapIds).toEqual(['gap-1', 'gap-2']);
    expect(path.items[1]?.targetGapIds).toEqual(['gap-3']);
    expect(path.items.every((i) => i.status === 'planned')).toBe(true);
  });

  it('deriva id/userId/journeyId y marca updatedAt', () => {
    const path = buildLearningPath({
      recommendations,
      candidateSessions: [freeSession, overlappingSession],
      userId: 'user-1',
      journeyId: 'journey-1',
    });

    expect(path.id).toBe('lp-journey-1');
    expect(path.userId).toBe('user-1');
    expect(path.journeyId).toBe('journey-1');
    expect(typeof path.updatedAt).toBe('string');
  });

  it('reconcilia la agenda y detecta el conflicto de la sesión solapada', () => {
    const path = buildLearningPath({
      recommendations,
      candidateSessions: [freeSession, overlappingSession],
      scheduledItems: SAMPLE_USER_SCHEDULE,
      userId: 'user-1',
      journeyId: 'journey-1',
    });

    expect(path.conflicts.length).toBeGreaterThan(0);
    const ids = path.conflicts.flatMap((c) => [c.sessionAId, c.sessionBId]);
    expect(ids).toContain('sess-overlap');
    // La sesión libre no debe aparecer en conflictos.
    expect(ids).not.toContain('sess-free');
  });

  it('sin agenda provista, no hay conflictos', () => {
    const path = buildLearningPath({
      recommendations,
      candidateSessions: [freeSession, overlappingSession],
      userId: 'user-1',
      journeyId: 'journey-1',
    });

    expect(path.conflicts).toEqual([]);
  });
});
