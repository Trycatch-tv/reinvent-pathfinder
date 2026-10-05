import { describe, it, expect } from 'vitest';
import { KnowledgeAgent, JourneyRecommendationAgent } from './index.js';
import type { SessionCandidate, KnowledgeGap } from '@pathfinder/domain';
import type { UserScheduleItem } from '@pathfinder/events-client';

const mockSessions: SessionCandidate[] = [
  {
    id: 's-1',
    code: 'AIM301',
    title: 'Building Multi-Agent Systems with Amazon Bedrock',
    description: 'Learn how to orchestrate autonomous agents with Amazon Bedrock.',
    level: 300,
    format: 'breakout',
    topics: ['AI', 'Bedrock'],
    schedule: {
      day: '2026-12-01',
      startTime: '10:00',
      endTime: '11:00',
    },
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

describe('ai/agents', () => {
  it('KnowledgeAgent executes context analysis and knowledge base retrieval steps', async () => {
    const agent = new KnowledgeAgent({ catalogSessions: mockSessions });
    expect(agent.agentId).toBe('knowledge-agent');

    const result = await agent.run({
      prompt: 'I want to build autonomous agents with Amazon Bedrock',
      contextVariables: {
        projectName: 'Pathfinder Agentic',
        currentStack: ['Bedrock', 'Node.js'],
      },
    });

    expect(result.agentId).toBe('knowledge-agent');
    expect(result.steps.length).toBeGreaterThanOrEqual(1);
    expect(result.output).toContain('Pathfinder Agentic');
    expect(result.modelId).toBeDefined();
  });

  it('JourneyRecommendationAgent executes ranking and schedule conflict checks', async () => {
    const agent = new JourneyRecommendationAgent();
    expect(agent.agentId).toBe('journey-recommendation-agent');

    const scheduledItems: UserScheduleItem[] = [
      {
        id: 'sch-1',
        title: 'Morning Keynote',
        type: 'reserved',
        day: '2026-12-01',
        startTime: '10:15',
        endTime: '11:15',
      },
    ];

    const result = await agent.run({
      prompt: 'Rank recommendations and check schedule conflicts',
      contextVariables: {
        knowledgeGaps: mockGaps,
        candidateSessions: mockSessions,
        scheduledItems,
      },
    });

    expect(result.agentId).toBe('journey-recommendation-agent');
    expect(result.steps.length).toBe(2);
    expect(result.output).toContain('Journey Synthesis Complete');
    expect(result.output).toContain('Detected 1 schedule conflicts');
  });
});
