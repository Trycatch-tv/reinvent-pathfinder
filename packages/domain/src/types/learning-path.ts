import type { ScheduleConflict } from './schedule-conflict.js';

export type LearningPathItemStatus = 'planned' | 'attended' | 'skipped';

export interface LearningPathItem {
  readonly sessionId: string;
  readonly order: number;
  readonly targetGapIds: readonly string[];
  readonly status: LearningPathItemStatus;
}

export interface LearningPath {
  readonly id: string;
  readonly userId: string;
  readonly journeyId: string;
  readonly items: readonly LearningPathItem[];
  readonly conflicts: readonly ScheduleConflict[];
  readonly updatedAt: string;
}
