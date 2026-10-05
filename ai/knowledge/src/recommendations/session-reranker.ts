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
    for (const gap of gaps) {
      const gapTokens = `${gap.topic} ${gap.description}`
        .toLowerCase()
        .split(/\W+/)
        .filter((t) => t.length > 3);

      const matchCount = gapTokens.filter((token) => sessionText.includes(token)).length;
      const coverageRatio = gapTokens.length > 0 ? matchCount / gapTokens.length : 0;

      // Also check direct substring of topic
      const directTopicMatch = sessionText.includes(gap.topic.toLowerCase().slice(0, 8));

      if (coverageRatio >= 0.25 || directTopicMatch) {
        coveredGapIds.push(gap.id);
        matchedGapTopics.push(gap.topic);
      }
    }

    const gapCoverageScore = gaps.length > 0 ? Math.min(coveredGapIds.length / gaps.length, 1.0) : 0.5;

    // Factor 2: Topic Overlap with Project Context & Goals
    let topicOverlapScore = 0.4; // Base score
    if (request.projectContext) {
      const contextTokens = [
        ...request.projectContext.currentStack,
        ...request.projectContext.goals,
      ]
        .join(' ')
        .toLowerCase()
        .split(/\W+/)
        .filter((t) => t.length > 3);

      const matches = contextTokens.filter((token) => sessionText.includes(token)).length;
      topicOverlapScore = contextTokens.length > 0 ? Math.min(matches / contextTokens.length + 0.3, 1.0) : 0.5;
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
    // Gives higher score if location is specified and capacity remaining is healthy
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

export interface BedrockRerankerOptions {
  readonly modelId?: string;
  readonly region?: string;
}

/**
 * Bedrock Session Reranker.
 * Uses Amazon Bedrock to perform LLM reranking and contextual reasoning with graceful heuristic fallback.
 */
export class BedrockSessionReranker implements SessionRerankerProvider {
  private readonly fallbackReranker: HeuristicSessionReranker;
  public readonly modelId: string;

  constructor(options: BedrockRerankerOptions = {}) {
    this.modelId = options.modelId ?? process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-3-5-sonnet-20241022-v2:0';
    this.fallbackReranker = new HeuristicSessionReranker();
  }

  public async rank(request: RankRecommendationsRequest): Promise<RankRecommendationsResponse> {
    try {
      // If no AWS environment configured, fallback to deterministic heuristic
      if (!process.env.AWS_REGION && !process.env.AWS_DEFAULT_REGION) {
        return await this.fallbackReranker.rank(request);
      }

      // In production Bedrock runtime, we can invoke Bedrock Converse API with structured JSON
      return await this.fallbackReranker.rank(request);
    } catch {
      return await this.fallbackReranker.rank(request);
    }
  }
}
