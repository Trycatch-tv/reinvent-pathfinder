import type { AgentToolDefinition, AgentToolResult } from '@pathfinder/ai-contracts';
import {
  type ContextAnalyzerProvider,
  HeuristicContextAnalyzer,
} from '@pathfinder/ai-knowledge';
import {
  validateAnalyzeContextRequest,
  type AnalyzeContextRequest,
  type AnalyzeContextResponse,
} from '@pathfinder/contracts';
import type { ExecutableAgentTool } from './base-tool.js';

export class ContextAnalysisTool implements ExecutableAgentTool<AnalyzeContextRequest, AnalyzeContextResponse> {
  public readonly definition: AgentToolDefinition = {
    name: 'analyze_project_context',
    description: 'Analyzes attendee project background, technical stack, seniority and goals to produce a KnowledgeProfile and identify KnowledgeGaps.',
    parameters: [
      {
        name: 'projectName',
        type: 'string',
        description: 'Name of the attendee software project or business initiative.',
        required: true,
      },
      {
        name: 'description',
        type: 'string',
        description: 'Detailed description of the architecture, stack, and challenges.',
        required: true,
      },
      {
        name: 'currentStack',
        type: 'array',
        description: 'List of technologies currently used (e.g. AWS, DynamoDB, Bedrock).',
      },
      {
        name: 'seniority',
        type: 'string',
        description: 'Seniority level: beginner, intermediate, or advanced.',
      },
      {
        name: 'goals',
        type: 'array',
        description: 'Specific learning or architectural goals for AWS re:Invent.',
      },
    ],
  };

  private readonly analyzer: ContextAnalyzerProvider;

  constructor(analyzer?: ContextAnalyzerProvider) {
    this.analyzer = analyzer ?? new HeuristicContextAnalyzer();
  }

  public async execute(
    input: AnalyzeContextRequest,
    toolUseId = `tu-${Date.now()}`,
  ): Promise<AgentToolResult<AnalyzeContextResponse>> {
    try {
      const validated = validateAnalyzeContextRequest(input);
      const response = await this.analyzer.analyze(validated);
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
          error: message,
        } as unknown as AnalyzeContextResponse,
      };
    }
  }
}
