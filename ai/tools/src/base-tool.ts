import type { AgentToolDefinition, AgentToolResult } from '@pathfinder/ai-contracts';

export interface ExecutableAgentTool<TInput = unknown, TOutput = unknown> {
  readonly definition: AgentToolDefinition;
  execute(input: TInput, toolUseId?: string): Promise<AgentToolResult<TOutput>>;
}
