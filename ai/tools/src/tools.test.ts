import { describe, it, expect } from 'vitest';
import {
  ContextAnalysisTool,
  KnowledgeBaseSearchTool,
  RecommendationsRankTool,
  ScheduleConflictCheckTool,
} from './index.js';
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
  {
    id: 's-2',
    code: 'DAT201',
    title: 'DynamoDB Modeling',
    description: 'Data modeling strategies in Amazon DynamoDB.',
    level: 200,
    format: 'breakout',
    topics: ['Databases'],
    schedule: {
      day: '2026-12-01',
      startTime: '10:30',
      endTime: '11:30',
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

describe('ai/tools', () => {
  it('ContextAnalysisTool analyzes project context and returns KnowledgeGaps', async () => {
    const tool = new ContextAnalysisTool();
    expect(tool.definition.name).toBe('analyze_project_context');

    const result = await tool.execute({
      projectName: 'Pathfinder Core',
      description: 'Building multi-agent systems with Amazon Bedrock and DynamoDB',
      seniority: 'advanced',
    });

    expect(result.isError).toBe(false);
    expect(result.output.knowledgeGaps.length).toBeGreaterThan(0);
    expect(result.output.knowledgeProfile.skills.length).toBeGreaterThan(0);
  });

  it('KnowledgeBaseSearchTool queries sessions from catalog / KB', async () => {
    const tool = new KnowledgeBaseSearchTool(undefined, mockSessions);
    expect(tool.definition.name).toBe('search_knowledge_base');

    const result = await tool.execute({ query: 'Bedrock agents', topK: 2 });
    expect(result.isError).toBe(false);
    expect(result.output.items.length).toBeGreaterThan(0);
    expect(result.output.items[0]!.session.code).toBe('AIM301');
  });

  it('RecommendationsRankTool ranks sessions with explainability', async () => {
    const tool = new RecommendationsRankTool();
    expect(tool.definition.name).toBe('rank_recommendations');

    const result = await tool.execute({
      knowledgeGaps: mockGaps,
      candidateSessions: mockSessions,
    });

    expect(result.isError).toBe(false);
    expect(result.output.recommendations.length).toBeGreaterThan(0);
    expect(result.output.recommendations[0]!.sessionCode).toBe('AIM301');
  });

  it('ScheduleConflictCheckTool detects overlaps between proposed and scheduled sessions', async () => {
    const tool = new ScheduleConflictCheckTool();
    expect(tool.definition.name).toBe('check_schedule_conflicts');

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

    const result = await tool.execute({
      proposedSessions: mockSessions,
      scheduledItems,
    });

    expect(result.isError).toBe(false);
    // AIM301 (10:00-11:00) overlaps with sch-1 (10:15-11:15)
    expect(result.output.length).toBeGreaterThan(0);
    expect(result.output[0]!.conflict.overlapMinutes).toBeGreaterThan(0);
    expect(result.output[0]!.conflict.reason).toBeDefined();
  });
});
