import { describe, it, expect } from 'vitest';
import type { SessionCandidate, KnowledgeGap } from '@pathfinder/domain';
import type { UserScheduleItem } from '@pathfinder/events-client';
import type { BedrockAgentRuntimeClient } from '@aws-sdk/client-bedrock-agent-runtime';
import {
  KnowledgeAgent,
  JourneyRecommendationAgent,
  BedrockAgentCoreInvoker,
  exportActionGroupDefinitions,
} from './index.js';

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
  it('KnowledgeAgent executes context analysis and knowledge base retrieval steps in local fallback mode', async () => {
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
    expect(result.modelId).toBe('agentcore-runtime-offline-v1');
  });

  it('JourneyRecommendationAgent executes ranking and schedule conflict checks in local fallback mode', async () => {
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
    expect(result.modelId).toBe('agentcore-runtime-offline-v1');
  });

  describe('BedrockAgentCoreInvoker & Live Cloud Runtime', () => {
    it('invokes Bedrock AgentCore and decodes completion chunks and traces', async () => {
      const encoder = new TextEncoder();
      const mockStream = (async function* () {
        yield { chunk: { bytes: encoder.encode('Hello from Bedrock ') } };
        yield { trace: { trace: { failureTrace: undefined } } };
        yield { chunk: { bytes: encoder.encode('AgentCore Runtime!') } };
      })();

      const mockClient = {
        send: async () => ({
          completion: mockStream,
        }),
      };

      const invoker = new BedrockAgentCoreInvoker({
        agentId: 'agent-knowledge-123',
        agentAliasId: 'LIVEALIAS',
        region: 'us-east-1',
        client: mockClient as unknown as BedrockAgentRuntimeClient,
      });

      expect(invoker.isConfigured()).toBe(true);

      const res = await invoker.invoke('Analyze my project context');
      expect(res.output).toBe('Hello from Bedrock AgentCore Runtime!');
      expect(res.modelId).toBe('bedrock-agentcore-agent-knowledge-123');
      expect(res.steps.length).toBeGreaterThanOrEqual(1);
    });

    it('KnowledgeAgent invokes remote Bedrock AgentCore when configured', async () => {
      const encoder = new TextEncoder();
      const mockStream = (async function* () {
        yield { chunk: { bytes: encoder.encode('Remote Knowledge Agent response.') } };
      })();

      const mockClient = {
        send: async () => ({
          completion: mockStream,
        }),
      };

      const agent = new KnowledgeAgent({
        bedrockAgentId: 'agent-remote-456',
        client: mockClient as unknown as BedrockAgentRuntimeClient,
        catalogSessions: mockSessions,
      });

      const res = await agent.run({
        prompt: 'Analyze architecture',
      });

      expect(res.output).toBe('Remote Knowledge Agent response.');
      expect(res.modelId).toBe('bedrock-agentcore-agent-remote-456');
    });

    it('KnowledgeAgent and JourneyRecommendationAgent gracefully fallback to local tools if Bedrock rejects', async () => {
      const failingClient = {
        send: async () => {
          throw new Error('ThrottlingException: Rate exceeded for agent invocation');
        },
      };

      const kAgent = new KnowledgeAgent({
        bedrockAgentId: 'agent-failing',
        client: failingClient as unknown as BedrockAgentRuntimeClient,
        catalogSessions: mockSessions,
      });

      const kRes = await kAgent.run({
        prompt: 'Analyze with fallback',
        contextVariables: { projectName: 'Resilient Project' },
      });

      expect(kRes.output).toContain('Resilient Project');
      expect(kRes.modelId).toBe('agentcore-runtime-offline-v1');

      const jAgent = new JourneyRecommendationAgent({
        bedrockAgentId: 'agent-failing',
        client: failingClient as unknown as BedrockAgentRuntimeClient,
      });

      const jRes = await jAgent.run({
        prompt: 'Recommend sessions with fallback',
        contextVariables: {
          knowledgeGaps: mockGaps,
          candidateSessions: mockSessions,
        },
      });

      expect(jRes.output).toContain('Journey Synthesis Complete');
      expect(jRes.modelId).toBe('agentcore-runtime-offline-v1');
    });

    it('exportActionGroupDefinitions correctly maps tools into Bedrock Action Group parameters', () => {
      const kAgent = new KnowledgeAgent();
      const manifest = exportActionGroupDefinitions(
        'PathfinderKnowledgeActions',
        'Action group providing context analysis and catalog retrieval tools',
        [kAgent.contextAnalysisTool, kAgent.kbSearchTool]
      );

      expect(manifest.actionGroupName).toBe('PathfinderKnowledgeActions');
      expect(manifest.functions).toHaveLength(2);
      expect(manifest.functions[0]?.name).toBe('analyze_project_context');
      expect(manifest.functions[0]?.parameters['projectName']?.type).toBe('string');
      expect(manifest.functions[1]?.name).toBe('search_knowledge_base');
    });
  });
});

