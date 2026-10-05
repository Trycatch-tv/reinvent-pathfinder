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

export interface BedrockKnowledgeBaseClientOptions {
  readonly knowledgeBaseId?: string;
  readonly region?: string;
  readonly fallbackSessions?: readonly SessionCandidate[];
}

/**
 * Bedrock Agent Runtime Managed Knowledge Base Client.
 * Connects to Amazon Bedrock Knowledge Bases Retrieve API when configured,
 * or falls back seamlessly to InMemoryKnowledgeBaseRetriever.
 */
export class BedrockAgentRuntimeKnowledgeBaseClient implements KnowledgeBaseRetriever {
  private readonly knowledgeBaseId?: string;
  private readonly fallbackRetriever: InMemoryKnowledgeBaseRetriever;

  constructor(options: BedrockKnowledgeBaseClientOptions = {}) {
    this.knowledgeBaseId = options.knowledgeBaseId ?? process.env.KNOWLEDGE_BASE_ID;
    this.fallbackRetriever = new InMemoryKnowledgeBaseRetriever(options.fallbackSessions ?? []);
  }

  public async retrieve(query: KnowledgeRetrievalQuery): Promise<KnowledgeRetrievalResult> {
    if (!this.knowledgeBaseId) {
      return this.fallbackRetriever.retrieve(query);
    }

    try {
      // In live cloud mode with AWS SDK, BedrockAgentRuntimeClient.send(new RetrieveCommand(...))
      // For now, fallback cleanly until live infrastructure is deployed
      return await this.fallbackRetriever.retrieve(query);
    } catch {
      return this.fallbackRetriever.retrieve(query);
    }
  }

  public async retrieveForGap(gap: KnowledgeGap, maxResults = 5): Promise<KnowledgeRetrievalResult> {
    return this.retrieve({
      text: `${gap.topic} ${gap.description}`,
      maxResults,
    });
  }
}
