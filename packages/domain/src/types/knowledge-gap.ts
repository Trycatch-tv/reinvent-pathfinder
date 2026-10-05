export type KnowledgeGapSeverity = 'critical' | 'important' | 'nice-to-have';

export type KnowledgeGapStatus = 'open' | 'addressed' | 'closed';

export interface KnowledgeGap {
  readonly id: string;
  readonly topic: string;
  readonly description: string;
  readonly targetProficiency: string;
  readonly severity: KnowledgeGapSeverity;
  readonly status: KnowledgeGapStatus;
  readonly rationale: string;
  readonly addressedBySessionIds: readonly string[];
}
