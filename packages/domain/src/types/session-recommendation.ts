export interface SessionRecommendation {
  readonly sessionId: string;
  readonly sessionCode: string;
  readonly title: string;
  readonly relevanceScore: number; // 0.0 - 1.0
  readonly coveredGapIds: readonly string[];
  readonly explanation: string;
  readonly logisticsScore?: number;
}
