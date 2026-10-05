export type JourneyPhase = 'before' | 'during' | 'after';

export interface AttendeeJourney {
  readonly id: string;
  readonly userId: string;
  readonly phase: JourneyPhase;
  readonly projectContextId: string;
  readonly learningPathId?: string;
  readonly reflectionsCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}
