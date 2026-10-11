import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
  type InvokeAgentCommandOutput,
} from '@aws-sdk/client-bedrock-agent-runtime';
import type { AgentRunStep, AgentToolDefinition } from '@pathfinder/ai-contracts';
import type { ExecutableAgentTool } from '@pathfinder/ai-tools';

export interface BedrockAgentCoreConfig {
  readonly agentId?: string;
  readonly bedrockAgentId?: string;
  readonly agentAliasId?: string;
  readonly region?: string;
  readonly client?: BedrockAgentRuntimeClient;
}

export interface BedrockAgentCoreInvocationResult {
  readonly output: string;
  readonly steps: readonly AgentRunStep[];
  readonly modelId: string;
}

/**
 * Invoker for Amazon Bedrock AgentCore Runtime.
 * Dispatches prompts to live Bedrock Agent deployments and decodes stream responses.
 */
export class BedrockAgentCoreInvoker {
  public readonly agentId?: string;
  public readonly agentAliasId: string;
  public readonly region: string;
  private readonly client?: BedrockAgentRuntimeClient;

  constructor(config: BedrockAgentCoreConfig = {}) {
    this.agentId = config.agentId ?? config.bedrockAgentId;
    this.agentAliasId = config.agentAliasId ?? process.env.BEDROCK_AGENT_ALIAS_ID ?? 'TSTALIASID';
    this.region = config.region ?? process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-east-1';

    if (config.client) {
      this.client = config.client;
    } else if (this.agentId) {
      this.client = new BedrockAgentRuntimeClient({ region: this.region });
    }
  }

  public isConfigured(): boolean {
    return Boolean(this.agentId && this.client);
  }

  public async invoke(
    prompt: string,
    sessionId = `session-${Date.now()}`
  ): Promise<BedrockAgentCoreInvocationResult> {
    if (!this.agentId || !this.client) {
      throw new Error('Bedrock AgentCore client is not configured with an agentId');
    }

    const command = new InvokeAgentCommand({
      agentId: this.agentId,
      agentAliasId: this.agentAliasId,
      sessionId,
      inputText: prompt,
    });

    const response: InvokeAgentCommandOutput = await this.client.send(command);
    let outputText = '';
    const steps: AgentRunStep[] = [];
    let stepCount = 0;

    if (response.completion) {
      const decoder = new TextDecoder('utf-8');
      for await (const event of response.completion) {
        if (event.chunk?.bytes) {
          outputText += decoder.decode(event.chunk.bytes);
        }

        // Trace event handling when Bedrock agent returns reasoning / tool invocations
        if (event.trace?.trace) {
          stepCount += 1;
          steps.push({
            stepIndex: stepCount,
            thought: 'Bedrock AgentCore remote step execution',
          });
        }
      }
    }

    return {
      output: outputText.trim() || 'Agent execution completed.',
      steps: steps.length > 0 ? steps : [
        {
          stepIndex: 1,
          thought: 'Bedrock AgentCore managed agent execution',
        },
      ],
      modelId: `bedrock-agentcore-${this.agentId}`,
    };
  }
}

export interface BedrockActionGroupFunction {
  readonly name: string;
  readonly description: string;
  readonly parameters: Record<
    string,
    {
      readonly type: string;
      readonly description: string;
      readonly required: boolean;
    }
  >;
}

export interface BedrockActionGroupManifest {
  readonly actionGroupName: string;
  readonly description: string;
  readonly functions: readonly BedrockActionGroupFunction[];
}

/**
 * Maps an array of ExecutableAgentTools into Bedrock AgentCore Action Group Function definitions.
 */
export function exportActionGroupDefinitions(
  actionGroupName: string,
  description: string,
  tools: readonly (ExecutableAgentTool | { readonly definition: AgentToolDefinition })[]
): BedrockActionGroupManifest {
  const functions: BedrockActionGroupFunction[] = tools.map((tool) => {
    const paramsRecord: Record<string, { type: string; description: string; required: boolean }> = {};
    for (const param of tool.definition.parameters) {
      paramsRecord[param.name] = {
        type: param.type,
        description: param.description,
        required: Boolean(param.required),
      };
    }

    return {
      name: tool.definition.name,
      description: tool.definition.description,
      parameters: paramsRecord,
    };
  });

  return {
    actionGroupName,
    description,
    functions,
  };
}
