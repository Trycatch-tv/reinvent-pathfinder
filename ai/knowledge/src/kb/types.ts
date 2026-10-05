import type { SessionCandidate } from '@pathfinder/domain';

export interface BedrockDocumentMetadata {
  readonly sessionId: string;
  readonly code: string;
  readonly level: number;
  readonly format: string;
  readonly topics: readonly string[];
  readonly venue?: string;
  readonly day?: string;
  readonly startTime?: string;
  readonly endTime?: string;
}

export interface BedrockKnowledgeDocument {
  readonly id: string;
  readonly content: string;
  readonly metadata: BedrockDocumentMetadata;
}

export interface KnowledgeRetrievalQuery {
  readonly text: string;
  readonly maxResults?: number;
  readonly minScore?: number;
  readonly filter?: {
    readonly level?: number;
    readonly format?: string;
    readonly topic?: string;
  };
}

export interface KnowledgeRetrievalItem {
  readonly session: SessionCandidate;
  readonly score: number;
  readonly matchedTopics: readonly string[];
  readonly excerpt: string;
}

export interface KnowledgeRetrievalResult {
  readonly items: readonly KnowledgeRetrievalItem[];
  readonly totalRetrieved: number;
  readonly query: string;
}
