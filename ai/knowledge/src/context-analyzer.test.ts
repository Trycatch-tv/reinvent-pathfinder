import { describe, it, expect } from 'vitest';
import {
  HeuristicContextAnalyzer,
  BedrockContextAnalyzer,
} from './context-analyzer.js';
import type { AnalyzeContextRequest } from '@pathfinder/contracts';
import type { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

describe('Context Analyzer (AI Knowledge)', () => {
  describe('HeuristicContextAnalyzer', () => {
    const analyzer = new HeuristicContextAnalyzer();

    it('extracts technical skills, domains, and critical gaps for agentic architectures', async () => {
      const request: AnalyzeContextRequest = {
        projectName: 'Autonomous Agent Companion',
        description: 'Building an autonomous multi-agent assistant with Amazon Bedrock AgentCore and DynamoDB single-table design.',
        currentStack: ['TypeScript', 'Node.js'],
        seniority: 'advanced',
        goals: ['Master multi-agent orchestration and low-latency storage'],
      };

      const result = await analyzer.analyze(request);

      expect(result.projectContext.name).toBe('Autonomous Agent Companion');
      expect(result.projectContext.seniority).toBe('advanced');

      // Check skills
      const skillTopics = result.knowledgeProfile.skills.map((s) => s.topic);
      expect(skillTopics).toContain('BEDROCK');
      expect(skillTopics).toContain('AGENT');
      expect(skillTopics).toContain('DYNAMODB');

      // Check domains
      expect(result.knowledgeProfile.targetDomains).toContain('Artificial Intelligence');
      expect(result.knowledgeProfile.targetDomains).toContain('Databases');

      // Check knowledge gaps
      expect(result.knowledgeGaps.length).toBeGreaterThanOrEqual(2);
      const criticalGaps = result.knowledgeGaps.filter((g) => g.severity === 'critical');
      expect(criticalGaps.length).toBeGreaterThanOrEqual(1);

      const bedrockGap = result.knowledgeGaps.find((g) => g.topic.includes('Bedrock AgentCore'));
      expect(bedrockGap).toBeDefined();
      expect(bedrockGap?.status).toBe('open');
      expect(bedrockGap?.rationale).toContain('agentic systems');
    });

    it('identifies security and OAuth gaps when authentication is mentioned', async () => {
      const request: AnalyzeContextRequest = {
        projectName: 'Cloud Identity Gateway',
        description: 'Implementing Zero Trust identity, OAuth 2.0 PKCE, and ephemeral token delegation for AWS services.',
        seniority: 'intermediate',
      };

      const result = await analyzer.analyze(request);
      const securityGap = result.knowledgeGaps.find((g) => g.topic.includes('Zero Trust'));

      expect(securityGap).toBeDefined();
      expect(securityGap?.severity).toBe('critical');
      expect(result.knowledgeProfile.targetDomains).toContain('Security');
    });

    it('provides fallback domains and gaps for broad general queries', async () => {
      const request: AnalyzeContextRequest = {
        projectName: 'General Project',
        description: 'Learning modern cloud patterns.',
      };

      const result = await analyzer.analyze(request);
      expect(result.knowledgeGaps.length).toBeGreaterThanOrEqual(1);
      expect(result.knowledgeProfile.targetDomains).toContain('Cloud Architecture');
    });
  });

  describe('BedrockContextAnalyzer', () => {
    it('gracefully executes fallback analysis when running offline/local', async () => {
      const analyzer = new BedrockContextAnalyzer();
      const request: AnalyzeContextRequest = {
        projectName: 'Offline Test Project',
        description: 'Offline Bedrock test with DynamoDB.',
      };

      const result = await analyzer.analyze(request);
      expect(result.projectContext.name).toBe('Offline Test Project');
      expect(result.knowledgeGaps.length).toBeGreaterThanOrEqual(1);
    });

    it('invokes Bedrock Converse API with structured JSON output when client is provided', async () => {
      const mockBedrockClient = {
        send: async () => ({
          output: {
            message: {
              content: [
                {
                  text: JSON.stringify({
                    skills: [
                      { topic: 'BEDROCK', proficiency: 'specialty' },
                      { topic: 'AGENTCORE', proficiency: 'professional' },
                    ],
                    targetDomains: ['Artificial Intelligence', 'Serverless'],
                    knowledgeGaps: [
                      {
                        id: 'gap-bedrock-1',
                        topic: 'Advanced Multi-Agent Orchestration',
                        description: 'Implementing custom agent tools and state handoff.',
                        targetProficiency: 'specialty',
                        severity: 'critical',
                        status: 'open',
                        rationale: 'Core architecture requirement',
                      },
                    ],
                  }),
                },
              ],
            },
          },
        }),
      };

      const analyzer = new BedrockContextAnalyzer({
        modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        bedrockClient: mockBedrockClient as unknown as BedrockRuntimeClient,
      });

      const result = await analyzer.analyze({
        projectName: 'Agentic Pathfinder',
        description: 'Building multi-agent companion for re:Invent.',
      });

      expect(result.modelId).toBe('anthropic.claude-3-5-sonnet-20241022-v2:0');
      expect(result.knowledgeProfile.skills.map((s) => s.topic)).toContain('BEDROCK');
      expect(result.knowledgeProfile.skills.map((s) => s.topic)).toContain('AGENTCORE');
      expect(result.knowledgeGaps).toHaveLength(1);
      expect(result.knowledgeGaps[0]?.topic).toBe('Advanced Multi-Agent Orchestration');
      expect(result.knowledgeGaps[0]?.severity).toBe('critical');
    });

    it('gracefully degrades to heuristic fallback when Bedrock call rejects', async () => {
      const failingClient = {
        send: async () => {
          throw new Error('ThrottlingException: Rate exceeded');
        },
      };

      const analyzer = new BedrockContextAnalyzer({
        bedrockClient: failingClient as unknown as BedrockRuntimeClient,
      });

      const result = await analyzer.analyze({
        projectName: 'Resilient Project',
        description: 'Testing Bedrock fallback under error.',
      });

      expect(result.projectContext.name).toBe('Resilient Project');
      expect(result.knowledgeGaps.length).toBeGreaterThanOrEqual(1);
      expect(result.modelId).toBe('heuristic-offline-v1');
    });
  });
});
