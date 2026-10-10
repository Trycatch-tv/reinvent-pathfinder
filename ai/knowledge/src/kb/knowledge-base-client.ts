import type { SessionCandidate, KnowledgeGap } from '@pathfinder/domain';
import type {
  KnowledgeRetrievalQuery,
  KnowledgeRetrievalResult,
  KnowledgeRetrievalItem,
} from './types.js';

export interface KnowledgeBaseRetriever {
  retrieve(query: KnowledgeRetrievalQuery): Promise<KnowledgeRetrievalResult>;
  retrieveForGap(gap: KnowledgeGap, maxResults?: number): Promise<KnowledgeRetrievalResult>;
}

/**
 * In-memory semantic retriever using token similarity and weighted keyword overlap.
 * Enables local development, deterministic unit testing, and offline CI without AWS infrastructure.
 */
export class InMemoryKnowledgeBaseRetriever implements KnowledgeBaseRetriever {
  private readonly sessions: readonly SessionCandidate[];

  constructor(sessions: readonly SessionCandidate[] = []) {
    this.sessions = sessions;
  }

  public async retrieve(query: KnowledgeRetrievalQuery): Promise<KnowledgeRetrievalResult> {
    const queryTokens = this.tokenize(query.text);
    const maxResults = query.maxResults ?? 5;
    const minScore = query.minScore ?? 0.1;

    const scored: KnowledgeRetrievalItem[] = [];

    for (const session of this.sessions) {
      // Apply metadata filters if specified
      if (query.filter?.level && session.level !== query.filter.level) {
        continue;
      }
      if (query.filter?.format && session.format !== query.filter.format) {
        continue;
      }
      if (query.filter?.topic) {
        const targetTopic = query.filter.topic.toLowerCase();
        const hasTopic = session.topics.some((t) => t.toLowerCase().includes(targetTopic));
        if (!hasTopic) continue;
      }

      // Compute similarity score
      const sessionText = `${session.title} ${session.description} ${session.topics.join(' ')}`;
      const sessionTokens = this.tokenize(sessionText);

      const matchedTokens = Array.from(queryTokens).filter((token) => sessionTokens.has(token));
      if (matchedTokens.length === 0) {
        continue;
      }

      // Relevance score: Jaccard overlap + title match boost
      let score = matchedTokens.length / Math.sqrt(queryTokens.size * sessionTokens.size);

      // Boost title matches
      const titleLower = session.title.toLowerCase();
      const titleMatches = matchedTokens.filter((t) => titleLower.includes(t));
      if (titleMatches.length > 0) {
        score += titleMatches.length * 0.2;
      }

      // Bound score between 0 and 1
      const normalizedScore = Math.min(1, Math.round(score * 100) / 100);

      if (normalizedScore >= minScore) {
        const matchedTopics = session.topics.filter((t) =>
          matchedTokens.some((tok) => t.toLowerCase().includes(tok))
        );

        scored.push({
          session,
          score: normalizedScore,
          matchedTopics: matchedTopics.length > 0 ? matchedTopics : session.topics.slice(0, 2),
          excerpt: session.description.slice(0, 160) + (session.description.length > 160 ? '...' : ''),
        });
      }
    }

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);
    const topResults = scored.slice(0, maxResults);

    return {
      items: topResults,
      totalRetrieved: topResults.length,
      query: query.text,
    };
  }

  public async retrieveForGap(gap: KnowledgeGap, maxResults = 5): Promise<KnowledgeRetrievalResult> {
    const queryText = `${gap.topic} ${gap.description} ${gap.rationale}`;
    return this.retrieve({
      text: queryText,
      maxResults,
    });
  }

  private tokenize(text: string): Set<string> {
    const stopWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'in',
      'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with',
    ]);

    return new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 2 && !stopWords.has(t))
    );
  }
}

import {
  BedrockAgentRuntimeClient,
  RetrieveCommand,
  type RetrieveCommandInput,
} from '@aws-sdk/client-bedrock-agent-runtime';

export interface BedrockKnowledgeBaseClientOptions {
  readonly knowledgeBaseId?: string;
  readonly region?: string;
  readonly client?: BedrockAgentRuntimeClient;
  readonly fallbackSessions?: readonly SessionCandidate[];
}

/**
 * Bedrock Agent Runtime Managed Knowledge Base Client.
 * Connects to Amazon Bedrock Knowledge Bases Retrieve API when configured,
 * or falls back seamlessly to InMemoryKnowledgeBaseRetriever.
 */
export class BedrockAgentRuntimeKnowledgeBaseClient implements KnowledgeBaseRetriever {
  public readonly knowledgeBaseId?: string;
  public readonly region: string;
  private readonly client?: BedrockAgentRuntimeClient;
  private readonly fallbackSessions: readonly SessionCandidate[];
  private readonly fallbackRetriever: InMemoryKnowledgeBaseRetriever;

  constructor(options: BedrockKnowledgeBaseClientOptions = {}) {
    this.knowledgeBaseId = options.knowledgeBaseId ?? process.env.KNOWLEDGE_BASE_ID;
    this.region = options.region ?? process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-east-1';
    this.fallbackSessions = options.fallbackSessions ?? [];
    this.fallbackRetriever = new InMemoryKnowledgeBaseRetriever(this.fallbackSessions);

    if (options.client) {
      this.client = options.client;
    } else if (this.knowledgeBaseId) {
      this.client = new BedrockAgentRuntimeClient({ region: this.region });
    }
  }

  public async retrieve(query: KnowledgeRetrievalQuery): Promise<KnowledgeRetrievalResult> {
    if (!this.knowledgeBaseId || !this.client) {
      return this.fallbackRetriever.retrieve(query);
    }

    try {
      const maxResults = query.maxResults ?? 5;
      const minScore = query.minScore ?? 0.1;

      const input: RetrieveCommandInput = {
        knowledgeBaseId: this.knowledgeBaseId,
        retrievalQuery: {
          text: query.text,
        },
        retrievalConfiguration: {
          vectorSearchConfiguration: {
            numberOfResults: maxResults,
          },
        },
      };

      const response = await this.client.send(new RetrieveCommand(input));
      const retrievalResults = response.retrievalResults ?? [];

      if (retrievalResults.length === 0) {
        return {
          items: [],
          totalRetrieved: 0,
          query: query.text,
        };
      }

      const items: KnowledgeRetrievalItem[] = [];

      for (let idx = 0; idx < retrievalResults.length; idx++) {
        const result = retrievalResults[idx];
        if (!result) continue;

        const rawScore = result.score ?? 0.8;
        const normalizedScore = Math.min(1, Math.round(rawScore * 100) / 100);
        if (normalizedScore < minScore) continue;

        const metadata = (result.metadata ?? {}) as Record<string, unknown>;
        const metaSessionId = typeof metadata['sessionId'] === 'string' ? metadata['sessionId'] : undefined;
        const metaCode = typeof metadata['code'] === 'string' ? metadata['code'] : undefined;
        const metaLevel = typeof metadata['level'] === 'number' ? metadata['level'] : undefined;
        const metaFormat = typeof metadata['format'] === 'string' ? metadata['format'] : undefined;
        const metaTopics = Array.isArray(metadata['topics'])
          ? (metadata['topics'] as string[])
          : undefined;

        // Apply metadata filters if present
        if (query.filter?.level && metaLevel !== undefined && metaLevel !== query.filter.level) {
          continue;
        }
        if (query.filter?.format && metaFormat !== undefined && metaFormat !== query.filter.format) {
          continue;
        }
        if (query.filter?.topic && metaTopics) {
          const targetTopic = query.filter.topic.toLowerCase();
          const hasTopic = metaTopics.some((t) => t.toLowerCase().includes(targetTopic));
          if (!hasTopic) continue;
        }

        const content = result.content?.text ?? '';
        const matchedCandidate = this.fallbackSessions.find(
          (s) => (metaSessionId && s.id === metaSessionId) || (metaCode && s.code === metaCode)
        );

        const session: SessionCandidate = matchedCandidate ?? {
          id: metaSessionId ?? `kb-doc-${idx + 1}`,
          code: metaCode ?? `SESS-${idx + 1}`,
          title: this.extractTitleFromContent(content) || 're:Invent Session',
          description: content,
          level: (metaLevel as 100 | 200 | 300 | 400) ?? 200,
          format: (metaFormat as SessionCandidate['format']) ?? 'breakout',
          topics: metaTopics ?? ['AWS', 'Cloud'],
        };

        const excerpt = content.length > 160 ? `${content.slice(0, 160)}...` : content;
        const matchedTopics = session.topics.slice(0, 2);

        items.push({
          session,
          score: normalizedScore,
          matchedTopics: matchedTopics.length > 0 ? matchedTopics : ['Cloud'],
          excerpt: excerpt || session.description,
        });
      }

      return {
        items,
        totalRetrieved: items.length,
        query: query.text,
      };
    } catch {
      return this.fallbackRetriever.retrieve(query);
    }
  }

  public async retrieveForGap(gap: KnowledgeGap, maxResults = 5): Promise<KnowledgeRetrievalResult> {
    const queryText = `${gap.topic} ${gap.description} ${gap.rationale}`;
    return this.retrieve({
      text: queryText,
      maxResults,
    });
  }

  private extractTitleFromContent(content: string): string | undefined {
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.startsWith('Title:')) {
        return line.replace('Title:', '').trim();
      }
    }
    return lines[0]?.trim();
  }
}
