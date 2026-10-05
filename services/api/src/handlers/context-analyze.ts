import {
  validateAnalyzeContextRequest,
  type AnalyzeContextRequest,
  type AnalyzeContextResponse,
} from '@pathfinder/contracts';
import {
  HeuristicContextAnalyzer,
  BedrockContextAnalyzer,
  type ContextAnalyzerProvider,
} from '@pathfinder/ai-knowledge';

export interface ApiResponse {
  readonly statusCode: number;
  readonly headers: Record<string, string>;
  readonly body: string;
}

export interface ApiRequest {
  readonly body?: string | unknown;
  readonly headers?: Record<string, string>;
}

export class ContextAnalyzeHandler {
  private readonly analyzer: ContextAnalyzerProvider;

  constructor(analyzer?: ContextAnalyzerProvider) {
    this.analyzer = analyzer ?? (
      process.env.USE_BEDROCK === 'true'
        ? new BedrockContextAnalyzer()
        : new HeuristicContextAnalyzer()
    );
  }

  public async handle(request: ApiRequest): Promise<ApiResponse<AnalyzeContextResponse>> {
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

      const validatedRequest: AnalyzeContextRequest = validateAnalyzeContextRequest(rawBody);
      const analysisResult = await this.analyzer.analyze(validatedRequest);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(analysisResult),
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
          message: 'Failed to analyze project context.',
        }),
      };
    }
  }
}
