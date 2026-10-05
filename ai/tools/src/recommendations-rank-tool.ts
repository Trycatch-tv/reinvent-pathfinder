import type { AgentToolDefinition, AgentToolResult } from '@pathfinder/ai-contracts';
import {
  type SessionRerankerProvider,
  HeuristicSessionReranker,
} from '@pathfinder/ai-knowledge';
import {
  validateRankRecommendationsRequest,
  type RankRecommendationsRequest,
  type RankRecommendationsResponse,
} from '@pathfinder/contracts';
import type { ExecutableAgentTool } from './base-tool.js';

export class RecommendationsRankTool implements ExecutableAgentTool<RankRecommendationsRequest, RankRecommendationsResponse> {
  public readonly definition: AgentToolDefinition = {
    name: 'rank_recommendations',
    description: 'Pre-filters and reranks candidate sessions using multi-factor scoring (gap coverage, topic relevance, seniority alignment) and generates explainable recommendations.',
    parameters: [
      {
        name: 'knowledgeGaps',
        type: 'array',
        description: 'List of target KnowledgeGaps to address.',
        required: true,
      },
      {
        name: 'candidateSessions',
        type: 'array',
        description: 'Pool of candidate sessions to evaluate.',
        required: true,
      },
      {
        name: 'targetLevels',
        type: 'array',
        description: 'Optional list of desired session levels (e.g. [300, 400]).',
      },
      {
        name: 'maxRecommendations',
        type: 'number',
        description: 'Maximum number of recommendations to return.',
      },
    ],
  };

  private readonly reranker: SessionRerankerProvider;

  constructor(reranker?: SessionRerankerProvider) {
    this.reranker = reranker ?? new HeuristicSessionReranker();
  }

  public async execute(
    input: RankRecommendationsRequest,
    toolUseId = `tu-${Date.now()}`,
  ): Promise<AgentToolResult<RankRecommendationsResponse>> {
    try {
      const validated = validateRankRecommendationsRequest(input);
      const response = await this.reranker.rank(validated);
      return {
        toolUseId,
        isError: false,
        output: response,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        toolUseId,
        isError: true,
        output: {
          recommendations: [],
          totalCandidatesEvaluated: 0,
          filteredCandidatesCount: 0,
          rankedAt: new Date().toISOString(),
          modelId: 'error',
          error: message,
        } as unknown as RankRecommendationsResponse,
      };
    }
  }
}
