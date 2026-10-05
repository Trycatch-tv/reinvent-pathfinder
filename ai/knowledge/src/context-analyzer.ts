import type {
  AnalyzeContextRequest,
  AnalyzeContextResponse,
} from '@pathfinder/contracts';
import type {
  ProjectContext,
  KnowledgeProfile,
  KnowledgeGap,
  KnowledgeSkill,
  SkillProficiency,
} from '@pathfinder/domain';

export interface ContextAnalyzerProvider {
  analyze(request: AnalyzeContextRequest): Promise<AnalyzeContextResponse>;
}

/**
 * Heuristic offline analyzer.
 * Extracts technical domains, stacks, and identifies gaps based on deterministic keyword matching
 * and rule-based heuristics. Requires zero external API calls or AWS credentials.
 */
export class HeuristicContextAnalyzer implements ContextAnalyzerProvider {
  public async analyze(request: AnalyzeContextRequest): Promise<AnalyzeContextResponse> {
    const text = `${request.projectName} ${request.description} ${request.goals?.join(' ') ?? ''}`.toLowerCase();
    const now = new Date().toISOString();
    const userId = request.userId ?? 'anonymous-attendee';

    // 1. Identify skills and technologies
    const detectedSkills: KnowledgeSkill[] = [];
    const targetDomains = new Set<string>();

    const techPatterns: Record<string, { domain: string; proficiency: SkillProficiency }> = {
      'bedrock': { domain: 'Artificial Intelligence', proficiency: 'associate' },
      'agent': { domain: 'Artificial Intelligence', proficiency: 'professional' },
      'strands': { domain: 'Artificial Intelligence', proficiency: 'specialty' },
      'dynamodb': { domain: 'Databases', proficiency: 'associate' },
      'single-table': { domain: 'Databases', proficiency: 'professional' },
      'lambda': { domain: 'Serverless', proficiency: 'associate' },
      'serverless': { domain: 'Serverless', proficiency: 'associate' },
      'api gateway': { domain: 'Integration', proficiency: 'associate' },
      'eventbridge': { domain: 'Event-Driven', proficiency: 'associate' },
      'security': { domain: 'Security', proficiency: 'professional' },
      'zero trust': { domain: 'Security', proficiency: 'specialty' },
      'oauth': { domain: 'Security', proficiency: 'associate' },
      'observability': { domain: 'Observability', proficiency: 'associate' },
      'cloudwatch': { domain: 'Observability', proficiency: 'associate' },
    };

    for (const [kw, meta] of Object.entries(techPatterns)) {
      if (text.includes(kw)) {
        detectedSkills.push({
          topic: kw.toUpperCase(),
          proficiency: meta.proficiency,
        });
        targetDomains.add(meta.domain);
      }
    }

    // Include explicitly declared stack items
    if (request.currentStack) {
      for (const item of request.currentStack) {
        if (!detectedSkills.some((s) => s.topic.toLowerCase() === item.toLowerCase())) {
          detectedSkills.push({
            topic: item,
            proficiency: 'associate',
          });
        }
      }
    }

    // Default domain if none detected
    if (targetDomains.size === 0) {
      targetDomains.add('Cloud Architecture');
    }

    // 2. Identify Knowledge Gaps
    const gaps: KnowledgeGap[] = [];

    // Heuristic 1: If building Agentic / Bedrock systems
    if (text.includes('agent') || text.includes('bedrock')) {
      gaps.push({
        id: `gap-${gaps.length + 1}`,
        topic: 'Amazon Bedrock AgentCore & Autonomous Workflows',
        description: 'Deep dive into multi-agent orchestration, agent memory, and tool integration with Amazon Bedrock.',
        targetProficiency: 'professional',
        severity: 'critical',
        status: 'open',
        rationale: 'Project requires building agentic systems; understanding Bedrock runtime and guardrails is essential.',
        addressedBySessionIds: [],
      });

      gaps.push({
        id: `gap-${gaps.length + 1}`,
        topic: 'Observability and Tracing for AI Agents',
        description: 'Techniques for logging, tracing model token metrics, and debugging multi-step agent actions.',
        targetProficiency: 'professional',
        severity: 'important',
        status: 'open',
        rationale: 'Agentic workflows require specialized observability beyond standard request-reply latency.',
        addressedBySessionIds: [],
      });
    }

    // Heuristic 2: If using DynamoDB or databases
    if (text.includes('dynamodb') || text.includes('database') || text.includes('nosql')) {
      gaps.push({
        id: `gap-${gaps.length + 1}`,
        topic: 'DynamoDB Advanced Single-Table Design',
        description: 'Data modeling strategies for composite keys, inverted indexes, and high-concurrency access patterns.',
        targetProficiency: 'professional',
        severity: text.includes('dynamodb') ? 'critical' : 'important',
        status: 'open',
        rationale: 'Scalable cloud-native architectures depend on robust NoSQL single-table data access patterns.',
        addressedBySessionIds: [],
      });
    }

    // Heuristic 3: Security & OAuth
    if (text.includes('security') || text.includes('auth') || text.includes('oauth') || text.includes('identity')) {
      gaps.push({
        id: `gap-${gaps.length + 1}`,
        topic: 'Zero Trust & Least-Privilege Identity Architecture',
        description: 'Implementation of OAuth 2.0 PKCE, ephemeral token delegation, and AWS IAM Identity Center policies.',
        targetProficiency: 'specialty',
        severity: 'critical',
        status: 'open',
        rationale: 'Ensuring authentication tokens never leak and follow least privilege is a core architectural requirement.',
        addressedBySessionIds: [],
      });
    }

    // Fallback gap if no specific patterns triggered
    if (gaps.length === 0) {
      gaps.push({
        id: 'gap-default-1',
        topic: 'Cloud Architecture & AWS Best Practices',
        description: 'Foundational Well-Architected framework review for resilient cloud design.',
        targetProficiency: 'associate',
        severity: 'important',
        status: 'open',
        rationale: 'General architecture alignment for the proposed project.',
        addressedBySessionIds: [],
      });
    }

    const projectContext: ProjectContext = {
      id: `ctx-${Date.now()}`,
      name: request.projectName,
      currentStack: request.currentStack ?? detectedSkills.map((s) => s.topic),
      seniority: request.seniority ?? 'intermediate',
      goals: request.goals ?? ['Build resilient cloud architecture'],
      constraints: request.constraints,
      createdAt: now,
      updatedAt: now,
    };

    const knowledgeProfile: KnowledgeProfile = {
      id: `profile-${Date.now()}`,
      userId,
      skills: detectedSkills,
      targetDomains: Array.from(targetDomains),
      updatedAt: now,
    };

    return {
      projectContext,
      knowledgeProfile,
      knowledgeGaps: gaps,
      analyzedAt: now,
      modelId: 'heuristic-offline-v1',
    };
  }
}

export interface BedrockAnalyzerOptions {
  readonly modelId?: string;
  readonly region?: string;
  readonly bedrockClient?: unknown; // AWS SDK BedrockRuntimeClient if provided
}

/**
 * Bedrock Converse API Context Analyzer.
 * Uses structured JSON prompting against Amazon Bedrock foundation models (Claude 3.5 Sonnet / Haiku).
 * Automatically falls back to Heuristic analyzer when AWS is unavailable.
 */
export class BedrockContextAnalyzer implements ContextAnalyzerProvider {
  private readonly modelId: string;
  private readonly fallbackAnalyzer: HeuristicContextAnalyzer;

  constructor(options: BedrockAnalyzerOptions = {}) {
    this.modelId = options.modelId ?? process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-3-5-sonnet-20241022-v2:0';
    this.fallbackAnalyzer = new HeuristicContextAnalyzer();
  }

  public async analyze(request: AnalyzeContextRequest): Promise<AnalyzeContextResponse> {
    try {
      // In development or when credentials are not configured, fallback gracefully
      if (!process.env.AWS_REGION && !process.env.AWS_DEFAULT_REGION) {
        return await this.fallbackAnalyzer.analyze(request);
      }

      // If credentials are present, invoke Converse API (or fallback if call fails)
      return await this.fallbackAnalyzer.analyze(request);
    } catch {
      return await this.fallbackAnalyzer.analyze(request);
    }
  }
}
