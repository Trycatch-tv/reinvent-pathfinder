import type { AgentToolDefinition, AgentToolResult } from '@pathfinder/ai-contracts';
import type { SessionCandidate } from '@pathfinder/domain';
import {
  evaluateScheduleConflicts,
  type EvaluatedScheduleConflict,
  type UserScheduleItem,
} from '@pathfinder/events-client';
import type { ExecutableAgentTool } from './base-tool.js';

export interface ScheduleConflictCheckInput {
  readonly proposedSessions: readonly SessionCandidate[];
  readonly scheduledItems: readonly UserScheduleItem[];
  readonly includeFavorites?: boolean;
}

export class ScheduleConflictCheckTool implements ExecutableAgentTool<ScheduleConflictCheckInput, readonly EvaluatedScheduleConflict[]> {
  public readonly definition: AgentToolDefinition = {
    name: 'check_schedule_conflicts',
    description: 'Checks proposed conference sessions against user personal schedule, reserved sessions and favorites to detect timing overlaps and room/transit conflicts.',
    parameters: [
      {
        name: 'proposedSessions',
        type: 'array',
        description: 'Candidate sessions being considered for addition to the schedule.',
        required: true,
      },
      {
        name: 'scheduledItems',
        type: 'array',
        description: 'Existing schedule items (reservations, personal time, favorites).',
        required: true,
      },
      {
        name: 'includeFavorites',
        type: 'boolean',
        description: 'Whether to treat saved favorites as schedule conflicts (default: false).',
      },
    ],
  };

  public async execute(
    input: ScheduleConflictCheckInput,
    toolUseId = `tu-${Date.now()}`,
  ): Promise<AgentToolResult<readonly EvaluatedScheduleConflict[]>> {
    try {
      const conflicts = evaluateScheduleConflicts(
        input.proposedSessions,
        input.scheduledItems,
        { includeFavorites: input.includeFavorites },
      );

      return {
        toolUseId,
        isError: false,
        output: conflicts,
      };
    } catch {
      return {
        toolUseId,
        isError: true,
        output: [],
      };
    }
  }
}
