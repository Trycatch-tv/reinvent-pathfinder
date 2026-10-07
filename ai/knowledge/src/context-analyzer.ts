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

import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';

function extractJsonBlock(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return match?.[1] ? match[1].trim() : text.trim();
}

export interface BedrockAnalyzerOptions {
  readonly modelId?: string;
  readonly region?: string;
  readonly bedrockClient?: BedrockRuntimeClient;
}

/**
 * Bedrock Converse API Context Analyzer.
 * Uses structured JSON prompting against Amazon Bedrock foundation models (Claude 3.5 Sonnet / Haiku).
 * Automatically falls back to Heuristic analyzer when AWS is unavailable or calls fail.
 */
export class BedrockContextAnalyzer implements ContextAnalyzerProvider {
  public readonly modelId: string;
  public readonly region: string;
  private readonly fallbackAnalyzer: HeuristicContextAnalyzer;
  private client: BedrockRuntimeClient | null;

  constructor(options: BedrockAnalyzerOptions = {}) {
    this.modelId = options.modelId ?? process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-3-5-sonnet-20241022-v2:0';
    this.region = options.region ?? process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-east-1';
    this.fallbackAnalyzer = new HeuristicContextAnalyzer();
    this.client = options.bedrockClient ?? null;
  }

  private getClient(): BedrockRuntimeClient | null {
    if (this.client) return this.client;
    if (process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION) {
      try {
        this.client = new BedrockRuntimeClient({ region: this.region });
        return this.client;
      } catch {
        return null;
      }
    }
    return null;
  }

  public async analyze(request: AnalyzeContextRequest): Promise<AnalyzeContextResponse> {
    const client = this.getClient();
    if (!client) {
      return this.fallbackAnalyzer.analyze(request);
    }

    try {
      const prompt = `Analiza el siguiente proyecto técnico para el evento AWS re:Invent:
Nombre: ${request.projectName}
Descripción: ${request.description}
Seniority: ${request.seniority ?? 'intermediate'}
Stack actual: ${(request.currentStack ?? []).join(', ') || 'No especificado'}
Objetivos: ${(request.goals ?? []).join('; ') || 'Aprender y construir'}
Restricciones: ${(request.constraints ?? []).join('; ') || 'Ninguna'}

Devuelve un objeto JSON estricto con la siguiente estructura:
{
  "skills": [
    { "topic": "NOMBRE_SKILL", "proficiency": "foundational" | "associate" | "professional" | "specialty" }
  ],
  "targetDomains": ["Dominio 1", "Dominio 2"],
  "knowledgeGaps": [
    {
      "id": "gap-1",
      "topic": "Tema de la brecha",
      "description": "Descripción de la brecha",
      "targetProficiency": "associate",
      "severity": "critical" | "important" | "beneficial",
      "status": "open",
      "rationale": "Por qué es relevante para el proyecto"
    }
  ]
}
Responde ÚNICAMENTE con el bloque JSON válido.`;

      const command = new ConverseCommand({
        modelId: this.modelId,
        messages: [
          {
            role: 'user',
            content: [{ text: prompt }],
          },
        ],
        inferenceConfig: {
          maxTokens: 2048,
          temperature: 0.1,
        },
      });

      const response = await client.send(command);
      const outputText = response.output?.message?.content?.[0]?.text;
      if (!outputText) {
        return this.fallbackAnalyzer.analyze(request);
      }

      const parsed = JSON.parse(extractJsonBlock(outputText));
      if (!parsed || !Array.isArray(parsed.skills) || !Array.isArray(parsed.knowledgeGaps)) {
        return this.fallbackAnalyzer.analyze(request);
      }

      const now = new Date().toISOString();
      const userId = request.userId ?? 'anonymous-attendee';

      const detectedSkills: KnowledgeSkill[] = parsed.skills.map((s: { topic?: unknown; proficiency?: unknown }) => ({
        topic: String(s.topic ?? '').toUpperCase(),
        proficiency: (typeof s.proficiency === 'string' && ['foundational', 'associate', 'professional', 'specialty'].includes(s.proficiency)
          ? s.proficiency
          : 'associate') as SkillProficiency,
      }));

      const targetDomains: string[] = Array.isArray(parsed.targetDomains) && parsed.targetDomains.length > 0
        ? parsed.targetDomains.map(String)
        : ['Cloud Architecture'];

      const knowledgeGaps: KnowledgeGap[] = parsed.knowledgeGaps.map((g: {
        id?: unknown;
        topic?: unknown;
        description?: unknown;
        targetProficiency?: unknown;
        severity?: unknown;
        rationale?: unknown;
      }, index: number) => ({
        id: String(g.id ?? `gap-${index + 1}`),
        topic: String(g.topic ?? 'General Gap'),
        description: String(g.description ?? ''),
        targetProficiency: (typeof g.targetProficiency === 'string' && ['foundational', 'associate', 'professional', 'specialty'].includes(g.targetProficiency)
          ? g.targetProficiency
          : 'associate') as SkillProficiency,
        severity: (typeof g.severity === 'string' && ['critical', 'important', 'beneficial'].includes(g.severity) ? g.severity : 'important') as KnowledgeGap['severity'],
        status: 'open',
        rationale: String(g.rationale ?? ''),
        addressedBySessionIds: [],
      }));

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
        targetDomains,
        updatedAt: now,
      };

      return {
        projectContext,
        knowledgeProfile,
        knowledgeGaps,
        analyzedAt: now,
        modelId: this.modelId,
      };
    } catch {
      return this.fallbackAnalyzer.analyze(request);
    }
  }
}
