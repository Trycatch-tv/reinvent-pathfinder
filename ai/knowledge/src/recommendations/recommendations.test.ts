import { describe, it, expect } from 'vitest';
import type { SessionCandidate, KnowledgeGap, ProjectContext } from '@pathfinder/domain';
import { CandidateFilter } from './candidate-filter.js';
import { HeuristicSessionReranker, BedrockSessionReranker } from './session-reranker.js';
import type { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

const mockSessions: SessionCandidate[] = [
  {
    id: 's-1',
    code: 'AIM301',
    title: 'Building Multi-Agent Systems with Amazon Bedrock',
    description: 'Learn how to orchestrate autonomous agents with Amazon Bedrock agent memory.',
    level: 300,
    format: 'breakout',
    topics: ['AI', 'Bedrock', 'Agents'],
    capacityRemaining: 50,
  },
  {
    id: 's-2',
    code: 'DAT201',
    title: 'Introduction to DynamoDB Data Modeling',
    description: 'Basics of tables, partition keys, and sort keys in Amazon DynamoDB.',
    level: 200,
    format: 'breakout',
    topics: ['Databases', 'DynamoDB'],
    capacityRemaining: 10,
  },
  {
    id: 's-3',
    code: 'SEC401',
    title: 'Deep Dive into Zero Trust Security and OAuth PKCE',
    description: 'Advanced patterns for securing tokens and least privilege in AWS.',
    level: 400,
    format: 'workshop',
    topics: ['Security', 'OAuth', 'Zero Trust'],
    capacityRemaining: 0,
  },
  {
    id: 's-4',
    code: 'ENT101',
    title: 'Executive Welcome & Keynote',
    description: 'Welcome to re:Invent and global vision.',
    level: 100,
    format: 'keynote',
    topics: ['Leadership'],
    capacityRemaining: 500,
  },
];

const mockGaps: KnowledgeGap[] = [
  {
    id: 'gap-1',
    topic: 'Amazon Bedrock AgentCore & Autonomous Workflows',
    description: 'Orchestrating autonomous agents with tools and memory.',
    targetProficiency: 'professional',
    severity: 'critical',
    status: 'open',
    rationale: 'Project requires agents',
    addressedBySessionIds: [],
  },
  {
    id: 'gap-2',
    topic: 'Zero Trust & Least-Privilege Identity Architecture',
    description: 'OAuth 2.0 PKCE and ephemeral security tokens.',
    targetProficiency: 'specialty',
    severity: 'critical',
    status: 'open',
    rationale: 'Token security',
    addressedBySessionIds: [],
  },
];

const mockProjectContext: ProjectContext = {
  id: 'ctx-1',
  name: 'Pathfinder AI',
  currentStack: ['Bedrock', 'TypeScript', 'Node.js'],
  seniority: 'advanced',
  goals: ['Build autonomous agents safely'],
  createdAt: '2026-10-05T00:00:00Z',
  updatedAt: '2026-10-05T00:00:00Z',
};

describe('CandidateFilter', () => {
  const filter = new CandidateFilter();

  it('filters by targetLevels', () => {
    const result = filter.filter(mockSessions, { targetLevels: [300, 400] });
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.code)).toEqual(['AIM301', 'SEC401']);
  });

  it('filters by preferredFormats', () => {
    const result = filter.filter(mockSessions, { preferredFormats: ['workshop'] });
    expect(result).toHaveLength(1);
    expect(result[0]!.code).toBe('SEC401');
  });

  it('filters by includedTopics', () => {
    const result = filter.filter(mockSessions, { includedTopics: ['dynamodb'] });
    expect(result).toHaveLength(1);
    expect(result[0]!.code).toBe('DAT201');
  });

  it('excludes specific session codes', () => {
    const result = filter.filter(mockSessions, { excludedSessionCodes: ['AIM301'] });
    expect(result.some((s) => s.code === 'AIM301')).toBe(false);
    expect(result).toHaveLength(3);
  });

  it('returns all sessions if no criteria are supplied', () => {
    const result = filter.filter(mockSessions);
    expect(result).toHaveLength(mockSessions.length);
  });
});

describe('HeuristicSessionReranker', () => {
  const reranker = new HeuristicSessionReranker();

  it('ranks sessions prioritized by knowledge gaps and relevance', async () => {
    const res = await reranker.rank({
      projectContext: mockProjectContext,
      knowledgeGaps: mockGaps,
      candidateSessions: mockSessions,
      targetLevels: [300, 400],
    });

    expect(res.totalCandidatesEvaluated).toBe(4);
    expect(res.filteredCandidatesCount).toBe(2);
    expect(res.recommendations).toHaveLength(2);

    // AIM301 matches Bedrock gap and currentStack, so should rank very high
    const topRec = res.recommendations[0]!;
    expect(topRec.sessionCode).toBe('AIM301');
    expect(topRec.relevanceScore).toBeGreaterThan(0.5);
    expect(topRec.coveredGapIds).toContain('gap-1');
    expect(topRec.explanation).toContain('AIM301');
    expect(topRec.explanation).toContain('Amazon Bedrock');
  });

  it('respects maxRecommendations limit', async () => {
    const res = await reranker.rank({
      knowledgeGaps: mockGaps,
      candidateSessions: mockSessions,
      maxRecommendations: 1,
    });

    expect(res.recommendations).toHaveLength(1);
  });
});

describe('BedrockSessionReranker', () => {
  it('falls back seamlessly to heuristic reranker in offline/local mode', async () => {
    const reranker = new BedrockSessionReranker();
    const res = await reranker.rank({
      knowledgeGaps: mockGaps,
      candidateSessions: mockSessions,
    });

    expect(res.recommendations.length).toBeGreaterThan(0);
    expect(res.modelId).toBeDefined();
  });

  it('invokes Bedrock Converse API to rerank candidates with semantic explanations', async () => {
    const mockBedrockClient = {
      send: async () => ({
        output: {
          message: {
            content: [
              {
                text: JSON.stringify([
                  {
                    sessionId: 's-1',
                    score: 0.98,
                    coveredGapIds: ['gap-1'],
                    explanation: 'Sesión imprescindible para dominar agentes autónomos en Bedrock.',
                    logisticsScore: 0.9,
                  },
                  {
                    sessionId: 's-2',
                    score: 0.85,
                    coveredGapIds: [],
                    explanation: 'Complemento sólido para persistencia DynamoDB.',
                    logisticsScore: 0.8,
                  },
                ]),
              },
            ],
          },
        },
      }),
    };

    const reranker = new BedrockSessionReranker({
      modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      bedrockClient: mockBedrockClient as unknown as BedrockRuntimeClient,
    });

    const res = await reranker.rank({
      knowledgeGaps: mockGaps,
      candidateSessions: mockSessions,
      maxRecommendations: 2,
    });

    expect(res.modelId).toBe('anthropic.claude-3-5-sonnet-20241022-v2:0');
    expect(res.recommendations).toHaveLength(2);
    expect(res.recommendations[0]?.sessionCode).toBe('AIM301');
    expect(res.recommendations[0]?.relevanceScore).toBe(0.98);
    expect(res.recommendations[0]?.explanation).toContain('imprescindible');
  });

  it('gracefully degrades to heuristic reranker when Bedrock throws an exception', async () => {
    const failingClient = {
      send: async () => {
        throw new Error('ServiceUnavailableException: Bedrock is temporarily unavailable');
      },
    };

    const reranker = new BedrockSessionReranker({
      bedrockClient: failingClient as unknown as BedrockRuntimeClient,
    });

    const res = await reranker.rank({
      knowledgeGaps: mockGaps,
      candidateSessions: mockSessions,
    });

    expect(res.recommendations.length).toBeGreaterThan(0);
    expect(res.modelId).toBe('heuristic-reranker-v1');
  });
});
