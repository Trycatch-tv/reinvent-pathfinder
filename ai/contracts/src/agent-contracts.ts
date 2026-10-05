export interface AgentToolParameter {
  readonly name: string;
  readonly type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  readonly description: string;
  readonly required?: boolean;
}

export interface AgentToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly parameters: readonly AgentToolParameter[];
}

export interface AgentToolCall<T = unknown> {
  readonly toolName: string;
  readonly toolUseId: string;
  readonly input: T;
}

export interface AgentToolResult<T = unknown> {
  readonly toolUseId: string;
  readonly isError?: boolean;
  readonly output: T;
}

export interface AgentMessage {
  readonly role: 'user' | 'assistant' | 'tool';
  readonly content: string;
  readonly toolCalls?: readonly AgentToolCall[];
  readonly toolResults?: readonly AgentToolResult[];
}

export interface AgentRunOptions {
  readonly prompt: string;
  readonly history?: readonly AgentMessage[];
  readonly maxSteps?: number;
  readonly contextVariables?: Record<string, unknown>;
}

export interface AgentRunStep {
  readonly stepIndex: number;
  readonly thought?: string;
  readonly toolCalls?: readonly AgentToolCall[];
  readonly toolResults?: readonly AgentToolResult[];
}

export interface AgentRunResponse {
  readonly agentId: string;
  readonly output: string;
  readonly steps: readonly AgentRunStep[];
  readonly completedAt: string;
  readonly modelId: string;
}
