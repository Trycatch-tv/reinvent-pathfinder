import type {
  AgentRunOptions,
  AgentRunResponse,
  AgentRunStep,
} from '@pathfinder/ai-contracts';
import {
  ContextAnalysisTool,
  KnowledgeBaseSearchTool,
} from '@pathfinder/ai-tools';
import type { SessionCandidate } from '@pathfinder/domain';

export class KnowledgeAgent {
  public readonly agentId = 'knowledge-agent';
  public readonly name = 'Pathfinder Knowledge Agent';
  public readonly description = 'Analyzes attendee project architecture, discovers knowledge gaps, and searches the conference catalog via Bedrock Knowledge Bases.';

  public readonly contextAnalysisTool: ContextAnalysisTool;
  public readonly kbSearchTool: KnowledgeBaseSearchTool;

  constructor(options: { catalogSessions?: readonly SessionCandidate[] } = {}) {
    this.contextAnalysisTool = new ContextAnalysisTool();
    this.kbSearchTool = new KnowledgeBaseSearchTool(undefined, options.catalogSessions ?? []);
  }

  public async run(options: AgentRunOptions): Promise<AgentRunResponse> {
    const steps: AgentRunStep[] = [];
    const now = new Date().toISOString();

    // 1. If project details are present in contextVariables, analyze context
    const projectName = (options.contextVariables?.projectName as string) ?? 're:Invent Project';
    const description = (options.contextVariables?.description as string) ?? options.prompt;
    const currentStack = (options.contextVariables?.currentStack as string[]) ?? [];

    const analysisResult = await this.contextAnalysisTool.execute({
      projectName,
      description,
      currentStack,
    });

    steps.push({
      stepIndex: 1,
      thought: 'Analyze project context to derive KnowledgeProfile and open KnowledgeGaps.',
      toolCalls: [
        {
          toolName: this.contextAnalysisTool.definition.name,
          toolUseId: analysisResult.toolUseId,
          input: { projectName, description, currentStack },
        },
      ],
      toolResults: [analysisResult],
    });

    // 2. For the top gap identified, search Bedrock Knowledge Base
    const topGap = analysisResult.output.knowledgeGaps?.[0];
    let kbResult;
    if (topGap) {
      kbResult = await this.kbSearchTool.execute({
        gap: topGap,
        topK: 5,
      });

      steps.push({
        stepIndex: 2,
        thought: `Search Knowledge Base for sessions addressing top gap: "${topGap.topic}".`,
        toolCalls: [
          {
            toolName: this.kbSearchTool.definition.name,
            toolUseId: kbResult.toolUseId,
            input: { gapTopic: topGap.topic },
          },
        ],
        toolResults: [kbResult],
      });
    }

    const gapsCount = analysisResult.output.knowledgeGaps?.length ?? 0;
    const retrievedSessionsCount = kbResult?.output?.items?.length ?? 0;

    const output =
      `Knowledge Analysis Complete: Identified ${gapsCount} knowledge gaps for project "${projectName}". ` +
      `Retrieved ${retrievedSessionsCount} relevant catalog sessions from Knowledge Base addressing key gaps.`;

    return {
      agentId: this.agentId,
      output,
      steps,
      completedAt: now,
      modelId: 'agentcore-runtime-offline-v1',
    };
  }
}
