import { describe, it, expect } from 'vitest';
import type {
  Reflection,
  KnowledgeGap,
  SessionCandidate,
} from '@pathfinder/domain';
import { adaptLearningPathFromReflection } from './reflection-adapter.js';

const gaps: readonly KnowledgeGap[] = [
  {
    id: 'gap-bedrock',
    topic: 'Amazon Bedrock AgentCore',
    description: 'orquestación de agentes con bedrock agentcore',
    targetProficiency: 'professional',
    severity: 'critical',
    status: 'open',
    rationale: 'proyecto agentic',
    addressedBySessionIds: [],
  },
  {
    id: 'gap-dynamo',
    topic: 'DynamoDB single-table',
    description: 'patrones de diseño single table dynamodb',
    targetProficiency: 'professional',
    severity: 'important',
    status: 'open',
    rationale: 'persistencia',
    addressedBySessionIds: [],
  },
];

const candidateSessions: readonly SessionCandidate[] = [
  {
    id: 'sess-bedrock',
    code: 'AIM301',
    title: 'Bedrock AgentCore en profundidad',
    description: 'orquestación de agentes con bedrock agentcore',
    level: 300,
    format: 'breakout',
    topics: ['bedrock', 'agentcore'],
    schedule: { day: '2026-12-03', startTime: '09:00', endTime: '10:00' },
  },
  {
    id: 'sess-dynamo',
    code: 'DAT304',
    title: 'DynamoDB single-table patterns',
    description: 'patrones de diseño single table dynamodb',
    level: 300,
    format: 'breakout',
    topics: ['dynamodb'],
    schedule: { day: '2026-12-03', startTime: '11:00', endTime: '12:00' },
  },
];

function reflectionAddressing(gapId: string): Reflection {
  return {
    id: 'refl-1',
    userId: 'local-user',
    sessionId: 'sess-bedrock',
    rating: 5,
    keyTakeaways: 'Entendí AgentCore',
    gapUpdates: [{ gapId, newStatus: 'addressed' }],
    createdAt: new Date().toISOString(),
  };
}

describe('adaptLearningPathFromReflection', () => {
  it('transiciona el gap marcado a addressed', async () => {
    const result = await adaptLearningPathFromReflection({
      reflection: reflectionAddressing('gap-bedrock'),
      gaps,
      candidateSessions,
      userId: 'local-user',
      journeyId: 'journey-1',
    });

    const bedrockGap = result.updatedGaps.find((g) => g.id === 'gap-bedrock');
    const dynamoGap = result.updatedGaps.find((g) => g.id === 'gap-dynamo');
    expect(bedrockGap?.status).toBe('addressed');
    expect(dynamoGap?.status).toBe('open');
  });

  it('registra la sesión que abordó el gap', async () => {
    const result = await adaptLearningPathFromReflection({
      reflection: reflectionAddressing('gap-bedrock'),
      gaps,
      candidateSessions,
      userId: 'local-user',
      journeyId: 'journey-1',
    });

    const bedrockGap = result.updatedGaps.find((g) => g.id === 'gap-bedrock');
    expect(bedrockGap?.addressedBySessionIds).toContain('sess-bedrock');
  });

  it('recalcula el Learning Path y produce recomendaciones', async () => {
    const result = await adaptLearningPathFromReflection({
      reflection: reflectionAddressing('gap-bedrock'),
      gaps,
      candidateSessions,
      userId: 'local-user',
      journeyId: 'journey-1',
    });

    expect(result.learningPath.id).toBe('lp-journey-1');
    expect(result.recommendations.length).toBeGreaterThan(0);
    // El path recalculado solo considera gaps aún abiertos (gap-dynamo).
    const coveredGapIds = result.recommendations.flatMap((r) => r.coveredGapIds);
    expect(coveredGapIds).not.toContain('gap-bedrock');
  });

  it('no modifica los gaps originales (inmutabilidad)', async () => {
    const originalStatuses = gaps.map((g) => g.status);
    await adaptLearningPathFromReflection({
      reflection: reflectionAddressing('gap-bedrock'),
      gaps,
      candidateSessions,
      userId: 'local-user',
      journeyId: 'journey-1',
    });
    expect(gaps.map((g) => g.status)).toEqual(originalStatuses);
  });
});
