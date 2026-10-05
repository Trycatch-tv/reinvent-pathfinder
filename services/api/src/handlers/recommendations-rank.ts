import {
  validateRankRecommendationsRequest,
  type RankRecommendationsRequest,
} from '@pathfinder/contracts';
import {
  HeuristicSessionReranker,
  BedrockSessionReranker,
  type SessionRerankerProvider,
} from '@pathfinder/ai-knowledge';
import type { ApiRequest, ApiResponse } from './context-analyze.js';

export class RecommendationsRankHandler {
  private readonly reranker: SessionRerankerProvider;

  constructor(reranker?: SessionRerankerProvider) {
    this.reranker = reranker ?? (
      process.env.USE_BEDROCK === 'true'
        ? new BedrockSessionReranker()
        : new HeuristicSessionReranker()
    );
  }

  public async handle(request: ApiRequest): Promise<ApiResponse> {
    const corsHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    try {
      let rawBody = request.body;
      if (typeof rawBody === 'string') {
        try {
          rawBody = JSON.parse(rawBody);
        } catch {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              error: 'Bad Request',
              message: 'Invalid JSON payload in request body.',
            }),
          };
        }
      }

      if (!rawBody) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Bad Request',
            message: 'Request body cannot be empty.',
          }),
        };
      }

      const validatedRequest: RankRecommendationsRequest = validateRankRecommendationsRequest(rawBody);
      const rankingResult = await this.reranker.rank(validatedRequest);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(rankingResult),
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      // Distinguish client validation errors from internal server errors
      if (errorMessage.startsWith('Field ') || errorMessage.startsWith('Invalid request body')) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Validation Error',
            message: errorMessage,
          }),
        };
      }

      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: 'Failed to rank recommendations.',
        }),
      };
    }
  }
}
