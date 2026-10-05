import type {
  AgentRunOptions,
  AgentRunResponse,
  AgentRunStep,
} from '@pathfinder/ai-contracts';
import {
  RecommendationsRankTool,
  ScheduleConflictCheckTool,
} from '@pathfinder/ai-tools';
import type { SessionCandidate, KnowledgeGap } from '@pathfinder/domain';
import type { UserScheduleItem } from '@pathfinder/events-client';

export class JourneyRecommendationAgent {
  public readonly agentId = 'journey-recommendation-agent';
  public readonly name = 'Pathfinder Journey & Recommendation Agent';
  public readonly description = 'Evaluates candidate sessions, detects schedule conflicts, and generates an explainable learning path tailored to the attendee journey.';

  public readonly rankTool: RecommendationsRankTool;
  public readonly conflictTool: ScheduleConflictCheckTool;

  constructor() {
    this.rankTool = new RecommendationsRankTool();
    this.conflictTool = new ScheduleConflictCheckTool();
  }

  public async run(options: AgentRunOptions): Promise<AgentRunResponse> {
    const steps: AgentRunStep[] = [];
    const now = new Date().toISOString();

    const gaps = (options.contextVariables?.knowledgeGaps as KnowledgeGap[]) ?? [];
    const candidates = (options.contextVariables?.candidateSessions as SessionCandidate[]) ?? [];
    const scheduleItems = (options.contextVariables?.scheduledItems as UserScheduleItem[]) ?? [];

    // 1. Rank recommendations
    const rankResult = await this.rankTool.execute({
      knowledgeGaps: gaps,
      candidateSessions: candidates,
    });

    steps.push({
      stepIndex: 1,
      thought: 'Filter and rerank sessions using multi-factor scoring against attendee knowledge gaps.',
      toolCalls: [
        {
          toolName: this.rankTool.definition.name,
          toolUseId: rankResult.toolUseId,
          input: { gapsCount: gaps.length, candidatesCount: candidates.length },
        },
      ],
      toolResults: [rankResult],
    });

    // 2. Check conflicts against user schedule
    const conflictResult = await this.conflictTool.execute({
      proposedSessions: candidates,
      scheduledItems: scheduleItems,
    });

    steps.push({
      stepIndex: 2,
      thought: 'Evaluate schedule conflicts against attendee existing reservations and commitments.',
      toolCalls: [
        {
          toolName: this.conflictTool.definition.name,
          toolUseId: conflictResult.toolUseId,
          input: { proposedCount: candidates.length, scheduledCount: scheduleItems.length },
        },
      ],
      toolResults: [conflictResult],
    });

    const recommendationsCount = rankResult.output.recommendations?.length ?? 0;
    const conflictsCount = conflictResult.output?.length ?? 0;

    const output =
      `Journey Synthesis Complete: Generated ${recommendationsCount} explainable session recommendations. ` +
      `Detected ${conflictsCount} schedule conflicts with existing agenda.`;

    return {
      agentId: this.agentId,
      output,
      steps,
      completedAt: now,
      modelId: 'agentcore-runtime-offline-v1',
    };
  }
}
