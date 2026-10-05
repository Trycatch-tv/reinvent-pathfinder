import type { AgentToolDefinition, AgentToolResult } from '@pathfinder/ai-contracts';
import {
  type KnowledgeBaseRetriever,
  type KnowledgeRetrievalResult,
  InMemoryKnowledgeBaseRetriever,
} from '@pathfinder/ai-knowledge';
import type { KnowledgeGap, SessionCandidate } from '@pathfinder/domain';
import type { ExecutableAgentTool } from './base-tool.js';

export interface KnowledgeBaseSearchInput {
  readonly query?: string;
  readonly gap?: KnowledgeGap;
  readonly topK?: number;
}

export class KnowledgeBaseSearchTool implements ExecutableAgentTool<KnowledgeBaseSearchInput, KnowledgeRetrievalResult> {
  public readonly definition: AgentToolDefinition = {
    name: 'search_knowledge_base',
    description: 'Retrieves relevant conference sessions from Amazon Bedrock Managed Knowledge Base based on semantic similarity or knowledge gaps.',
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'Semantic search text query (e.g. "DynamoDB single table modeling").',
      },
      {
        name: 'topK',
        type: 'number',
        description: 'Maximum number of sessions to retrieve (default: 5).',
      },
    ],
  };

  private readonly retriever: KnowledgeBaseRetriever;

  constructor(retriever?: KnowledgeBaseRetriever, initialSessions?: readonly SessionCandidate[]) {
    this.retriever = retriever ?? new InMemoryKnowledgeBaseRetriever(initialSessions ?? []);
  }

  public async execute(
    input: KnowledgeBaseSearchInput,
    toolUseId = `tu-${Date.now()}`,
  ): Promise<AgentToolResult<KnowledgeRetrievalResult>> {
    try {
      const topK = input.topK ?? 5;
      let result: KnowledgeRetrievalResult;

      if (input.gap) {
        result = await this.retriever.retrieveForGap(input.gap, topK);
      } else {
        const query = input.query ?? '';
        result = await this.retriever.retrieve({
          text: query,
          maxResults: topK,
        });
      }

      return {
        toolUseId,
        isError: false,
        output: result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        toolUseId,
        isError: true,
        output: {
          items: [],
          totalRetrieved: 0,
          query: message,
        },
      };
    }
  }
}
