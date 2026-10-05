import type { KnowledgeGapStatus } from './knowledge-gap.js';

export interface GapUpdateIntent {
  readonly gapId: string;
  readonly newStatus: KnowledgeGapStatus;
  readonly notes?: string;
}

export interface Reflection {
  readonly id: string;
  readonly userId: string;
  readonly sessionId: string;
  readonly rating: number; // 1 - 5
  readonly keyTakeaways: string;
  readonly gapUpdates: readonly GapUpdateIntent[];
  readonly createdAt: string;
}
