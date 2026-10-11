export type AiOperationType =
  | 'context-analysis'
  | 'session-rerank'
  | 'kb-retrieve'
  | 'agent-invocation';

export type AiOperationStatus = 'success' | 'fallback' | 'budget-exceeded';

export interface AiMetricEvent {
  readonly id: string;
  readonly operation: AiOperationType;
  readonly modelId: string;
  readonly latencyMs: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly estimatedCostUsd: number;
  readonly status: AiOperationStatus;
  readonly timestamp: string;
  readonly errorDetails?: string;
}

export interface AiMetricsSummary {
  readonly totalCalls: number;
  readonly successfulCalls: number;
  readonly fallbackCalls: number;
  readonly budgetBlockedCalls: number;
  readonly totalInputTokens: number;
  readonly totalOutputTokens: number;
  readonly totalCostUsd: number;
  readonly averageLatencyMs: number;
}

/**
 * In-memory observability tracker collecting performance, token consumption, and cost telemetry.
 */
export class AiMetricsTracker {
  private events: AiMetricEvent[] = [];

  public record(
    event: Omit<AiMetricEvent, 'id' | 'timestamp'>
  ): AiMetricEvent {
    const fullEvent: AiMetricEvent = {
      ...event,
      id: `ai-metric-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    this.events.push(fullEvent);
    return fullEvent;
  }

  public getEvents(): readonly AiMetricEvent[] {
    return [...this.events];
  }

  public getSummary(): AiMetricsSummary {
    if (this.events.length === 0) {
      return {
        totalCalls: 0,
        successfulCalls: 0,
        fallbackCalls: 0,
        budgetBlockedCalls: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCostUsd: 0,
        averageLatencyMs: 0,
      };
    }

    let successfulCalls = 0;
    let fallbackCalls = 0;
    let budgetBlockedCalls = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCostUsd = 0;
    let totalLatency = 0;

    for (const e of this.events) {
      if (e.status === 'success') successfulCalls++;
      else if (e.status === 'fallback') fallbackCalls++;
      else if (e.status === 'budget-exceeded') budgetBlockedCalls++;

      totalInputTokens += e.inputTokens;
      totalOutputTokens += e.outputTokens;
      totalCostUsd += e.estimatedCostUsd;
      totalLatency += e.latencyMs;
    }

    return {
      totalCalls: this.events.length,
      successfulCalls,
      fallbackCalls,
      budgetBlockedCalls,
      totalInputTokens,
      totalOutputTokens,
      totalCostUsd: Math.round(totalCostUsd * 100000) / 100000,
      averageLatencyMs: Math.round(totalLatency / this.events.length),
    };
  }

  public reset(): void {
    this.events = [];
  }
}

/**
 * Global default metrics tracker instance for easy application-wide monitoring.
 */
export const defaultAiMetricsTracker = new AiMetricsTracker();
