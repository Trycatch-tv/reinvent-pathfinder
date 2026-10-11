export interface CostGuardrailOptions {
  /**
   * Maximum tokens permitted in a single request.
   * Default: 4,000 tokens.
   */
  readonly maxTokensPerRequest?: number;
  /**
   * Maximum accumulated cost in USD before calls are blocked/degraded.
   * Default: 10.00 USD.
   */
  readonly maxCostBudgetUsd?: number;
}

export interface CostValidationResult {
  readonly allowed: boolean;
  readonly reason?: string;
}

const MODEL_PRICING_PER_1K: Record<string, { input: number; output: number }> = {
  // Amazon Nova Micro: $0.035 / 1M input, $0.14 / 1M output
  'nova-micro': { input: 0.000035, output: 0.00014 },
  // Amazon Nova Lite: $0.06 / 1M input, $0.24 / 1M output
  'nova-lite': { input: 0.00006, output: 0.00024 },
  // Amazon Nova Pro: $0.80 / 1M input, $3.20 / 1M output
  'nova-pro': { input: 0.0008, output: 0.0032 },
  'nova': { input: 0.000035, output: 0.00014 },
  // Claude models
  'anthropic.claude-3-5-sonnet': { input: 0.003, output: 0.015 },
  'anthropic.claude-3-haiku': { input: 0.00025, output: 0.00125 },
  'claude': { input: 0.003, output: 0.015 },
  // Default fallback for unknown models
  default: { input: 0.003, output: 0.015 },
};

/**
 * Guardrail preventing runaway token costs and enforcing budget limits.
 */
export class CostGuardrail {
  private readonly maxTokensPerRequest: number;
  private readonly maxCostBudgetUsd: number;
  private accumulatedCostUsd = 0;

  constructor(options: CostGuardrailOptions = {}) {
    this.maxTokensPerRequest = options.maxTokensPerRequest ?? 4000;
    this.maxCostBudgetUsd = options.maxCostBudgetUsd ?? 10.0;
  }

  public validateRequest(estimatedTokens = 1000): CostValidationResult {
    if (estimatedTokens > this.maxTokensPerRequest) {
      return {
        allowed: false,
        reason: `Request estimated tokens (${estimatedTokens}) exceeds max allowed per request (${this.maxTokensPerRequest}).`,
      };
    }

    if (this.accumulatedCostUsd >= this.maxCostBudgetUsd) {
      return {
        allowed: false,
        reason: `Accumulated cost ($${this.accumulatedCostUsd.toFixed(4)}) exceeds configured budget ($${this.maxCostBudgetUsd.toFixed(2)}).`,
      };
    }

    return { allowed: true };
  }

  public calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
    const key = Object.keys(MODEL_PRICING_PER_1K).find((k) => modelId.includes(k)) ?? 'default';
    const rate = MODEL_PRICING_PER_1K[key] ?? MODEL_PRICING_PER_1K['default']!;

    const cost = (inputTokens / 1000) * rate.input + (outputTokens / 1000) * rate.output;
    return Math.round(cost * 100000) / 100000;
  }

  public recordUsage(modelId: string, inputTokens: number, outputTokens: number): number {
    const cost = this.calculateCost(modelId, inputTokens, outputTokens);
    this.accumulatedCostUsd += cost;
    return cost;
  }

  public getAccumulatedCost(): number {
    return Math.round(this.accumulatedCostUsd * 100000) / 100000;
  }

  public reset(): void {
    this.accumulatedCostUsd = 0;
  }
}
