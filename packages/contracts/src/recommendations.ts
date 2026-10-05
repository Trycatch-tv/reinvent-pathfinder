import type {
  ProjectContext,
  KnowledgeGap,
  SessionCandidate,
  SessionRecommendation,
  SessionLevel,
  SessionFormat,
} from '@pathfinder/domain';

export interface RankRecommendationsRequest {
  readonly projectContext?: ProjectContext;
  readonly knowledgeGaps: readonly KnowledgeGap[];
  readonly candidateSessions: readonly SessionCandidate[];
  readonly targetLevels?: readonly SessionLevel[];
  readonly preferredFormats?: readonly SessionFormat[];
  readonly maxRecommendations?: number;
}

export interface RankRecommendationsResponse {
  readonly recommendations: readonly SessionRecommendation[];
  readonly totalCandidatesEvaluated: number;
  readonly filteredCandidatesCount: number;
  readonly rankedAt: string;
  readonly modelId: string;
}

export function validateRankRecommendationsRequest(input: unknown): RankRecommendationsRequest {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid request body: expected an object.');
  }

  const candidate = input as Record<string, unknown>;

  if (!Array.isArray(candidate.knowledgeGaps) || candidate.knowledgeGaps.length === 0) {
    throw new Error('Field "knowledgeGaps" is required and must contain at least one gap.');
  }

  if (!Array.isArray(candidate.candidateSessions) || candidate.candidateSessions.length === 0) {
    throw new Error('Field "candidateSessions" is required and must contain at least one session.');
  }

  const maxRecommendations = typeof candidate.maxRecommendations === 'number' && candidate.maxRecommendations > 0
    ? Math.min(candidate.maxRecommendations, 50)
    : 10;

  return {
    projectContext: candidate.projectContext as ProjectContext | undefined,
    knowledgeGaps: candidate.knowledgeGaps as readonly KnowledgeGap[],
    candidateSessions: candidate.candidateSessions as readonly SessionCandidate[],
    targetLevels: Array.isArray(candidate.targetLevels) ? (candidate.targetLevels as SessionLevel[]) : undefined,
    preferredFormats: Array.isArray(candidate.preferredFormats) ? (candidate.preferredFormats as SessionFormat[]) : undefined,
    maxRecommendations,
  };
}
