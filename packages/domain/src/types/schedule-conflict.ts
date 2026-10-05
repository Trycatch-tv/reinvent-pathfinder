export interface ScheduleConflict {
  readonly sessionAId: string;
  readonly sessionBId: string;
  readonly overlapMinutes: number;
  readonly reason: string;
}
