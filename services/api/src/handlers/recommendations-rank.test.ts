import { describe, it, expect } from 'vitest';
import { RecommendationsRankHandler } from './recommendations-rank.js';
import type { SessionCandidate, KnowledgeGap } from '@pathfinder/domain';

const mockSessions: SessionCandidate[] = [
  {
    id: 's-1',
    code: 'AIM301',
    title: 'Building Multi-Agent Systems with Amazon Bedrock',
    description: 'Learn how to orchestrate autonomous agents with Amazon Bedrock.',
    level: 300,
    format: 'breakout',
    topics: ['AI', 'Bedrock'],
  },
  {
    id: 's-2',
    code: 'DAT201',
    title: 'DynamoDB Modeling',
    description: 'Data modeling strategies in Amazon DynamoDB.',
    level: 200,
    format: 'breakout',
    topics: ['Databases'],
  },
];

const mockGaps: KnowledgeGap[] = [
  {
    id: 'gap-1',
    topic: 'Amazon Bedrock AgentCore',
    description: 'Autonomous workflows and agents.',
    targetProficiency: 'professional',
    severity: 'critical',
    status: 'open',
    rationale: 'Project requires agents',
    addressedBySessionIds: [],
  },
];

describe('RecommendationsRankHandler', () => {
  const handler = new RecommendationsRankHandler();

  it('handles valid ranking requests with 200 and ranked recommendations', async () => {
    const response = await handler.handle({
      body: JSON.stringify({
        knowledgeGaps: mockGaps,
        candidateSessions: mockSessions,
        targetLevels: [300],
      }),
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['Content-Type']).toBe('application/json');

    const body = JSON.parse(response.body);
    expect(body.recommendations).toBeDefined();
    expect(body.recommendations).toHaveLength(1);
    expect(body.recommendations[0].sessionCode).toBe('AIM301');
    expect(body.recommendations[0].explanation).toBeDefined();
    expect(body.filteredCandidatesCount).toBe(1);
    expect(body.totalCandidatesEvaluated).toBe(2);
  });

  it('returns 400 when body is empty', async () => {
    const response = await handler.handle({});
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Bad Request');
  });

  it('returns 400 when knowledgeGaps is missing', async () => {
    const response = await handler.handle({
      body: JSON.stringify({
        candidateSessions: mockSessions,
      }),
    });
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Validation Error');
  });

  it('returns 400 when candidateSessions is empty', async () => {
    const response = await handler.handle({
      body: JSON.stringify({
        knowledgeGaps: mockGaps,
        candidateSessions: [],
      }),
    });
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Validation Error');
  });
});
