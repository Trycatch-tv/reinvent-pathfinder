import { describe, it, expect } from 'vitest';
import { CostGuardrail } from './cost-guardrail.js';
import { AiMetricsTracker } from './ai-metrics-tracker.js';
import { BedrockContextAnalyzer } from '../context-analyzer.js';
import { BedrockSessionReranker } from '../recommendations/session-reranker.js';
import type { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import type { SessionCandidate, KnowledgeGap } from '@pathfinder/domain';

describe('AI Cost Control & Observability', () => {
  describe('CostGuardrail', () => {
    it('allows requests within token limits and calculates accurate model costs', () => {
      const guardrail = new CostGuardrail({
        maxTokensPerRequest: 3000,
        maxCostBudgetUsd: 5.0,
      });

      const check = guardrail.validateRequest(1500);
      expect(check.allowed).toBe(true);

      // 1000 input tokens ($0.003) + 500 output tokens ($0.0075) = $0.0105
      const cost = guardrail.calculateCost('anthropic.claude-3-5-sonnet-20241022-v2:0', 1000, 500);
      expect(cost).toBe(0.0105);

      guardrail.recordUsage('anthropic.claude-3-5-sonnet-20241022-v2:0', 1000, 500);
      expect(guardrail.getAccumulatedCost()).toBe(0.0105);
    });

    it('blocks request when estimated tokens exceed maxTokensPerRequest', () => {
      const guardrail = new CostGuardrail({
        maxTokensPerRequest: 2000,
      });

      const check = guardrail.validateRequest(2500);
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('exceeds max allowed per request');
    });

    it('blocks request when accumulated cost exceeds maxCostBudgetUsd', () => {
      const guardrail = new CostGuardrail({
        maxCostBudgetUsd: 0.05,
      });

      // Spend $0.06
      guardrail.recordUsage('anthropic.claude-3-5-sonnet', 10000, 2000);
      expect(guardrail.getAccumulatedCost()).toBeGreaterThanOrEqual(0.05);

      const check = guardrail.validateRequest(500);
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('exceeds configured budget');

      guardrail.reset();
      expect(guardrail.getAccumulatedCost()).toBe(0);
      expect(guardrail.validateRequest(500).allowed).toBe(true);
    });
  });

  describe('AiMetricsTracker', () => {
    it('records inference events and aggregates summary metrics', () => {
      const tracker = new AiMetricsTracker();

      tracker.record({
        operation: 'context-analysis',
        modelId: 'anthropic.claude-3-5-sonnet',
        latencyMs: 320,
        inputTokens: 800,
        outputTokens: 400,
        estimatedCostUsd: 0.0084,
        status: 'success',
      });

      tracker.record({
        operation: 'session-rerank',
        modelId: 'anthropic.claude-3-5-sonnet',
        latencyMs: 150,
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUsd: 0,
        status: 'fallback',
      });

      const summary = tracker.getSummary();
      expect(summary.totalCalls).toBe(2);
      expect(summary.successfulCalls).toBe(1);
      expect(summary.fallbackCalls).toBe(1);
      expect(summary.totalInputTokens).toBe(800);
      expect(summary.totalOutputTokens).toBe(400);
      expect(summary.totalCostUsd).toBe(0.0084);
      expect(summary.averageLatencyMs).toBe(235);
    });
  });

  describe('Integrated Guardrail & Telemetry in Context Analyzer and Reranker', () => {
    it('BedrockContextAnalyzer enforces budget guardrail and logs budget-exceeded telemetry', async () => {
      const guardrail = new CostGuardrail({
        maxCostBudgetUsd: 0.01,
      });
      // Force budget depletion
      guardrail.recordUsage('claude', 5000, 2000);

      const tracker = new AiMetricsTracker();

      const analyzer = new BedrockContextAnalyzer({
        modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        guardrail,
        tracker,
      });

      const result = await analyzer.analyze({
        projectName: 'Budget Guarded Project',
        description: 'Building cloud application while watching expenses.',
      });

      expect(result.projectContext.name).toBe('Budget Guarded Project');
      expect(result.modelId).toBe('heuristic-offline-v1');

      const events = tracker.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]?.status).toBe('budget-exceeded');
      expect(events[0]?.errorDetails).toContain('exceeds configured budget');
    });

    it('BedrockSessionReranker records successful invocation metrics when Converse succeeds', async () => {
      const guardrail = new CostGuardrail();
      const tracker = new AiMetricsTracker();

      const mockBedrockClient = {
        send: async () => ({
          output: {
            message: {
              content: [
                {
                  text: JSON.stringify([
                    {
                      sessionId: 's-1',
                      score: 0.95,
                      coveredGapIds: ['gap-1'],
                      explanation: 'High relevance.',
                    },
                  ]),
                },
              ],
            },
          },
          usage: {
            inputTokens: 350,
            outputTokens: 120,
          },
        }),
      };

      const reranker = new BedrockSessionReranker({
        modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        bedrockClient: mockBedrockClient as unknown as BedrockRuntimeClient,
        guardrail,
        tracker,
      });

      const mockSessions: SessionCandidate[] = [
        {
          id: 's-1',
          code: 'AIM301',
          title: 'Bedrock Multi-Agent',
          description: 'Autonomous agents.',
          level: 300,
          format: 'breakout',
          topics: ['AI'],
        },
      ];

      const mockGaps: KnowledgeGap[] = [
        {
          id: 'gap-1',
          topic: 'Bedrock',
          description: 'Agents',
          targetProficiency: 'professional',
          severity: 'critical',
          status: 'open',
          rationale: 'Required',
          addressedBySessionIds: [],
        },
      ];

      const res = await reranker.rank({
        knowledgeGaps: mockGaps,
        candidateSessions: mockSessions,
      });

      expect(res.recommendations).toHaveLength(1);
      expect(res.modelId).toBe('anthropic.claude-3-5-sonnet-20241022-v2:0');

      const summary = tracker.getSummary();
      expect(summary.successfulCalls).toBe(1);
      expect(summary.totalInputTokens).toBe(350);
      expect(summary.totalOutputTokens).toBe(120);
      expect(summary.totalCostUsd).toBeGreaterThan(0);
    });
  });
});
