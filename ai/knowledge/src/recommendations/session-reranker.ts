import type {
  RankRecommendationsRequest,
  RankRecommendationsResponse,
} from '@pathfinder/contracts';
import type {
  KnowledgeGap,
  SessionCandidate,
  SessionRecommendation,
} from '@pathfinder/domain';
import { CandidateFilter } from './candidate-filter.js';

export interface SessionRerankerProvider {
  rank(request: RankRecommendationsRequest): Promise<RankRecommendationsResponse>;
}

/**
 * Weights for multi-factor scoring (aligned with Section 21 & 23 of Technical Brief):
 * - Gap Coverage: 40%
 * - Semantic Topic Overlap: 30%
 * - Seniority / Level Alignment: 20%
 * - Logistics / Venue Bonus: 10%
 */
export interface ScoringWeights {
  readonly gapCoverage: number;
  readonly topicOverlap: number;
  readonly levelAlignment: number;
  readonly logistics: number;
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  gapCoverage: 0.4,
  topicOverlap: 0.3,
  levelAlignment: 0.2,
  logistics: 0.1,
};

/**
 * Heuristic Session Reranker.
 * Evaluates candidates deterministically against identified KnowledgeGaps and project context.
 * Computes multi-factor weighted relevance scores and produces structured explanations.
 * Zero external network or AWS requirements.
 */
export class HeuristicSessionReranker implements SessionRerankerProvider {
  private readonly filter: CandidateFilter;
  private readonly weights: ScoringWeights;

  constructor(weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS) {
    this.filter = new CandidateFilter();
    this.weights = weights;
  }

  public async rank(request: RankRecommendationsRequest): Promise<RankRecommendationsResponse> {
    const totalCandidatesEvaluated = request.candidateSessions.length;

    // 1. Apply CandidateFilter
    const filteredSessions = this.filter.filter(request.candidateSessions, {
      targetLevels: request.targetLevels,
      preferredFormats: request.preferredFormats,
    });

    const filteredCandidatesCount = filteredSessions.length;

    // 2. Score each candidate
    const scoredCandidates: Array<{
      session: SessionCandidate;
      relevanceScore: number;
      coveredGapIds: string[];
      explanation: string;
      logisticsScore: number;
    }> = [];

    for (const session of filteredSessions) {
      const evaluation = this.evaluateSession(session, request.knowledgeGaps, request);
      scoredCandidates.push({
        session,
        relevanceScore: evaluation.score,
        coveredGapIds: evaluation.coveredGapIds,
        explanation: evaluation.explanation,
        logisticsScore: evaluation.logisticsScore,
      });
    }

    // 3. Sort by relevanceScore descending
    scoredCandidates.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // 4. Truncate to maxRecommendations
    const limit = request.maxRecommendations ?? 10;
    const topCandidates = scoredCandidates.slice(0, limit);

    const recommendations: SessionRecommendation[] = topCandidates.map((c) => ({
      sessionId: c.session.id,
      sessionCode: c.session.code,
      title: c.session.title,
      relevanceScore: Number(c.relevanceScore.toFixed(3)),
      coveredGapIds: c.coveredGapIds,
      explanation: c.explanation,
      logisticsScore: Number(c.logisticsScore.toFixed(2)),
    }));

    return {
      recommendations,
      totalCandidatesEvaluated,
      filteredCandidatesCount,
      rankedAt: new Date().toISOString(),
      modelId: 'heuristic-reranker-v1',
    };
  }

  private evaluateSession(
    session: SessionCandidate,
    gaps: readonly KnowledgeGap[],
    request: RankRecommendationsRequest,
  ): {
    score: number;
    coveredGapIds: string[];
    explanation: string;
    logisticsScore: number;
  } {
    const sessionText = `${session.title} ${session.description} ${session.topics.join(' ')}`.toLowerCase();

    const coveredGapIds: string[] = [];
    const matchedGapTopics: string[] = [];

    // Factor 1: Gap Coverage
    let bestGapSeverityScore = 0;
    for (const gap of gaps) {
      const gapTokens = `${gap.topic} ${gap.description}`
        .toLowerCase()
        .split(/\W+/)
        .filter((t) => t.length > 3);

      const matchCount = gapTokens.filter((token) => sessionText.includes(token)).length;
      const coverageRatio = gapTokens.length > 0 ? matchCount / gapTokens.length : 0;

      // Direct substring match
      const directTopicMatch = sessionText.includes(gap.topic.toLowerCase().slice(0, 8));

      if (coverageRatio >= 0.25 || directTopicMatch) {
        coveredGapIds.push(gap.id);
        matchedGapTopics.push(gap.topic);
        const severityWeight =
          gap.severity === 'critical' ? 1.0 : gap.severity === 'important' ? 0.85 : 0.70;
        if (severityWeight > bestGapSeverityScore) {
          bestGapSeverityScore = severityWeight;
        }
      }
    }

    let gapCoverageScore = 0.2; // Baseline for sessions without direct gap match
    if (coveredGapIds.length > 0) {
      const multiGapBonus = Math.min((coveredGapIds.length - 1) * 0.05, 0.15);
      gapCoverageScore = Math.min(bestGapSeverityScore + multiGapBonus, 1.0);
    }

    // Factor 2: Topic Overlap with Project Context & Goals
    let topicOverlapScore = 0.5; // Base score
    if (request.projectContext) {
      const contextTokens = [
        ...request.projectContext.currentStack,
        ...request.projectContext.goals,
      ]
        .join(' ')
        .toLowerCase()
        .split(/\W+/)
        .filter((t) => t.length > 3);

      if (contextTokens.length > 0) {
        const matches = contextTokens.filter((token) => sessionText.includes(token)).length;
        topicOverlapScore = matches >= 3 ? 0.95 : matches >= 2 ? 0.85 : matches === 1 ? 0.70 : 0.40;
      }
    }

    // Factor 3: Level alignment
    const seniority = request.projectContext?.seniority ?? 'intermediate';
    let levelScore: number;
    if (seniority === 'advanced') {
      levelScore = session.level >= 300 ? 1.0 : 0.5;
    } else if (seniority === 'beginner') {
      levelScore = session.level <= 200 ? 1.0 : 0.6;
    } else {
      // intermediate
      levelScore = session.level === 200 || session.level === 300 ? 1.0 : 0.7;
    }

    // Factor 4: Logistics Score
    let logisticsScore = 0.8;
    if (session.capacityRemaining !== undefined) {
      logisticsScore = session.capacityRemaining > 0 ? 1.0 : 0.2;
    }

    // Composite weighted score
    const finalScore =
      gapCoverageScore * this.weights.gapCoverage +
      topicOverlapScore * this.weights.topicOverlap +
      levelScore * this.weights.levelAlignment +
      logisticsScore * this.weights.logistics;

    // Generate explainable rationale
    const explanation = this.buildExplanation(session, matchedGapTopics, seniority);

    return {
      score: Math.min(Math.max(finalScore, 0.0), 1.0),
      coveredGapIds,
      explanation,
      logisticsScore,
    };
  }

  private buildExplanation(
    session: SessionCandidate,
    matchedGapTopics: string[],
    seniority: string,
  ): string {
    if (matchedGapTopics.length > 0) {
      const topGap = matchedGapTopics[0];
      return `Recomendada (${session.code} nivel ${session.level}): aborda directamente tu brecha en "${topGap}". ` +
        `Ideal para tu perfil ${seniority} para profundizar en arquitecturas prácticas durante el evento.`;
    }

    return `Recomendada (${session.code} nivel ${session.level}): alineada con tu stack tecnológico y objetivos de aprendizaje en re:Invent.`;
  }
}

import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { CostGuardrail } from '../observability/cost-guardrail.js';
import { AiMetricsTracker } from '../observability/ai-metrics-tracker.js';

function extractJsonBlock(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return match?.[1] ? match[1].trim() : text.trim();
}

export interface BedrockRerankerOptions {
  readonly modelId?: string;
  readonly region?: string;
  readonly bedrockClient?: BedrockRuntimeClient;
  readonly weights?: ScoringWeights;
  readonly guardrail?: CostGuardrail;
  readonly tracker?: AiMetricsTracker;
}

/**
 * Bedrock Session Reranker.
 * Uses Amazon Bedrock to perform LLM reranking and contextual reasoning with graceful heuristic fallback.
 */
export class BedrockSessionReranker implements SessionRerankerProvider {
  public readonly modelId: string;
  public readonly region: string;
  private readonly fallbackReranker: HeuristicSessionReranker;
  private readonly filter: CandidateFilter;
  private client: BedrockRuntimeClient | null;
  public readonly guardrail?: CostGuardrail;
  public readonly tracker?: AiMetricsTracker;

  constructor(options: BedrockRerankerOptions = {}) {
    this.modelId = options.modelId ?? process.env.BEDROCK_MODEL_ID ?? 'us.amazon.nova-micro-v1:0';
    this.region = options.region ?? process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-east-1';
    this.fallbackReranker = new HeuristicSessionReranker(options.weights);
    this.filter = new CandidateFilter();
    this.client = options.bedrockClient ?? null;
    this.guardrail = options.guardrail;
    this.tracker = options.tracker;
  }

  private getClient(): BedrockRuntimeClient | null {
    if (this.client) return this.client;
    if (process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION) {
      try {
        this.client = new BedrockRuntimeClient({ region: this.region });
        return this.client;
      } catch {
        return null;
      }
    }
    return null;
  }

  public async rank(request: RankRecommendationsRequest): Promise<RankRecommendationsResponse> {
    const startTime = Date.now();
    const totalCandidatesEvaluated = request.candidateSessions.length;
    const filteredSessions = this.filter.filter(request.candidateSessions, {
      targetLevels: request.targetLevels,
      preferredFormats: request.preferredFormats,
    });
    const filteredCandidatesCount = filteredSessions.length;

    if (filteredCandidatesCount === 0) {
      return {
        recommendations: [],
        totalCandidatesEvaluated,
        filteredCandidatesCount: 0,
        rankedAt: new Date().toISOString(),
        modelId: this.modelId,
      };
    }

    if (this.guardrail) {
      const estimatedTokens = Math.ceil(filteredCandidatesCount * 120 + 500);
      const validation = this.guardrail.validateRequest(estimatedTokens);
      if (!validation.allowed) {
        this.tracker?.record({
          operation: 'session-rerank',
          modelId: this.modelId,
          latencyMs: Date.now() - startTime,
          inputTokens: 0,
          outputTokens: 0,
          estimatedCostUsd: 0,
          status: 'budget-exceeded',
          errorDetails: validation.reason,
        });
        return this.fallbackReranker.rank(request);
      }
    }

    const client = this.getClient();
    if (!client) {
      this.tracker?.record({
        operation: 'session-rerank',
        modelId: this.modelId,
        latencyMs: Date.now() - startTime,
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUsd: 0,
        status: 'fallback',
      });
      return this.fallbackReranker.rank(request);
    }

    try {
      const candidatesPayload = filteredSessions.slice(0, 20).map((s) => ({
        id: s.id,
        code: s.code,
        title: s.title,
        level: s.level,
        format: s.format,
        topics: s.topics,
      }));

      const gapsPayload = request.knowledgeGaps.map((g) => ({
        id: g.id,
        topic: g.topic,
        description: g.description,
        severity: g.severity,
      }));

      const prompt = `Pondera y rankea las siguientes sesiones de AWS re:Invent según su relevancia para resolver las brechas de conocimiento (Knowledge Gaps) del asistente:
Brechas: ${JSON.stringify(gapsPayload)}
Sesiones candidatas: ${JSON.stringify(candidatesPayload)}

Instrucciones de puntuación:
- Asigna un score de 0.0 a 1.0 a cada sesión evaluada DE FORMA INDEPENDIENTE.
- NO devuelvas una distribución de probabilidad que sume 1.0.
- Sesiones que abordan brechas prioritarias o críticas de forma directa: score alto entre 0.80 y 0.98.
- Sesiones alternativas o con afinidad relevante: score entre 0.65 y 0.79.
- Sesiones complementarias o exploratorias: score menor a 0.65.

Devuelve un JSON array ordenado por score (de 0.0 a 1.0):
[
  {
    "sessionId": "id-de-sesion",
    "score": 0.92,
    "coveredGapIds": ["id-de-brecha"],
    "explanation": "Explicación contextual de por qué se recomienda.",
    "logisticsScore": 0.8
  }
]
Responde ÚNICAMENTE con el bloque JSON array válido.`;

      const command = new ConverseCommand({
        modelId: this.modelId,
        messages: [
          {
            role: 'user',
            content: [{ text: prompt }],
          },
        ],
        inferenceConfig: {
          maxTokens: 2048,
          temperature: 0.1,
        },
      });

      const response = await client.send(command);
      const outputText = response.output?.message?.content?.[0]?.text;
      if (!outputText) {
        this.tracker?.record({
          operation: 'session-rerank',
          modelId: this.modelId,
          latencyMs: Date.now() - startTime,
          inputTokens: 0,
          outputTokens: 0,
          estimatedCostUsd: 0,
          status: 'fallback',
        });
        return this.fallbackReranker.rank(request);
      }

      const parsed = JSON.parse(extractJsonBlock(outputText));
      if (!Array.isArray(parsed) || parsed.length === 0) {
        this.tracker?.record({
          operation: 'session-rerank',
          modelId: this.modelId,
          latencyMs: Date.now() - startTime,
          inputTokens: 0,
          outputTokens: 0,
          estimatedCostUsd: 0,
          status: 'fallback',
        });
        return this.fallbackReranker.rank(request);
      }

      const inputTokens = response.usage?.inputTokens ?? 0;
      const outputTokens = response.usage?.outputTokens ?? 0;
      const cost = this.guardrail?.recordUsage(this.modelId, inputTokens, outputTokens) ?? 0;

      this.tracker?.record({
        operation: 'session-rerank',
        modelId: this.modelId,
        latencyMs: Date.now() - startTime,
        inputTokens,
        outputTokens,
        estimatedCostUsd: cost,
        status: 'success',
      });

      const sessionsById = new Map(filteredSessions.map((s) => [s.id, s]));
      const limit = request.maxRecommendations ?? 10;
      const recommendations: SessionRecommendation[] = [];

      // Detect if model returned softmax probabilities (all scores <= 0.15)
      const rawScores = parsed.map((item) => (typeof item.score === 'number' ? item.score : 0));
      const maxScore = Math.max(...rawScores, 0);
      const isSoftmax = maxScore > 0 && maxScore <= 0.15;

      for (const item of parsed) {
        const session = sessionsById.get(String(item.sessionId));
        if (!session) continue;

        let relevanceScore = typeof item.score === 'number'
          ? Math.min(Math.max(item.score, 0.0), 1.0)
          : 0.5;

        if (isSoftmax && maxScore > 0) {
          // Rescale from [0, maxScore] to [0.35, 0.94] for interpretable tier ranking
          relevanceScore = Number((0.35 + (relevanceScore / maxScore) * 0.59).toFixed(3));
        }

        const coveredGapIds = Array.isArray(item.coveredGapIds)
          ? item.coveredGapIds.map(String)
          : [];

        const explanation = typeof item.explanation === 'string' && item.explanation.length > 0
          ? item.explanation
          : `Recomendada (${session.code} nivel ${session.level}) para cubrir tus brechas en re:Invent.`;

        const logisticsScore = typeof item.logisticsScore === 'number'
          ? Math.min(Math.max(item.logisticsScore, 0.0), 1.0)
          : undefined;

        recommendations.push({
          sessionId: session.id,
          sessionCode: session.code,
          title: session.title,
          relevanceScore,
          coveredGapIds,
          explanation,
          logisticsScore,
        });

        if (recommendations.length >= limit) break;
      }

      if (recommendations.length === 0) {
        return this.fallbackReranker.rank(request);
      }

      return {
        recommendations,
        totalCandidatesEvaluated,
        filteredCandidatesCount,
        rankedAt: new Date().toISOString(),
        modelId: this.modelId,
      };
    } catch (err) {
      this.tracker?.record({
        operation: 'session-rerank',
        modelId: this.modelId,
        latencyMs: Date.now() - startTime,
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUsd: 0,
        status: 'fallback',
        errorDetails: err instanceof Error ? err.message : String(err),
      });
      return this.fallbackReranker.rank(request);
    }
  }
}
